import { beforeEach, describe, expect, test, vi } from 'vitest'
import { insertOrder, listOrders, createOrder, DEFAULT_ORDER } from './orders'

const from = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({ supabase: { from } }))

const DB_ROW = {
  id: 1,
  created_at: '2026-11-17T00:00:00.000Z',
  user_id: '00000000-0000-0000-0000-000000000000',
  order_number: 'WW-0001',
  furniture_type: 'Modern Oak Shelf',
  wood_type: 'Oak',
  length: '4',
  width: '2',
  height: '3',
  quantity: '1',
  notes: null,
  reference_image_url: null,
  status: 'Pending',
  eta: '1-3 days',
}

/**
 * Mirrors the supabase-js query builder: chainable calls and thenable
 * resolution of `result` (supabase resolves every query to { data, error }).
 */
function chain(result) {
  const builder = {
    insert: vi.fn(() => builder),
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    single: vi.fn(() => builder),
  }
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  return builder
}

beforeEach(() => {
  from.mockReset()
})

describe('insertOrder — real insert over the supabase seam', () => {
  test('posts the mapped form values and resolves the display-shaped row', async () => {
    const builder = chain({ data: DB_ROW, error: null })
    from.mockReturnValue(builder)
    const saved = await insertOrder({
      'furniture-type': 'Modern Oak Shelf',
      'wood-type': 'Oak',
      length: '4',
      width: '2',
      height: '3',
      quantity: '1',
      notes: '',
    })
    expect(from).toHaveBeenCalledWith('orders')
    expect(builder.insert).toHaveBeenCalledWith({
      furniture_type: 'Modern Oak Shelf',
      wood_type: 'Oak',
      length: '4',
      width: '2',
      height: '3',
      quantity: '1',
      notes: null,
    })
    expect(builder.select).toHaveBeenCalledWith()
    expect(builder.single).toHaveBeenCalledWith()
    expect(saved).toEqual({
      id: 1,
      number: 'WW-0001',
      furniture: 'Modern Oak Shelf',
      wood: 'Oak',
      status: 'Pending',
      eta: '1-3 days',
      createdAt: '2026-11-17T00:00:00.000Z',
    })
  })

  test('rejects with the raw supabase error', async () => {
    const error = { message: 'insert failed' }
    from.mockReturnValue(chain({ data: null, error }))
    await expect(
      insertOrder({
        'furniture-type': 'Shelf',
        'wood-type': 'Oak',
        length: '1',
        width: '1',
        height: '1',
        quantity: '1',
        notes: '',
      }),
    ).rejects.toBe(error)
  })
})

describe('listOrders — real list over the supabase seam', () => {
  test('resolves rows newest first as display records', async () => {
    const rowA = { ...DB_ROW, id: 1, order_number: 'WW-0001', furniture_type: 'Modern Oak Shelf' }
    const rowB = { ...DB_ROW, id: 2, order_number: 'WW-0002', furniture_type: 'Study Table' }
    const builder = chain({ data: [rowB, rowA], error: null })
    from.mockReturnValue(builder)
    const rows = await listOrders()
    expect(from).toHaveBeenCalledWith('orders')
    expect(builder.select).toHaveBeenCalledWith()
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: false })
    expect(rows).toEqual([
      {
        id: 2,
        number: 'WW-0002',
        furniture: 'Study Table',
        wood: 'Oak',
        status: 'Pending',
        eta: '1-3 days',
        createdAt: '2026-11-17T00:00:00.000Z',
      },
      {
        id: 1,
        number: 'WW-0001',
        furniture: 'Modern Oak Shelf',
        wood: 'Oak',
        status: 'Pending',
        eta: '1-3 days',
        createdAt: '2026-11-17T00:00:00.000Z',
      },
    ])
  })
})

describe('createOrder — deprecated mock path for the catalog ORDER NOW button', () => {
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

describe('DEFAULT_ORDER — deprecated, kept until the confirmation fallback lands', () => {
  test('matches the panel copy verbatim', () => {
    expect(DEFAULT_ORDER).toEqual({
      number: 'WW-0001',
      furniture: 'Custom Dining Table',
      status: 'Pending',
      eta: '1-3 days',
    })
  })
})
