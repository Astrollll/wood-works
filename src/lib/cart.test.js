import { beforeEach, describe, expect, test, vi } from 'vitest'
import { PRODUCTS } from '../data/products'
import {
  CART_CHANGED_EVENT,
  listCart,
  placeOrder,
  removeCartItem,
  setQuantity,
  upsertCartItem,
} from './cart'

const from = vi.hoisted(() => vi.fn())
vi.mock('./supabase', () => ({ supabase: { from } }))

/**
 * Mirrors the supabase-js query builder: chainable calls and thenable
 * resolution of `result` (supabase resolves every query to { data, error }).
 */
function chain(result) {
  const builder = {
    insert: vi.fn(() => builder),
    upsert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    delete: vi.fn(() => builder),
    select: vi.fn(() => builder),
    order: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    in: vi.fn(() => builder),
    single: vi.fn(() => builder),
  }
  builder.then = (onFulfilled, onRejected) =>
    Promise.resolve(result).then(onFulfilled, onRejected)
  return builder
}

const CART_ROWS = [
  { product_id: 'classic-wooden-chair', quantity: 2 },
  { product_id: 'wooden-dining-table', quantity: 1 },
]

const CART_LINES = [
  { product: PRODUCTS[1], quantity: 2, lineTotal: 5000 },
  { product: PRODUCTS[0], quantity: 1, lineTotal: 5000 },
]

const SNAPSHOT = [
  { product_id: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 2 },
  { product_id: 'wooden-dining-table', name: 'Wooden Dining Table', price: 5000, quantity: 1 },
]

const SAVED_ROW = {
  id: 7,
  created_at: '2026-11-20T00:00:00.000Z',
  order_number: 'WW-0007',
  furniture_type: 'Cart order',
  wood_type: null,
  length: null,
  width: null,
  height: null,
  quantity: null,
  notes: null,
  status: 'Pending',
  eta: '1-3 days',
  items: SNAPSHOT,
  total: '10000.00',
}

beforeEach(() => {
  from.mockReset()
})

describe('upsertCartItem — set a row quantity over the supabase seam', () => {
  test('sends the product, quantity, and conflict target', async () => {
    const builder = chain({ error: null })
    from.mockReturnValue(builder)
    await upsertCartItem('classic-wooden-chair', 2)
    expect(from).toHaveBeenCalledWith('cart_items')
    expect(builder.upsert).toHaveBeenCalledWith(
      { product_id: 'classic-wooden-chair', quantity: 2 },
      { onConflict: 'user_id,product_id' },
    )
  })

  test('rejects with the raw supabase error', async () => {
    const error = { message: 'upsert failed' }
    from.mockReturnValue(chain({ error }))
    await expect(upsertCartItem('classic-wooden-chair', 2)).rejects.toBe(error)
  })
})

describe('listCart — catalog join over the supabase seam', () => {
  test('joins the catalog and computes line totals in created order', async () => {
    const builder = chain({ data: CART_ROWS, error: null })
    from.mockReturnValue(builder)
    const lines = await listCart()
    expect(from).toHaveBeenCalledWith('cart_items')
    expect(builder.select).toHaveBeenCalledWith()
    expect(builder.order).toHaveBeenCalledWith('created_at', { ascending: true })
    expect(lines).toEqual(CART_LINES)
  })

  test('drops rows whose product left the catalog', async () => {
    const builder = chain({
      data: [{ product_id: 'ghost', quantity: 9 }, { product_id: 'classic-wooden-chair', quantity: 1 }],
      error: null,
    })
    from.mockReturnValue(builder)
    const lines = await listCart()
    expect(lines).toEqual([{ product: PRODUCTS[1], quantity: 1, lineTotal: 2500 }])
  })
})

describe('setQuantity / removeCartItem — row mutations', () => {
  test('sets the row quantity', async () => {
    const builder = chain({ error: null })
    from.mockReturnValue(builder)
    await setQuantity('study-table', 3)
    expect(from).toHaveBeenCalledWith('cart_items')
    expect(builder.update).toHaveBeenCalledWith({ quantity: 3 })
    expect(builder.eq).toHaveBeenCalledWith('product_id', 'study-table')
  })

  test('removes the row below 1', async () => {
    const builder = chain({ error: null })
    from.mockReturnValue(builder)
    await setQuantity('study-table', 0)
    expect(builder.delete).toHaveBeenCalledWith()
    expect(builder.eq).toHaveBeenCalledWith('product_id', 'study-table')
    expect(builder.update).not.toHaveBeenCalled()
  })

  test('removeCartItem deletes by product id', async () => {
    const builder = chain({ error: null })
    from.mockReturnValue(builder)
    await removeCartItem('bed-frame')
    expect(builder.delete).toHaveBeenCalledWith()
    expect(builder.eq).toHaveBeenCalledWith('product_id', 'bed-frame')
  })
})

describe('cart mutations — change notification', () => {
  test('dispatches the cart-changed event once per successful call', async () => {
    const handler = vi.fn()
    window.addEventListener(CART_CHANGED_EVENT, handler)
    from.mockReturnValue(chain({ error: null }))

    await upsertCartItem('classic-wooden-chair', 2)
    await setQuantity('classic-wooden-chair', 3)
    await removeCartItem('classic-wooden-chair')
    expect(handler).toHaveBeenCalledTimes(3)

    const failure = { message: 'nope' }
    from.mockReturnValue(chain({ error: failure }))
    await expect(upsertCartItem('classic-wooden-chair', 2)).rejects.toBe(failure)
    expect(handler).toHaveBeenCalledTimes(3)

    window.removeEventListener(CART_CHANGED_EVENT, handler)
  })
})

describe('placeOrder — client-side checkout sequence', () => {
  test('inserts the snapshot + total, clears the cart, and resolves the display order', async () => {
    const listBuilder = chain({ data: CART_ROWS, error: null })
    const insertBuilder = chain({ data: SAVED_ROW, error: null })
    const clearBuilder = chain({ error: null })
    const cartBuilders = [listBuilder, clearBuilder]
    from.mockImplementation((table) => {
      if (table === 'orders') return insertBuilder
      return cartBuilders.shift()
    })

    const order = await placeOrder()

    expect(insertBuilder.insert).toHaveBeenCalledWith({
      items: SNAPSHOT,
      total: 10000,
      furniture_type: 'Cart order',
      notes: null,
    })
    expect(clearBuilder.delete).toHaveBeenCalledWith()
    expect(clearBuilder.in).toHaveBeenCalledWith('product_id', [
      'classic-wooden-chair',
      'wooden-dining-table',
    ])
    expect(order.number).toBe('WW-0007')
    expect(order.items).toEqual([
      {
        productId: 'classic-wooden-chair',
        name: 'Classic Wooden Chair',
        price: 2500,
        quantity: 2,
        lineTotal: 5000,
      },
      {
        productId: 'wooden-dining-table',
        name: 'Wooden Dining Table',
        price: 5000,
        quantity: 1,
        lineTotal: 5000,
      },
    ])
    expect(order.total).toBe(10000)
  })

  test('rejects on an empty cart without inserting an order', async () => {
    from.mockReturnValue(chain({ data: [], error: null }))
    await expect(placeOrder()).rejects.toThrow('Your cart is empty.')
    expect(from).not.toHaveBeenCalledWith('orders')
  })

  test('deletes the orphan order when clearing the cart fails', async () => {
    const clearError = { message: 'clear failed' }
    const listBuilder = chain({ data: CART_ROWS, error: null })
    const insertBuilder = chain({ data: SAVED_ROW, error: null })
    const clearBuilder = chain({ error: clearError })
    const cleanupBuilder = chain({ error: null })
    const cartBuilders = [listBuilder, clearBuilder]
    const orderBuilders = [insertBuilder, cleanupBuilder]
    from.mockImplementation((table) => {
      if (table === 'orders') return orderBuilders.shift()
      return cartBuilders.shift()
    })

    await expect(placeOrder()).rejects.toBe(clearError)
    expect(orderBuilders).toHaveLength(0)
    expect(cleanupBuilder.delete).toHaveBeenCalledWith()
    expect(cleanupBuilder.eq).toHaveBeenCalledWith('id', 7)
  })

  test('rethrows an order-insert failure without clearing the cart', async () => {
    const insertError = { message: 'insert failed' }
    const listBuilder = chain({ data: CART_ROWS, error: null })
    const insertBuilder = chain({ data: null, error: insertError })
    const cartBuilders = [listBuilder]
    from.mockImplementation((table) => {
      if (table === 'orders') return insertBuilder
      return cartBuilders.shift()
    })

    await expect(placeOrder()).rejects.toBe(insertError)
    expect(cartBuilders).toHaveLength(0)
    expect(from).toHaveBeenCalledTimes(2)
  })
})
