import { beforeEach, describe, expect, test, vi } from 'vitest'
import { insertOrder, listOrders, toOrder } from './orders'

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
  items: null,
  total: null,
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
      items: null,
      total: null,
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
        items: null,
        total: null,
      },
      {
        id: 1,
        number: 'WW-0001',
        furniture: 'Modern Oak Shelf',
        wood: 'Oak',
        status: 'Pending',
        eta: '1-3 days',
        createdAt: '2026-11-17T00:00:00.000Z',
        items: null,
        total: null,
      },
    ])
  })

  test('carries cart items through the display mapper', async () => {
    const cartRow = {
      ...DB_ROW,
      id: 7,
      order_number: 'WW-0007',
      furniture_type: 'Cart order',
      wood_type: null,
      length: null,
      width: null,
      height: null,
      quantity: null,
      items: [
        { product_id: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2 },
      ],
      total: '5000.00',
    }
    const customRow = { ...DB_ROW, id: 8, order_number: 'WW-0008' }
    from.mockReturnValue(chain({ data: [cartRow, customRow], error: null }))
    const rows = await listOrders()
    expect(rows[0].items).toEqual([
      {
        productId: 'classic-wooden-chair',
        name: 'Classic Wooden Chair',
        price: 2500,
        quantity: 2,
        lineTotal: 5000,
      },
    ])
    expect(rows[0].total).toBe(5000)
    expect(rows[1].items).toBeNull()
  })
})

describe('toOrder — display mapping', () => {
  test('maps a cart snapshot into camelCase lines with line totals', () => {
    const order = toOrder({
      ...DB_ROW,
      items: [
        { product_id: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2 },
      ],
      total: '5000.00',
    })
    expect(order.items).toEqual([
      {
        productId: 'classic-wooden-chair',
        name: 'Classic Wooden Chair',
        price: 2500,
        quantity: 2,
        lineTotal: 5000,
      },
    ])
    expect(order.total).toBe(5000)
    expect(typeof order.total).toBe('number')
  })

  test('keeps custom orders null-safe', () => {
    const order = toOrder({ ...DB_ROW, items: null, total: null })
    expect(order.items).toBeNull()
    expect(order.total).toBeNull()
  })
})

