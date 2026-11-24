// Unit tests: low-stock logic
// Run with: npx vitest tests/low-stock.test.ts

import { describe, it, expect } from 'vitest'
import { isLowStock } from '../src/lib/data/products'

describe('isLowStock', () => {
  it('returns true when quantity is below org default threshold', () => {
    expect(isLowStock(3, null, 5)).toBe(true)
  })

  it('returns true when quantity equals org default threshold (boundary)', () => {
    expect(isLowStock(5, null, 5)).toBe(true)
  })

  it('returns false when quantity is above org default threshold', () => {
    expect(isLowStock(6, null, 5)).toBe(false)
  })

  it('uses product-level threshold when set, overriding org default', () => {
    // Product threshold = 10, org default = 5; qty = 7 → low because 7 <= 10
    expect(isLowStock(7, 10, 5)).toBe(true)
  })

  it('product threshold overrides org default — not low when qty > product threshold', () => {
    // Product threshold = 2, org default = 10; qty = 5 → NOT low because 5 > 2
    expect(isLowStock(5, 2, 10)).toBe(false)
  })

  it('handles threshold of 0: quantity 0 is low stock', () => {
    expect(isLowStock(0, 0, 5)).toBe(true)
  })

  it('handles threshold of 0: quantity 1 is NOT low stock', () => {
    expect(isLowStock(1, 0, 5)).toBe(false)
  })

  it('product threshold of 0 overrides org default of 10', () => {
    expect(isLowStock(0, 0, 10)).toBe(true)
    expect(isLowStock(1, 0, 10)).toBe(false)
  })
})
