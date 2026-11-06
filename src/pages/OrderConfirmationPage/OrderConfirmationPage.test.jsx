import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OrderConfirmationPage from './OrderConfirmationPage'

const ORDER_VIA_STATE = {
  number: 'WW-0007',
  furniture: 'Wooden Dining Table',
  status: 'Pending',
  eta: '1-3 days',
}

function renderConfirmation(location) {
  return render(
    <MemoryRouter initialEntries={[location]}>
      <Routes>
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/my-orders" element={<div>MY ORDERS STUB</div>} />
        <Route path="/home" element={<div>HOME STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OrderConfirmationPage (Figma screen 14)', () => {
  test('direct visit (no router state) renders DEFAULT_ORDER content exactly', () => {
    renderConfirmation('/order-confirmation')
    // The navbar's profile dot plus the screen's own circle above the heading.
    expect(screen.getAllByRole('img', { name: 'Profile' })).toHaveLength(2)
    expect(
      screen.getByRole('heading', { level: 1, name: 'ORDER SUBMITTED' }),
    ).toBeInTheDocument()
    expect(
      screen.getByText(
        'Your custom furniture request has been successfully submitted.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Order #: WW-0001')).toBeInTheDocument()
    expect(screen.getByText('Furniture: Custom Dining Table')).toBeInTheDocument()
    expect(screen.getByText('Status: Pending')).toBeInTheDocument()
    expect(screen.getByText('Estimated Response: 1-3 days')).toBeInTheDocument()
  })

  test('visit via ORDER NOW router state shows the passed order instead', () => {
    renderConfirmation({
      pathname: '/order-confirmation',
      state: { order: ORDER_VIA_STATE },
    })
    expect(screen.getByText('Order #: WW-0007')).toBeInTheDocument()
    expect(screen.getByText('Furniture: Wooden Dining Table')).toBeInTheDocument()
    expect(screen.getByText('Status: Pending')).toBeInTheDocument()
    expect(screen.getByText('Estimated Response: 1-3 days')).toBeInTheDocument()
  })

  test('VIEW MY ORDERS routes to /my-orders', async () => {
    const user = userEvent.setup()
    renderConfirmation('/order-confirmation')
    await user.click(screen.getByRole('button', { name: 'VIEW MY ORDERS' }))
    expect(await screen.findByText('MY ORDERS STUB')).toBeInTheDocument()
  })

  test('BACK TO HOME routes to /home', async () => {
    const user = userEvent.setup()
    renderConfirmation('/order-confirmation')
    await user.click(screen.getByRole('button', { name: 'BACK TO HOME' }))
    expect(await screen.findByText('HOME STUB')).toBeInTheDocument()
  })
})
