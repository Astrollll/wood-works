import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import MyOrdersPage from './MyOrdersPage'

const listOrders = vi.hoisted(() => vi.fn())
vi.mock('../../lib/orders', () => ({ listOrders }))

const ORDER_1 = {
  id: 1,
  number: 'WW-0001',
  furniture: 'Modern Oak Shelf',
  wood: 'Oak',
  status: 'Pending',
  eta: '1-3 days',
  createdAt: '2026-11-17T00:00:00.000Z',
}

const ORDER_2 = {
  id: 2,
  number: 'WW-0002',
  furniture: 'Study Table',
  wood: 'Pine',
  status: 'Pending',
  eta: '1-3 days',
  createdAt: '2026-11-18T00:00:00.000Z',
}

beforeEach(() => {
  listOrders.mockReset()
  listOrders.mockResolvedValue([])
})

function renderMyOrders() {
  return render(
    <MemoryRouter initialEntries={['/my-orders']}>
      <MyOrdersPage />
    </MemoryRouter>,
  )
}

describe('MyOrdersPage (the real My Orders list)', () => {
  test('renders the heading and the empty line when there are no orders', async () => {
    renderMyOrders()
    expect(
      screen.getByRole('heading', { name: 'My Orders' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('No orders yet.')).toBeInTheDocument()
  })

  test("renders the user's orders as cards newest first", async () => {
    listOrders.mockResolvedValue([ORDER_2, ORDER_1])
    renderMyOrders()
    expect(await screen.findByText('Order #: WW-0002')).toBeInTheDocument()
    expect(screen.getByText('Order #: WW-0001')).toBeInTheDocument()
    expect(screen.getByText('Study Table')).toBeInTheDocument()
    expect(screen.getByText('Modern Oak Shelf')).toBeInTheDocument()
    expect(screen.getAllByText('Pending')).toHaveLength(2)
    expect(screen.getAllByText('1-3 days')).toHaveLength(2)
    expect(
      screen.getByText(
        new Date(ORDER_2.createdAt).toLocaleDateString('en-US', {
          dateStyle: 'medium',
        }),
      ),
    ).toBeInTheDocument()
  })

  test('shows the raw error and retries', async () => {
    listOrders.mockRejectedValueOnce(new Error('network down'))
    const user = userEvent.setup()
    renderMyOrders()
    expect(await screen.findByText('network down')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(await screen.findByText('No orders yet.')).toBeInTheDocument()
  })
})
