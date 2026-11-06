/**
 * Fictional session order records for the mock flow (no backend).
 * The counter is module-scoped: every createOrder() call advances it and
 * zero-pads to 4 digits — WW-0001, WW-0002, and so on.
 */

const orderCounter = { value: 0 }

export const DEFAULT_ORDER = {
  number: 'WW-0001',
  furniture: 'Custom Dining Table',
  status: 'Pending',
  eta: '1-3 days',
}

/**
 * Builds the order record routed to /order-confirmation.
 * Shape pinned by both Figma screens 12/14: number, furniture, Pending, "1-3 days".
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
