'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth'
import { productSchema, adjustSchema } from '@/lib/validators/product'
import {
  createProduct,
  updateProduct,
  deleteProduct,
  adjustStock,
} from '@/lib/data/products'
import { Prisma } from '@prisma/client'

export type ProductActionResult = {
  errors?: Record<string, string[]>
  message?: string
}

function handlePrismaError(e: unknown): ProductActionResult {
  if (
    e instanceof Prisma.PrismaClientKnownRequestError &&
    e.code === 'P2002'
  ) {
    return {
      errors: { sku: ['A product with this SKU already exists in your organization'] },
    }
  }
  return { message: 'Something went wrong. Please try again.' }
}

function parseOptionalNumber(val: FormDataEntryValue | null): number | null {
  if (val === null || val === undefined) return null
  const s = val.toString().trim()
  if (s === '') return null
  const n = Number(s)
  return isNaN(n) ? null : n
}

export async function createProductAction(
  _prev: ProductActionResult | null,
  formData: FormData,
): Promise<ProductActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description') || '',
    quantity: Number(formData.get('quantity')),
    costPrice: parseOptionalNumber(formData.get('costPrice')),
    sellingPrice: parseOptionalNumber(formData.get('sellingPrice')),
    lowStockThreshold: parseOptionalNumber(formData.get('lowStockThreshold')),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    await createProduct(session.organizationId, parsed.data)
  } catch (e) {
    return handlePrismaError(e)
  }

  revalidatePath('/products')
  revalidatePath('/dashboard')
  redirect('/products')
}

export async function updateProductAction(
  id: string,
  _prev: ProductActionResult | null,
  formData: FormData,
): Promise<ProductActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    name: formData.get('name'),
    sku: formData.get('sku'),
    description: formData.get('description') || '',
    quantity: Number(formData.get('quantity')),
    costPrice: parseOptionalNumber(formData.get('costPrice')),
    sellingPrice: parseOptionalNumber(formData.get('sellingPrice')),
    lowStockThreshold: parseOptionalNumber(formData.get('lowStockThreshold')),
  }

  const parsed = productSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  try {
    const product = await updateProduct(id, session.organizationId, parsed.data)
    if (!product) return { message: 'Product not found' }
  } catch (e) {
    return handlePrismaError(e)
  }

  revalidatePath('/products')
  revalidatePath('/dashboard')
  redirect('/products')
}

export async function deleteProductAction(
  id: string,
): Promise<ProductActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const deleted = await deleteProduct(id, session.organizationId)
  if (!deleted) return { message: 'Product not found' }

  revalidatePath('/products')
  revalidatePath('/dashboard')
  return { message: 'Product deleted successfully' }
}

export async function adjustStockAction(
  id: string,
  _prev: ProductActionResult | null,
  formData: FormData,
): Promise<ProductActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    delta: Number(formData.get('delta')),
    note: formData.get('note') || '',
  }

  const parsed = adjustSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const result = await adjustStock(
    id,
    session.organizationId,
    parsed.data.delta,
    parsed.data.note || undefined,
    session.userId,
  )

  if (!result) return { message: 'Product not found' }

  revalidatePath('/products')
  revalidatePath('/dashboard')
  return { message: 'Stock updated successfully' }
}
