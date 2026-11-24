import { z } from 'zod'

export const settingsSchema = z.object({
  defaultLowStockThreshold: z
    .number({ invalid_type_error: 'Threshold must be a number' })
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative'),
})

export type SettingsInput = z.infer<typeof settingsSchema>
