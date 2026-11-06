import { describe, expect, test } from 'vitest'
import { createOrder, DEFAULT_ORDER } from './orders'

describe('createOrder — mock session order records', () => {
  test('first call returns exactly WW-0001 with the pinned record shape', () => {
    expect(createOrder({ furniture: 'Wooden Dining Table' })).toEqual({
      number: 'WW-0001',
      furniture: 'Wooden Dining Table',
      status: 'Pending',
      eta: '1-3 days',
    })
  })

  test('module-scoped counter keeps counting: second call is WW-0002', () => {
    expect(createOrder({ furniture: 'Study Table' })).toMatchObject({
      number: 'WW-0002',
      furniture: 'Study Table',
    })
  })

  test('status is always Pending (mock: no backend)', () => {
    expect(createOrder({ furniture: 'Bed Frame' }).status).toBe('Pending')
  })

  test('eta is the exact Figma string with the ASCII hyphen', () => {
    expect(createOrder({ furniture: 'Bookshelf' }).eta).toBe('1-3 days')
  })
})

describe('DEFAULT_ORDER — the Figma screen-14 example record', () => {
  test('matches the panel copy verbatim', () => {
    expect(DEFAULT_ORDER).toEqual({
      number: 'WW-0001',
      furniture: 'Custom Dining Table',
      status: 'Pending',
      eta: '1-3 days',
    })
  })
})
