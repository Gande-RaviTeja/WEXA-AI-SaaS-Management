'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import type { ProductActionResult } from '@/actions/products'

interface ProductFormProps {
  action: (prev: ProductActionResult | null, formData: FormData) => Promise<ProductActionResult>
  defaultValues?: {
    name?: string
    sku?: string
    description?: string
    quantity?: number
    costPrice?: number | null
    sellingPrice?: number | null
    lowStockThreshold?: number | null
  }
  submitLabel?: string
}

export function ProductForm({ action, defaultValues, submitLabel = 'Save product' }: ProductFormProps) {
  const [state, formAction, isPending] = useActionState<ProductActionResult | null, FormData>(
    action,
    null,
  )

  function field(name: string) {
    return state?.errors?.[name]
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.message && (
        <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.message}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Name */}
        <div className="sm:col-span-2">
          <Label htmlFor="name">Product name <span className="text-red-500">*</span></Label>
          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={defaultValues?.name}
            placeholder="e.g. Steel Hammer"
            className="mt-1"
            error={!!field('name')}
          />
          {field('name') && <p className="mt-1 text-xs text-red-600">{field('name')![0]}</p>}
        </div>

        {/* SKU */}
        <div>
          <Label htmlFor="sku">SKU <span className="text-red-500">*</span></Label>
          <Input
            id="sku"
            name="sku"
            type="text"
            defaultValue={defaultValues?.sku}
            placeholder="e.g. HMR-001"
            className="mt-1 font-mono"
            error={!!field('sku')}
          />
          {field('sku') && <p className="mt-1 text-xs text-red-600">{field('sku')![0]}</p>}
        </div>

        {/* Quantity */}
        <div>
          <Label htmlFor="quantity">Quantity <span className="text-red-500">*</span></Label>
          <Input
            id="quantity"
            name="quantity"
            type="number"
            min="0"
            step="1"
            defaultValue={defaultValues?.quantity ?? 0}
            className="mt-1"
            error={!!field('quantity')}
          />
          {field('quantity') && <p className="mt-1 text-xs text-red-600">{field('quantity')![0]}</p>}
        </div>

        {/* Cost price */}
        <div>
          <Label htmlFor="costPrice">Cost price ($)</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.costPrice ?? ''}
            placeholder="0.00"
            className="mt-1"
            error={!!field('costPrice')}
          />
          {field('costPrice') && <p className="mt-1 text-xs text-red-600">{field('costPrice')![0]}</p>}
        </div>

        {/* Selling price */}
        <div>
          <Label htmlFor="sellingPrice">Selling price ($)</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            defaultValue={defaultValues?.sellingPrice ?? ''}
            placeholder="0.00"
            className="mt-1"
            error={!!field('sellingPrice')}
          />
          {field('sellingPrice') && <p className="mt-1 text-xs text-red-600">{field('sellingPrice')![0]}</p>}
        </div>

        {/* Low stock threshold */}
        <div>
          <Label htmlFor="lowStockThreshold">Low stock threshold</Label>
          <Input
            id="lowStockThreshold"
            name="lowStockThreshold"
            type="number"
            min="0"
            step="1"
            defaultValue={defaultValues?.lowStockThreshold ?? ''}
            placeholder="Leave blank to use org default"
            className="mt-1"
            error={!!field('lowStockThreshold')}
          />
          <p className="mt-1 text-xs text-gray-400">Leave blank to use the organization default</p>
          {field('lowStockThreshold') && <p className="mt-1 text-xs text-red-600">{field('lowStockThreshold')![0]}</p>}
        </div>

        {/* Description */}
        <div className="sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={defaultValues?.description ?? ''}
            placeholder="Optional product description…"
            className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
          />
          {field('description') && <p className="mt-1 text-xs text-red-600">{field('description')![0]}</p>}
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {isPending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </form>
  )
}
