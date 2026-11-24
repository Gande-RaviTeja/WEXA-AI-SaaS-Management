import { z } from 'zod'

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  sku: z.string().min(1, 'SKU is required').max(100),
  description: z.string().max(1000).optional().or(z.literal('')),
  quantity: z
    .number({ invalid_type_error: 'Quantity must be a number' })
    .int('Quantity must be a whole number')
    .min(0, 'Quantity cannot be negative'),
  costPrice: z
    .number({ invalid_type_error: 'Cost price must be a number' })
    .min(0, 'Cost price cannot be negative')
    .optional()
    .nullable(),
  sellingPrice: z
    .number({ invalid_type_error: 'Selling price must be a number' })
    .min(0, 'Selling price cannot be negative')
    .optional()
    .nullable(),
  lowStockThreshold: z
    .number({ invalid_type_error: 'Threshold must be a number' })
    .int('Threshold must be a whole number')
    .min(0, 'Threshold cannot be negative')
    .optional()
    .nullable(),
})

export const adjustSchema = z.object({
  delta: z
    .number({ invalid_type_error: 'Adjustment must be a number' })
    .int('Adjustment must be a whole number')
    .refine((v) => v !== 0, 'Adjustment cannot be zero'),
  note: z.string().max(500).optional().or(z.literal('')),
})

export type ProductInput = z.infer<typeof productSchema>
export type AdjustInput = z.infer<typeof adjustSchema>
