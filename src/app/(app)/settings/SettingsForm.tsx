'use client'

import { useActionState, useEffect } from 'react'
import { updateSettingsAction, type SettingsActionResult } from '@/actions/settings'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'
import { useToast } from '@/components/ui/Toast'

interface SettingsFormProps {
  currentThreshold: number
}

export function SettingsForm({ currentThreshold }: SettingsFormProps) {
  const { toast } = useToast()
  const [state, formAction, isPending] = useActionState<SettingsActionResult | null, FormData>(
    updateSettingsAction,
    null,
  )

  useEffect(() => {
    if (state?.success) {
      toast('Settings saved', 'success')
    } else if (state?.message && !state?.success) {
      toast(state.message, 'error')
    }
  }, [state, toast])

  return (
    <form action={formAction} className="space-y-6">
      <div>
        <Label htmlFor="defaultLowStockThreshold">Default low stock threshold</Label>
        <div className="mt-1 max-w-xs">
          <Input
            id="defaultLowStockThreshold"
            name="defaultLowStockThreshold"
            type="number"
            min="0"
            step="1"
            defaultValue={currentThreshold}
            error={!!state?.errors?.defaultLowStockThreshold}
          />
        </div>
        <p className="mt-2 text-sm text-gray-500">
          Products with quantity at or below this number are flagged as low stock.
          Individual products can override this value.
        </p>
        {state?.errors?.defaultLowStockThreshold && (
          <p className="mt-1 text-sm text-red-600">
            {state.errors.defaultLowStockThreshold[0]}
          </p>
        )}
      </div>

      <div className="flex gap-3">
        <Button type="submit" loading={isPending}>
          {isPending ? 'Saving…' : 'Save settings'}
        </Button>
      </div>
    </form>
  )
}
