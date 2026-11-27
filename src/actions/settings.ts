'use server'

import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'
import { redirect } from 'next/navigation'
import bcrypt from 'bcryptjs'
import {
  settingsSchema,
  updateOrgProfileSchema,
  changePasswordSchema,
} from '@/lib/validators/settings'
import { updateOrgThreshold, updateOrgName } from '@/lib/data/organizations'
import { getUserById, updateUserPassword } from '@/lib/data/users'

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
  revalidatePath('/products')
  return { success: true, message: 'Inventory threshold saved successfully' }
}

export async function updateOrgNameAction(
  _prev: SettingsActionResult | null,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    name: formData.get('name'),
  }

  const parsed = updateOrgProfileSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  await updateOrgName(session.organizationId, parsed.data.name)

  revalidatePath('/settings')
  revalidatePath('/', 'layout')
  return { success: true, message: 'Organization name updated successfully' }
}

export async function changePasswordAction(
  _prev: SettingsActionResult | null,
  formData: FormData,
): Promise<SettingsActionResult> {
  const session = await getSession()
  if (!session) redirect('/login')

  const raw = {
    currentPassword: formData.get('currentPassword'),
    newPassword: formData.get('newPassword'),
    confirmPassword: formData.get('confirmPassword'),
  }

  const parsed = changePasswordSchema.safeParse(raw)
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors }
  }

  const user = await getUserById(session.userId)
  if (!user) {
    return { message: 'User account not found' }
  }

  const isValidCurrent = await bcrypt.compare(
    parsed.data.currentPassword,
    user.passwordHash,
  )

  if (!isValidCurrent) {
    return {
      errors: {
        currentPassword: ['Current password is incorrect'],
      },
    }
  }

  const newHash = await bcrypt.hash(parsed.data.newPassword, 12)
  await updateUserPassword(session.userId, newHash)

  revalidatePath('/settings')
  return { success: true, message: 'Password changed successfully' }
}
