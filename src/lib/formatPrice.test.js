import { describe, expect, test } from 'vitest'
import { formatPrice } from './formatPrice'

describe('formatPrice', () => {
  test('5000 -> ₱5,000 exactly', () => {
    expect(formatPrice(5000)).toBe('₱5,000')
  })

  test('2500 -> ₱2,500', () => {
    expect(formatPrice(2500)).toBe('₱2,500')
  })

  test('1 -> ₱1 (no thousands separator needed)', () => {
    expect(formatPrice(1)).toBe('₱1')
  })

  test('no decimals ever', () => {
    expect(formatPrice(3000)).not.toMatch(/\.00/)
  })
})
