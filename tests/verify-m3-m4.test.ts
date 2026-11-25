import { describe, it, expect, beforeAll } from 'vitest'
import {
  listProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getDashboardStats,
  isLowStock,
} from '../src/lib/data/products'
import { getOrg, updateOrgThreshold } from '../src/lib/data/organizations'
import { prisma } from '../src/lib/prisma'

describe('M3 & M4 — Product CRUD, Data Isolation, Dashboard & Settings', () => {
  let orgAId: string
  let orgBId: string
  let createdProductId: string

  beforeAll(async () => {
    // Find or create test orgs
    let orgA = await prisma.organization.findFirst({ where: { name: 'Acme Hardware' } })
    if (!orgA) {
      orgA = await prisma.organization.create({ data: { name: 'Acme Hardware', defaultLowStockThreshold: 5 } })
    }
    orgAId = orgA.id

    let orgB = await prisma.organization.findFirst({ where: { name: 'Blue Nile Electronics' } })
    if (!orgB) {
      orgB = await prisma.organization.create({ data: { name: 'Blue Nile Electronics', defaultLowStockThreshold: 10 } })
    }
    orgBId = orgB.id

    // Clean up any previous test products
    await prisma.product.deleteMany({
      where: { sku: { in: ['TEST-SKU-99', 'TEST-DUPE-01', 'TEST-CROSS-01'] } },
    })
  })

  // ─── M3: Product CRUD ────────────────────────────────────────────────────────

  it('creates a new product scoped to Org A', async () => {
    const product = await createProduct(orgAId, {
      name: 'Test Precision Caliper',
      sku: 'TEST-SKU-99',
      description: 'Digital 6-inch caliper',
      quantity: 15,
      costPrice: 12.5,
      sellingPrice: 29.99,
      lowStockThreshold: 4,
    })

    expect(product).toBeDefined()
    expect(product.id).toBeDefined()
    expect(product.sku).toBe('TEST-SKU-99')
    expect(product.quantity).toBe(15)
    createdProductId = product.id
  })

  it('reads product within Org A', async () => {
    const product = await getProduct(createdProductId, orgAId)
    expect(product).not.toBeNull()
    expect(product?.name).toBe('Test Precision Caliper')
  })

  it('fails to read Org A product when queried by Org B (tenant isolation)', async () => {
    const product = await getProduct(createdProductId, orgBId)
    expect(product).toBeNull()
  })

  it('updates product within Org A', async () => {
    const updated = await updateProduct(createdProductId, orgAId, {
      name: 'Test Precision Caliper Updated',
      sku: 'TEST-SKU-99',
      quantity: 2, // will be low stock
      costPrice: 15.0,
      sellingPrice: 34.99,
      lowStockThreshold: 4,
    })

    expect(updated).not.toBeNull()
    expect(updated?.name).toBe('Test Precision Caliper Updated')
    expect(updated?.quantity).toBe(2)
  })

  it('fails to update Org A product when attempted by Org B', async () => {
    const result = await updateProduct(createdProductId, orgBId, {
      name: 'Hacked by Org B',
      sku: 'HACKED-SKU',
      quantity: 999,
    })

    expect(result).toBeNull()

    // Verify it was NOT modified
    const original = await getProduct(createdProductId, orgAId)
    expect(original?.name).toBe('Test Precision Caliper Updated')
  })

  it('enforces SKU uniqueness per organization', async () => {
    // Creating duplicate SKU in same org must throw unique constraint error
    await expect(
      createProduct(orgAId, {
        name: 'Another Caliper',
        sku: 'TEST-SKU-99', // same SKU in Org A
        quantity: 5,
      }),
    ).rejects.toThrow()
  })

  it('allows the same SKU in a different organization', async () => {
    // Same SKU in Org B must succeed
    const orgBProduct = await createProduct(orgBId, {
      name: 'Org B Caliper',
      sku: 'TEST-SKU-99', // same SKU in Org B
      quantity: 8,
    })

    expect(orgBProduct).toBeDefined()
    expect(orgBProduct.sku).toBe('TEST-SKU-99')

    // Clean it up
    await deleteProduct(orgBProduct.id, orgBId)
  })

  it('fails to delete Org A product when attempted by Org B', async () => {
    const deleted = await deleteProduct(createdProductId, orgBId)
    expect(deleted).toBe(false)

    // Verify product still exists
    const stillExists = await getProduct(createdProductId, orgAId)
    expect(stillExists).not.toBeNull()
  })

  it('deletes product successfully when queried with matching Org A', async () => {
    const deleted = await deleteProduct(createdProductId, orgAId)
    expect(deleted).toBe(true)

    const check = await getProduct(createdProductId, orgAId)
    expect(check).toBeNull()
  })

  // ─── M4: Dashboard Stats & Low Stock Rule ───────────────────────────────────

  it('correctly evaluates low-stock rule with product-level and org-level thresholds', () => {
    // Case 1: Qty below org default (5) when product has no custom threshold
    expect(isLowStock(3, null, 5)).toBe(true)
    // Case 2: Qty exactly at org default (5)
    expect(isLowStock(5, null, 5)).toBe(true)
    // Case 3: Qty above org default (5)
    expect(isLowStock(6, null, 5)).toBe(false)
    // Case 4: Product threshold overrides org default
    expect(isLowStock(8, 10, 5)).toBe(true) // qty 8 <= custom threshold 10
    expect(isLowStock(8, 7, 10)).toBe(false) // qty 8 > custom threshold 7
  })

  it('computes accurate dashboard stats for an organization', async () => {
    const stats = await getDashboardStats(orgAId, 5)

    expect(stats.totalProducts).toBeGreaterThanOrEqual(5)
    expect(stats.totalQuantity).toBeGreaterThan(0)
    expect(Array.isArray(stats.lowStockItems)).toBe(true)

    // Every item in lowStockItems must have quantity <= effectiveThreshold
    for (const item of stats.lowStockItems) {
      expect(item.quantity).toBeLessThanOrEqual(item.effectiveThreshold)
    }
  })

  // ─── M4: Settings ──────────────────────────────────────────────────────────

  it('reads and updates organization default low-stock threshold', async () => {
    const initialOrg = await getOrg(orgAId)
    expect(initialOrg).not.toBeNull()
    const originalThreshold = initialOrg!.defaultLowStockThreshold

    // Update threshold to 8
    const updated = await updateOrgThreshold(orgAId, 8)
    expect(updated.defaultLowStockThreshold).toBe(8)

    // Re-read from DB
    const refetched = await getOrg(orgAId)
    expect(refetched?.defaultLowStockThreshold).toBe(8)

    // Restore original threshold
    await updateOrgThreshold(orgAId, originalThreshold)
  })
})
