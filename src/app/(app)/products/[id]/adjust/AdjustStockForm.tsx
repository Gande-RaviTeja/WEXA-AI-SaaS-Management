'use client'

import { useActionState } from 'react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/Toast'
import type { ProductActionResult } from '@/actions/products'
import { adjustStockAction } from '@/actions/products'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

interface AdjustStockFormProps {
  productId: string
  productName: string
  currentQty: number
}

export function AdjustStockForm({ productId, productName, currentQty }: AdjustStockFormProps) {
  const { toast } = useToast()
  const router = useRouter()
  const boundAction = adjustStockAction.bind(null, productId)
  const [state, formAction, isPending] = useActionState<ProductActionResult | null, FormData>(
    boundAction,
    null,
  )

  useEffect(() => {
    if (state?.message === 'Stock updated successfully') {
      toast('Stock updated', 'success')
      router.push('/products')
    } else if (state?.message) {
      toast(state.message, 'error')
    }
  }, [state, toast, router])

  return (
    <form action={formAction} className="space-y-5">
      <div className="rounded-lg bg-gray-50 border border-gray-200 px-4 py-3 text-sm">
        <span className="text-gray-500">Current quantity: </span>
        <span className="font-semibold text-gray-900">{currentQty}</span>
      </div>

      <div>
        <Label htmlFor="delta">Adjustment (+/−)</Label>
        <Input
          id="delta"
          name="delta"
          type="number"
          step="1"
          defaultValue={1}
          placeholder="e.g. +10 or -5"
          className="mt-1"
          error={!!state?.errors?.delta}
        />
        <p className="mt-1 text-xs text-gray-400">
          Positive to add stock, negative to remove.
        </p>
        {state?.errors?.delta && (
          <p className="mt-1 text-xs text-red-600">{state.errors.delta[0]}</p>
        )}
      </div>

      <div>
        <Label htmlFor="note">Note (optional)</Label>
        <textarea
          id="note"
          name="note"
          rows={2}
          placeholder="Reason for adjustment…"
          className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={isPending}>
          {isPending ? 'Saving…' : 'Apply adjustment'}
        </Button>
      </div>
    </form>
  )
}
