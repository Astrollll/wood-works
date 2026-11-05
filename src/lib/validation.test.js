import { describe, expect, test } from 'vitest'
import { isEmail, isFilled, passwordsMatch } from './validation'

describe('isFilled', () => {
  test('accepts non-empty strings', () => {
    expect(isFilled('x')).toBe(true)
  })

  test('rejects empty and whitespace-only strings', () => {
    expect(isFilled('')).toBe(false)
    expect(isFilled('   ')).toBe(false)
    expect(isFilled(null)).toBe(false)
    expect(isFilled(undefined)).toBe(false)
  })
})

describe('isEmail', () => {
  test('accepts simple emails', () => {
    expect(isEmail('a@b.com')).toBe(true)
  })

  test('rejects strings without an @ or domain', () => {
    expect(isEmail('nope')).toBe(false)
    expect(isEmail('a@b')).toBe(false)
  })
})

describe('passwordsMatch', () => {
  test('equal strings match', () => {
    expect(passwordsMatch('a', 'a')).toBe(true)
  })

  test('different strings do not match', () => {
    expect(passwordsMatch('a', 'b')).toBe(false)
  })
})
