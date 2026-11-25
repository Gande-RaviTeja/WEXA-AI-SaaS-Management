// Tenant isolation tests
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../src/lib/prisma'
import {
  listProducts,
  getProduct,
  updateProduct,
  deleteProduct,
} from '../src/lib/data/products'

let orgAId: string
let orgBId: string
let orgAProductId: string
let orgBProductId: string

beforeAll(async () => {
  // Clean up any previous test runs
  const existingOrgs = await prisma.organization.findMany({
    where: { name: { in: ['Isolation Org A', 'Isolation Org B'] } },
  })
  const existingIds = existingOrgs.map((o) => o.id)
  if (existingIds.length > 0) {
    await prisma.product.deleteMany({ where: { organizationId: { in: existingIds } } })
    await prisma.organization.deleteMany({ where: { id: { in: existingIds } } })
  }

  const orgA = await prisma.organization.create({
    data: { name: 'Isolation Org A', defaultLowStockThreshold: 5 },
  })
  orgAId = orgA.id

  const orgB = await prisma.organization.create({
    data: { name: 'Isolation Org B', defaultLowStockThreshold: 5 },
  })
  orgBId = orgB.id

  // Product in Org A
  const productA = await prisma.product.create({
    data: { organizationId: orgAId, name: 'Widget A', sku: 'WGT-001', quantity: 10 },
  })
  orgAProductId = productA.id

  // Product in Org B (same SKU — allowed across organizations)
  const productB = await prisma.product.create({
    data: { organizationId: orgBId, name: 'Widget B', sku: 'WGT-001', quantity: 20 },
  })
  orgBProductId = productB.id
})

afterAll(async () => {
  await prisma.product.deleteMany({ where: { organizationId: { in: [orgAId, orgBId] } } })
  await prisma.organization.deleteMany({ where: { id: { in: [orgAId, orgBId] } } })
})

describe('Tenant isolation — listProducts', () => {
  it('Org A only sees its own products', async () => {
    const products = await listProducts(orgAId)
    const ids = products.map((p) => p.id)
    expect(ids).toContain(orgAProductId)
    expect(ids).not.toContain(orgBProductId)
  })

  it('Org B only sees its own products', async () => {
    const products = await listProducts(orgBId)
    const ids = products.map((p) => p.id)
    expect(ids).toContain(orgBProductId)
    expect(ids).not.toContain(orgAProductId)
  })
})

describe('Tenant isolation — getProduct', () => {
  it('Org A cannot read Org B product by guessing ID', async () => {
    const result = await getProduct(orgBProductId, orgAId)
    expect(result).toBeNull()
  })

  it('Org B cannot read Org A product by guessing ID', async () => {
    const result = await getProduct(orgAProductId, orgBId)
    expect(result).toBeNull()
  })

  it('Org A can read its own product', async () => {
    const result = await getProduct(orgAProductId, orgAId)
    expect(result).not.toBeNull()
    expect(result!.id).toBe(orgAProductId)
  })
})

describe('Tenant isolation — updateProduct', () => {
  it('Org A cannot update Org B product', async () => {
    const result = await updateProduct(orgBProductId, orgAId, {
      name: 'Hacked',
      sku: 'HACK-001',
      quantity: 999,
    })
    expect(result).toBeNull()

    // Verify the product is unchanged
    const unchanged = await getProduct(orgBProductId, orgBId)
    expect(unchanged?.name).toBe('Widget B')
  })
})

describe('Tenant isolation — deleteProduct', () => {
  it('Org A cannot delete Org B product', async () => {
    const deleted = await deleteProduct(orgBProductId, orgAId)
    expect(deleted).toBe(false)

    // Verify product still exists
    const stillThere = await getProduct(orgBProductId, orgBId)
    expect(stillThere).not.toBeNull()
  })
})

describe('SKU uniqueness', () => {
  it('allows the same SKU across different organizations', async () => {
    const aProduct = await getProduct(orgAProductId, orgAId)
    const bProduct = await getProduct(orgBProductId, orgBId)
    expect(aProduct?.sku).toBe('WGT-001')
    expect(bProduct?.sku).toBe('WGT-001')
  })

  it('rejects duplicate SKU within the same organization', async () => {
    await expect(
      prisma.product.create({
        data: {
          organizationId: orgAId,
          name: 'Duplicate Widget',
          sku: 'WGT-001', // already exists in orgA
          quantity: 5,
        },
      }),
    ).rejects.toThrow()
  })
})
