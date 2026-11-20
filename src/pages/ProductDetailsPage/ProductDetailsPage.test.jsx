import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ProductDetailsPage from './ProductDetailsPage'

const upsertCartItem = vi.hoisted(() => vi.fn())
const useAuth = vi.hoisted(() => vi.fn())
vi.mock('../../lib/cart', () => ({
  upsertCartItem,
  // PageLayout's navbar consumes these after Task 8; harmless here.
  listCart: vi.fn(async () => []),
  CART_CHANGED_EVENT: 'woodworks:cart-changed',
}))
vi.mock('../../auth/AuthProvider', () => ({ useAuth }))

function LoginStub() {
  const { state } = useLocation()
  return <div>LOGIN STUB {state?.from?.pathname ?? 'none'}</div>
}

function renderDetails(initialEntry = '/product/wooden-dining-table') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/catalog" element={<div>CATALOG STUB</div>} />
        <Route path="/custom-order" element={<div>CUSTOM ORDER STUB</div>} />
        <Route path="/login" element={<LoginStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductDetailsPage (Figma screen 12)', () => {
  beforeEach(() => {
    useAuth.mockReturnValue({ user: { email: 'a@b.com' }, loading: false })
    upsertCartItem.mockReset()
    upsertCartItem.mockResolvedValue()
  })

  test('renders the exact copy: title, price, description, three detail lines', () => {
    renderDetails()
    expect(
      screen.getByRole('heading', { level: 1, name: 'Wooden Dining Table' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Description' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'A handcrafted wooden dining table designed for everyday use and durability.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Material: Solid Wood')).toBeInTheDocument()
    expect(screen.getByText('Size: 4 × 6 ft')).toBeInTheDocument()
    expect(screen.getByText('Availability: Available')).toBeInTheDocument()
  })

  test('price renders ₱5,000 once for the product and once per related card', () => {
    renderDetails()
    expect(screen.getAllByText('₱5,000')).toHaveLength(5)
  })

  test('quantity stepper starts at 1 and + steps to 2', async () => {
    const user = userEvent.setup()
    renderDetails()
    expect(screen.getByText('1')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('ADD TO CART upserts the chosen quantity and flips to ADDED ✓', async () => {
    const user = userEvent.setup()
    renderDetails()
    await user.click(screen.getByRole('button', { name: 'Increase quantity' }))
    await user.click(screen.getByRole('button', { name: 'ADD TO CART' }))
    expect(upsertCartItem).toHaveBeenCalledWith('wooden-dining-table', 2)
    expect(await screen.findByText('ADDED ✓')).toBeInTheDocument()
  })

  test('signed-out ADD TO CART routes to login carrying the product location', async () => {
    const user = userEvent.setup()
    useAuth.mockReturnValue({ user: null, loading: false })
    renderDetails()
    await user.click(screen.getByRole('button', { name: 'ADD TO CART' }))
    expect(await screen.findByText('LOGIN STUB /product/wooden-dining-table')).toBeInTheDocument()
    expect(upsertCartItem).not.toHaveBeenCalled()
  })

  test('upsert failure shows the raw message under the button', async () => {
    const user = userEvent.setup()
    upsertCartItem.mockRejectedValue(new Error('network down'))
    renderDetails()
    await user.click(screen.getByRole('button', { name: 'ADD TO CART' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('network down')
    expect(
      screen.getByRole('heading', { level: 1, name: 'Wooden Dining Table' }),
    ).toBeInTheDocument()
  })

  test('CUSTOMIZE routes to /custom-order', async () => {
    const user = userEvent.setup()
    renderDetails()
    await user.click(screen.getByRole('button', { name: 'CUSTOMIZE' }))
    expect(await screen.findByText('CUSTOM ORDER STUB')).toBeInTheDocument()
  })

  test('related row is 4 identical ProductCards of the same product (Figma duplicates)', () => {
    renderDetails()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(4)
    expect(screen.getAllByRole('img', { name: 'Wooden Dining Table image' })).toHaveLength(5)
  })

  test('unknown product id redirects to /catalog', () => {
    renderDetails('/product/nope')
    expect(screen.getByText('CATALOG STUB')).toBeInTheDocument()
  })
})
