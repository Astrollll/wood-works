/**
 * Real order API over the Supabase seam (src/lib/supabase).
 * Order numbers are assigned by the database sequence (WW- + zero-pad) —
 * the app never generates them. Pages only ever see the display shape.
 */
import { supabase } from './supabase'

const orderCounter = { value: 0 }

/**
 * @deprecated Mock session-order path for the catalog's ORDER NOW button
 * (spec D1: catalog stays mock this wave). The real custom-order flow uses
 * insertOrder, whose numbers are database-assigned — never generated here.
 */
export function createOrder({ furniture }) {
  orderCounter.value += 1
  return {
    number: `WW-${String(orderCounter.value).padStart(4, '0')}`,
    furniture,
    status: 'Pending',
    eta: '1-3 days',
  }
}

/** The only order shape pages ever see — never the snake_case DB columns. */
export function toOrder(row) {
  return {
    id: row.id,
    number: row.order_number,
    furniture: row.furniture_type,
    wood: row.wood_type,
    status: row.status,
    eta: row.eta,
    createdAt: row.created_at,
    items: Array.isArray(row.items)
      ? row.items.map((item) => ({
          productId: item.product_id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          lineTotal: item.price * item.quantity,
        }))
      : null,
    total: row.total == null ? null : Number(row.total),
  }
}

/**
 * Inserts the custom-order form state and resolves the saved row (with the
 * database-assigned order number). Rejects with the raw Supabase error.
 */
export async function insertOrder(values) {
  const payload = {
    furniture_type: values['furniture-type'],
    wood_type: values['wood-type'],
    length: values.length,
    width: values.width,
    height: values.height,
    quantity: values.quantity,
    notes: values.notes || null,
  }
  const { data, error } = await supabase
    .from('orders')
    .insert(payload)
    .select()
    .single()
  if (error) throw error
  return toOrder(data)
}

/** Resolves the signed-in user's orders, newest first. */
export async function listOrders() {
  const { data, error } = await supabase
    .from('orders')
    .select()
    .order('created_at', { ascending: false })
  if (error) throw error
  return data.map(toOrder)
}
