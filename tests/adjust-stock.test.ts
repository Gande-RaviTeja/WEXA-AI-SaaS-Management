import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { prisma } from '../src/lib/prisma'
import { createProduct, getProduct, adjustStock, deleteProduct } from '../src/lib/data/products'

describe('M5 — Adjust Stock Control', () => {
  let orgId: string
  let otherOrgId: string
  let productId: string

  beforeAll(async () => {
    let org = await prisma.organization.findFirst({ where: { name: 'Acme Hardware' } })
    if (!org) {
      org = await prisma.organization.create({ data: { name: 'Acme Hardware', defaultLowStockThreshold: 5 } })
    }
    orgId = org.id

    let otherOrg = await prisma.organization.findFirst({ where: { name: 'Blue Nile Electronics' } })
    if (!otherOrg) {
      otherOrg = await prisma.organization.create({ data: { name: 'Blue Nile Electronics', defaultLowStockThreshold: 10 } })
    }
    otherOrgId = otherOrg.id

    // Create a product with initial qty 20
    const p = await createProduct(orgId, {
      name: 'Adjust Test Item',
      sku: 'ADJ-TEST-01',
      quantity: 20,
    })
    productId = p.id
  })

  afterAll(async () => {
    if (productId) {
      await deleteProduct(productId, orgId)
    }
  })

  it('increases stock when given a positive delta', async () => {
    const updated = await adjustStock(productId, orgId, 5, 'Received new shipment', 'user-alice')
    expect(updated).not.toBeNull()
    expect(updated?.quantity).toBe(25)
    expect(updated?.lastUpdatedBy).toBe('user-alice')
  })

  it('decreases stock when given a negative delta', async () => {
    const updated = await adjustStock(productId, orgId, -10, 'Damaged items written off', 'user-bob')
    expect(updated).not.toBeNull()
    expect(updated?.quantity).toBe(15)
    expect(updated?.lastUpdatedBy).toBe('user-bob')
  })

  it('clamps stock to minimum 0 if negative delta exceeds current quantity', async () => {
    const updated = await adjustStock(productId, orgId, -50, 'Excess reduction', 'user-admin')
    expect(updated).not.toBeNull()
    expect(updated?.quantity).toBe(0)
  })

  it('rejects adjustment from another tenant', async () => {
    const result = await adjustStock(productId, otherOrgId, 100, 'Malicious update', 'hacker')
    expect(result).toBeNull()

    // Confirm product quantity in original org is unchanged (still 0 from previous test)
    const current = await getProduct(productId, orgId)
    expect(current?.quantity).toBe(0)
  })
})
