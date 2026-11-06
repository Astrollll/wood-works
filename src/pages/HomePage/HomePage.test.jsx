import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import HomePage from './HomePage'

function ProductStub() {
  const { id } = useParams()
  return <div>PRODUCT STUB {id}</div>
}

function renderHome() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <Routes>
        <Route path="/home" element={<HomePage />} />
        <Route path="/catalog" element={<div>CATALOG STUB</div>} />
        <Route path="/custom-order" element={<div>CUSTOM ORDER STUB</div>} />
        <Route path="/product/:id" element={<ProductStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('HomePage (Figma screen 10)', () => {
  test('renders the 2-line hero heading with hard break, verbatim', () => {
    renderHome()
    const titles = screen.getAllByRole('heading', { level: 1 })
    expect(titles).toHaveLength(1)
    expect(titles[0].textContent).toBe('Crafted With Wood,Built With Purpose.')
    expect(
      screen.getByText('Explore handcrafted furniture made for your home and space.'),
    ).toBeInTheDocument()
  })

  test('hero actions route to /catalog and /custom-order', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: 'BROWSE FURNITURE' }))
    expect(await screen.findByText('CATALOG STUB')).toBeInTheDocument()
  })

  test('CUSTOM ORDER hero button routes to /custom-order', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getByRole('button', { name: 'CUSTOM ORDER' }))
    expect(await screen.findByText('CUSTOM ORDER STUB')).toBeInTheDocument()
  })

  test('hero offers the decorative image placeholder with its label', () => {
    renderHome()
    expect(screen.getByRole('img', { name: 'Wood Works hero' })).toBeInTheDocument()
  })

  test('featured section lists exactly the first 4 products in order', () => {
    renderHome()
    expect(screen.getByRole('heading', { name: 'Featured Furniture' })).toBeInTheDocument()
    expect(
      screen.getByText('Explore some of our available furniture.'),
    ).toBeInTheDocument()
    const cardTitles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(cardTitles).toEqual([
      'Wooden Dining Table',
      'Classic Wooden Chair',
      'Wooden Cabinet',
      'Study Table',
    ])
  })

  test('first featured card opens its product details route', async () => {
    const user = userEvent.setup()
    renderHome()
    await user.click(screen.getAllByText('View Details →')[0])
    expect(
      await screen.findByText('PRODUCT STUB wooden-dining-table'),
    ).toBeInTheDocument()
  })
})
