/**
 * Real cart API over the Supabase seam (src/lib/supabase), mirroring
 * orders.js: snake_case stays at the DB seam, pages only see display
 * shapes, and raw Supabase errors are thrown.
 */
import { getProduct } from '../data/products'
import { supabase } from './supabase'
import { toOrder } from './orders'

/** NavBar's badge listens for this after every successful cart mutation. */
export const CART_CHANGED_EVENT = 'woodworks:cart-changed'

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(CART_CHANGED_EVENT))
  }
}

/** Sets the row's quantity (not additive) for the signed-in user. */
export async function upsertCartItem(productId, quantity) {
  const { error } = await supabase
    .from('cart_items')
    .upsert({ product_id: productId, quantity }, { onConflict: 'user_id,product_id' })
  if (error) throw error
  notify()
}

/**
 * Resolves the user's cart joined with the local catalog, oldest row first.
 * Rows whose product is no longer in the catalog are dropped.
 */
export async function listCart() {
  const { data, error } = await supabase
    .from('cart_items')
    .select()
    .order('created_at', { ascending: true })
  if (error) throw error
  return data.reduce((lines, row) => {
    const product = getProduct(row.product_id)
    if (product) {
      lines.push({
        product,
        quantity: row.quantity,
        lineTotal: product.price * row.quantity,
      })
    }
    return lines
  }, [])
}

/** Updates a row's quantity; anything below 1 removes the row instead. */
export async function setQuantity(productId, quantity) {
  if (quantity < 1) return removeCartItem(productId)
  const { error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('product_id', productId)
  if (error) throw error
  notify()
}

export async function removeCartItem(productId) {
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('product_id', productId)
  if (error) throw error
  notify()
}

/**
 * Client-side checkout sequence (Supabase JS has no multi-statement
 * transaction over REST): snapshot the cart into one order, then clear it.
 * If the clear fails, the orphan order is deleted best-effort before the
 * raw error is rethrown.
 */
export async function placeOrder() {
  const lines = await listCart()
  if (lines.length === 0) throw new Error('Your cart is empty.')

  const items = lines.map(({ product, quantity }) => ({
    product_id: product.id,
    name: product.name,
    price: product.price,
    quantity,
  }))
  const total = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  const { data, error } = await supabase
    .from('orders')
    .insert({ items, total, furniture_type: 'Cart order', notes: null })
    .select()
    .single()
  if (error) throw error

  const { error: clearError } = await supabase
    .from('cart_items')
    .delete()
    .in('product_id', items.map((item) => item.product_id))
  if (clearError) {
    await supabase.from('orders').delete().eq('id', data.id)
    throw clearError
  }

  notify()
  return toOrder(data)
}
