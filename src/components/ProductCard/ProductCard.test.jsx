import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import ProductCard from './ProductCard'

const diningTable = {
  id: 'wooden-dining-table',
  name: 'Wooden Dining Table',
  category: 'Tables',
  price: 5000,
  blurb: 'Solid wood furniture',
}

describe('ProductCard', () => {
  test('renders exact Figma copy: title, blurb, formatted price, link', () => {
    render(<ProductCard product={diningTable} onOpen={() => {}} />)
    expect(screen.getByText('Wooden Dining Table')).toBeInTheDocument()
    expect(screen.getByText('Solid wood furniture')).toBeInTheDocument()
    expect(screen.getByText('₱5,000')).toBeInTheDocument()
    expect(screen.getByText('View Details →')).toBeInTheDocument()
  })

  test('image placeholder is announced as the product image', () => {
    render(<ProductCard product={diningTable} onOpen={() => {}} />)
    expect(screen.getByRole('img', { name: 'Wooden Dining Table image' })).toBeInTheDocument()
  })

  test('clicking the View Details link calls onOpen(product.id)', async () => {
    const user = userEvent.setup()
    const onOpen = vi.fn()
    render(<ProductCard product={diningTable} onOpen={onOpen} />)
    await user.click(screen.getByText('View Details →'))
    expect(onOpen).toHaveBeenCalledWith('wooden-dining-table')
  })
})
