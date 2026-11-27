import { z } from 'zod'

export const settingsSchema = z.object({
  defaultLowStockThreshold: z
    .number()
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative'),
})

export type SettingsInput = z.infer<typeof settingsSchema>

export const updateOrgProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name must be at least 2 characters')
    .max(50, 'Organization name cannot exceed 50 characters'),
})

export type UpdateOrgProfileInput = z.infer<typeof updateOrgProfileSchema>

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(8, 'New password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your new password'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'New passwords do not match',
    path: ['confirmPassword'],
  })

export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
