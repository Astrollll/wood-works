import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { listCart, setQuantity, removeCartItem, placeOrder } from '../../lib/cart'
import CartPage from './CartPage'

const useAuth = vi.hoisted(() => vi.fn())

// Mock the cart seam and auth at module-load time; the imports above are
// bindings to these mock functions (Vitest hoists vi.mock).
vi.mock('../../lib/cart', () => ({
  listCart: vi.fn(),
  setQuantity: vi.fn(),
  removeCartItem: vi.fn(),
  placeOrder: vi.fn(),
  CART_CHANGED_EVENT: 'woodworks:cart-changed',
}))

vi.mock('../../auth/AuthProvider', () => ({ useAuth }))

const PRODUCTS = [
  {
    id: 'wooden-dining-table',
    name: 'Wooden Dining Table',
    category: 'Tables',
    price: 5000,
    blurb: 'Solid wood furniture',
    description: 'A handcrafted wooden dining table.',
    details: { Material: 'Solid Wood', Size: '4 × 6 ft', Availability: 'Available' },
  },
  {
    id: 'classic-wooden-chair',
    name: 'Classic Wooden Chair',
    category: 'Chairs',
    price: 2500,
    blurb: 'Solid wood furniture',
    description: 'A sturdy classic wooden chair.',
    details: { Material: 'Solid Wood', Size: '2 × 2 ft', Availability: 'Available' },
  },
]

const CART_LINES = [
  { product: PRODUCTS[0], quantity: 2, lineTotal: 10000 },
  { product: PRODUCTS[1], quantity: 1, lineTotal: 2500 },
]

const CART_ORDER = {
  id: 7,
  number: 'WW-0007',
  furniture: 'Cart order',
  wood: null,
  status: 'Pending',
  eta: '1-3 days',
  createdAt: '2026-11-20T00:00:00.000Z',
  items: [
    { productId: 'wooden-dining-table', name: 'Wooden Dining Table', price: 5000, quantity: 2, lineTotal: 10000 },
    { productId: 'classic-wooden-chair', name: 'Classic Wooden Chair', price: 2500, quantity: 1, lineTotal: 2500 },
  ],
  total: 12500,
}

function OrderConfirmationStub() {
  const { state } = useLocation()
  return (
    <div>
      ORDER CONFIRMATION STUB <span>{state?.order?.number}</span>
    </div>
  )
}

function renderCart(initialEntries = ['/cart']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/cart" element={<CartPage />} />
        <Route path="/login" element={<div>LOGIN STUB</div>} />
        <Route path="/catalog" element={<div>CATALOG STUB</div>} />
        <Route path="/order-confirmation" element={<OrderConfirmationStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CartPage', () => {
  beforeEach(() => {
    useAuth.mockReset().mockReturnValue({ user: { email: 'a@b.com' }, loading: false })

    listCart.mockReset().mockResolvedValue(CART_LINES)
    setQuantity.mockReset().mockResolvedValue(undefined)
    removeCartItem.mockReset().mockResolvedValue(undefined)
    placeOrder.mockReset().mockResolvedValue(CART_ORDER)
  })

  test('guest is redirected to login carrying /cart', async () => {
    useAuth.mockReturnValue({ user: null, loading: false })

    renderCart()
    expect(screen.getByText('LOGIN STUB')).toBeInTheDocument()
    expect(listCart).not.toHaveBeenCalled()
  })

  test('empty cart shows the pinned line and a catalog link', async () => {
    listCart.mockResolvedValue([])

    renderCart()
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Browse the catalog' })).toHaveAttribute('href', '/catalog')
  })

  test('renders rows, unit prices, line totals, and the grand total', async () => {
    renderCart()
    await screen.findByText('Wooden Dining Table')
    expect(screen.getByText('₱5,000')).toBeInTheDocument()
    expect(screen.getByText('₱10,000')).toBeInTheDocument()
    expect(screen.getByText('Classic Wooden Chair')).toBeInTheDocument()
    expect(screen.getAllByText('₱2,500')).toHaveLength(2)
    expect(screen.getByText('Total: ₱12,500')).toBeInTheDocument()
  })

  test('plus steps a row and persists the new quantity', async () => {
    const user = userEvent.setup()
    renderCart()
    await screen.findByText('Wooden Dining Table')
    await user.click(screen.getAllByRole('button', { name: 'Increase quantity' })[0])
    expect(setQuantity).toHaveBeenCalledWith('wooden-dining-table', 3)
  })

  test('minus on a quantity of 1 removes the row', async () => {
    const user = userEvent.setup()
    renderCart()
    await screen.findByText('Classic Wooden Chair')
    await user.click(screen.getAllByRole('button', { name: 'Decrease quantity' })[1])
    expect(removeCartItem).toHaveBeenCalledWith('classic-wooden-chair')
  })

  test('Remove link deletes the row', async () => {
    const user = userEvent.setup()
    renderCart()
    await screen.findByText('Wooden Dining Table')
    await user.click(screen.getAllByRole('button', { name: 'Remove' })[0])
    expect(removeCartItem).toHaveBeenCalledWith('wooden-dining-table')
  })

  test('SUBMIT ORDER places the order and navigates with it', async () => {
    const user = userEvent.setup()
    renderCart()
    await screen.findByText('Wooden Dining Table')
    await user.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }))
    expect(placeOrder).toHaveBeenCalled()
    expect(await screen.findByText('WW-0007')).toBeInTheDocument()
  })

  test('SUBMIT ORDER is disabled while the order is in flight', async () => {
    placeOrder.mockReturnValue(new Promise(() => {}))

    renderCart()
    await screen.findByText('Wooden Dining Table')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }))
    expect(screen.getByRole('button', { name: 'SUBMIT ORDER' })).toBeDisabled()
  })

  test('submit failure shows the raw message and stays on the cart', async () => {
    placeOrder.mockRejectedValue(new Error('network down'))

    const user = userEvent.setup()
    renderCart()
    await screen.findByText('Wooden Dining Table')
    await user.click(screen.getByRole('button', { name: 'SUBMIT ORDER' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
    expect(screen.queryByText('WW-0007')).not.toBeInTheDocument()
  })

  test('mutation failure shows the raw message and keeps the rows', async () => {
    setQuantity.mockRejectedValue(new Error('update failed'))

    const user = userEvent.setup()
    renderCart()
    await screen.findByText('Wooden Dining Table')
    await user.click(screen.getAllByRole('button', { name: 'Increase quantity' })[0])
    expect(await screen.findByRole('alert')).toHaveTextContent('update failed')
    expect(screen.getByText('Wooden Dining Table')).toBeInTheDocument()
  })

  test('load failure shows the message and RETRY reloads', async () => {
    listCart
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce([])

    renderCart()
    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('Your cart is empty.')).toBeInTheDocument()
  })
})
