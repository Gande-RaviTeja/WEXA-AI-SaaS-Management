'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { settingsSchema } from '@/lib/validators/settings'
import { updateOrgThreshold } from '@/lib/data/organizations'

export type SettingsActionResult = {
  errors?: Record<string, string[]>
  message?: string
  success?: boolean
}

export async function updateSettingsAction(
  _prev: SettingsActionResult | null,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    defaultLowStockThreshold: Number(formData.get('defaultLowStockThreshold')),
  }

  const parsed = settingsSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await updateOrgThreshold(session.organizationId, parsed.data.defaultLowStockThreshold)

  revalidatePath('/settings')
  revalidatePath('/dashboard')
  return { success: true, message: 'Settings saved successfully' }
}
