import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import CustomOrderPage from './CustomOrderPage'

function OrderConfirmationStub() {
  const { state } = useLocation()
  const order = state?.order
  return (
    <div>
      ORDER CONFIRMATION STUB{' '}
      {order ? `${order.number} ${order.furniture}` : 'no-order'}
    </div>
  )
}

function renderCustomOrder() {
  return render(
    <MemoryRouter initialEntries={['/custom-order']}>
      <Routes>
        <Route path="/custom-order" element={<CustomOrderPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

const FORM_LABELS = ['Furniture Type', 'Wood Type', 'Length', 'Width', 'Height', 'Quantity']

describe('CustomOrderPage (Figma screen 13)', () => {
  test('renders the exact copy: heading, sub, summary block with letter-x sizing', () => {
    renderCustomOrder()
    expect(screen.getByText('Create Your Custom Furniture')).toBeInTheDocument()
    expect(
      screen.getByText("Tell us what you need and we'll help bring your idea to life."),
    ).toBeInTheDocument()
    expect(screen.getByText('Wooden Dining Table')).toBeInTheDocument()
    expect(screen.getByText('Description')).toBeInTheDocument()
    expect(
      screen.getByText(
        'A handcrafted wooden dining table designed for everyday use and durability.',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Material: Solid Wood')).toBeInTheDocument()
    expect(screen.getByText('Size: 4 x 6 ft')).toBeInTheDocument()
    expect(screen.getByText('Availability: Available')).toBeInTheDocument()
  })

  test('six form fields, notes textarea, upload link, and submit button exist', () => {
    renderCustomOrder()
    for (const label of FORM_LABELS) {
      expect(screen.getByLabelText(label)).toBeInTheDocument()
    }
    expect(
      screen.getByPlaceholderText(
        'Describe your preferred design, color, style, or other requests...',
      ),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: '+ Upload Reference Image.' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'SUBMIT CUSTOM ORDER.' }),
    ).toBeInTheDocument()
  })

  test('empty submit keeps the user on the page with an error per required field', async () => {
    const user = userEvent.setup()
    renderCustomOrder()
    await user.click(screen.getByRole('button', { name: 'SUBMIT CUSTOM ORDER.' }))
    expect(await screen.findAllByRole('alert')).toHaveLength(6)
    expect(screen.queryByText(/ORDER CONFIRMATION STUB/)).not.toBeInTheDocument()
  })

  test('valid submit routes to confirmation carrying the entered furniture type', async () => {
    const user = userEvent.setup()
    renderCustomOrder()
    await user.type(screen.getByLabelText('Furniture Type'), 'Modern Oak Shelf')
    await user.type(screen.getByLabelText('Wood Type'), 'Oak')
    await user.type(screen.getByLabelText('Length'), '4')
    await user.type(screen.getByLabelText('Width'), '2')
    await user.type(screen.getByLabelText('Height'), '3')
    await user.type(screen.getByLabelText('Quantity'), '1')
    await user.click(screen.getByRole('button', { name: 'SUBMIT CUSTOM ORDER.' }))
    expect(
      await screen.findByText(/ORDER CONFIRMATION STUB WW-0001 Modern Oak Shelf/),
    ).toBeInTheDocument()
  })
})
