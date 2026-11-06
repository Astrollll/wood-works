import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import ProductDetailsPage from './ProductDetailsPage'

function OrderConfirmationStub() {
  const { state } = useLocation()
  const furniture = state?.order?.furniture ?? 'no-order'
  return <div>ORDER CONFIRMATION STUB {furniture}</div>
}

function renderDetails(initialEntry = '/product/wooden-dining-table') {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/catalog" element={<div>CATALOG STUB</div>} />
        <Route path="/custom-order" element={<div>CUSTOM ORDER STUB</div>} />
        <Route path="/order-confirmation" element={<OrderConfirmationStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ProductDetailsPage (Figma screen 12)', () => {
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

  test('ORDER NOW creates the order record and lands on confirmation showing it', async () => {
    const user = userEvent.setup()
    renderDetails()
    await user.click(screen.getByRole('button', { name: 'ORDER NOW' }))
    expect(
      await screen.findByText('ORDER CONFIRMATION STUB Wooden Dining Table'),
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
