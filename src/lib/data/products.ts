import { prisma } from '../prisma'
import { productSchema, adjustSchema, ProductInput, AdjustInput } from '../validators/product'

// ─── Types ───────────────────────────────────────────────────────────────────

export type ProductRow = {
  id: string
  name: string
  sku: string
  description: string | null
  quantity: number
  costPrice: number | null
  sellingPrice: number | null
  lowStockThreshold: number | null
  lastUpdatedBy: string | null
  createdAt: Date
  updatedAt: Date
}

export type DashboardStats = {
  totalProducts: number
  totalQuantity: number
  lowStockItems: Array<{
    id: string
    name: string
    sku: string
    quantity: number
    effectiveThreshold: number
  }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Pure function — also used in unit tests */
export function isLowStock(
  quantity: number,
  productThreshold: number | null,
  orgThreshold: number,
): boolean {
  const threshold = productThreshold ?? orgThreshold
  return quantity <= threshold
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export async function listProducts(organizationId: string): Promise<ProductRow[]> {
  return prisma.product.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
    select: {
      id: true,
      name: true,
      sku: true,
      description: true,
      quantity: true,
      costPrice: true,
      sellingPrice: true,
      lowStockThreshold: true,
      lastUpdatedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getProduct(
  id: string,
  organizationId: string,
): Promise<ProductRow | null> {
  return prisma.product.findFirst({
    where: { id, organizationId },
    select: {
      id: true,
      name: true,
      sku: true,
      description: true,
      quantity: true,
      costPrice: true,
      sellingPrice: true,
      lowStockThreshold: true,
      lastUpdatedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function createProduct(
  organizationId: string,
  data: ProductInput,
): Promise<ProductRow> {
  return prisma.product.create({
    data: {
      organizationId,
      name: data.name,
      sku: data.sku,
      description: data.description || null,
      quantity: data.quantity,
      costPrice: data.costPrice ?? null,
      sellingPrice: data.sellingPrice ?? null,
      lowStockThreshold: data.lowStockThreshold ?? null,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      description: true,
      quantity: true,
      costPrice: true,
      sellingPrice: true,
      lowStockThreshold: true,
      lastUpdatedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function updateProduct(
  id: string,
  organizationId: string,
  data: ProductInput,
): Promise<ProductRow | null> {
  // Confirm it belongs to org first
  const existing = await prisma.product.findFirst({ where: { id, organizationId } })
  if (!existing) return null

  return prisma.product.update({
    where: { id },
    data: {
      name: data.name,
      sku: data.sku,
      description: data.description || null,
      quantity: data.quantity,
      costPrice: data.costPrice ?? null,
      sellingPrice: data.sellingPrice ?? null,
      lowStockThreshold: data.lowStockThreshold ?? null,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      description: true,
      quantity: true,
      costPrice: true,
      sellingPrice: true,
      lowStockThreshold: true,
      lastUpdatedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function deleteProduct(
  id: string,
  organizationId: string,
): Promise<boolean> {
  const existing = await prisma.product.findFirst({ where: { id, organizationId } })
  if (!existing) return false
  await prisma.product.delete({ where: { id } })
  return true
}

export async function adjustStock(
  id: string,
  organizationId: string,
  delta: number,
  _note: string | undefined,
  userId: string,
): Promise<ProductRow | null> {
  const existing = await prisma.product.findFirst({ where: { id, organizationId } })
  if (!existing) return null

  const newQty = Math.max(0, existing.quantity + delta)

  return prisma.product.update({
    where: { id },
    data: {
      quantity: newQty,
      lastUpdatedBy: userId,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      description: true,
      quantity: true,
      costPrice: true,
      sellingPrice: true,
      lowStockThreshold: true,
      lastUpdatedBy: true,
      createdAt: true,
      updatedAt: true,
    },
  })
}

export async function getDashboardStats(
  organizationId: string,
  orgThreshold: number,
): Promise<DashboardStats> {
  const products = await prisma.product.findMany({
    where: { organizationId },
    select: {
      id: true,
      name: true,
      sku: true,
      quantity: true,
      lowStockThreshold: true,
    },
  })

  const totalProducts = products.length
  const totalQuantity = products.reduce((sum, p) => sum + p.quantity, 0)

  const lowStockItems = products
    .filter((p) => isLowStock(p.quantity, p.lowStockThreshold, orgThreshold))
    .map((p) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      quantity: p.quantity,
      effectiveThreshold: p.lowStockThreshold ?? orgThreshold,
    }))
    .sort((a, b) => a.quantity - b.quantity)

  return { totalProducts, totalQuantity, lowStockItems }
}
