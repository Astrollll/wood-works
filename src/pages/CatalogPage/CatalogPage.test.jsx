import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useParams } from 'react-router-dom'
import CatalogPage from './CatalogPage'

function ProductStub() {
  const { id } = useParams()
  return <div>PRODUCT STUB {id}</div>
}

function renderCatalog() {
  return render(
    <MemoryRouter initialEntries={['/catalog']}>
      <Routes>
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductStub />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CatalogPage (Figma screen 11)', () => {
  test('renders the exact copy and the 6 category chips with All selected', () => {
    renderCatalog()
    expect(screen.getByRole('heading', { name: 'Furniture Collection' })).toBeInTheDocument()
    expect(screen.getByText('Browse our handcrafted furniture.')).toBeInTheDocument()
    for (const label of ['All', 'Tables', 'Chairs', 'Cabinets', 'Beds', 'Others']) {
      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: 'All' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tables' })).toHaveAttribute('aria-pressed', 'false')
  })

  test('All shows all 8 products', () => {
    renderCatalog()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(8)
    expect(screen.getAllByText('View Details →')).toHaveLength(8)
  })

  test('Chairs chip filters to exactly the 2 chair products in order', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await user.click(screen.getByRole('button', { name: 'Chairs' }))
    const cardTitles = screen
      .getAllByRole('heading', { level: 3 })
      .map((h) => h.textContent)
    expect(cardTitles).toEqual(['Classic Wooden Chair', 'Wooden Bench'])
  })

  test('Others chip renders ZERO cards with no crash (Review Focus #1)', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await user.click(screen.getByRole('button', { name: 'Others' }))
    expect(screen.queryAllByRole('heading', { level: 3 })).toHaveLength(0)
    expect(screen.queryByText('View Details →')).not.toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Furniture Collection' }),
    ).toBeInTheDocument()
  })

  test('card click opens /product/:id with the card product', async () => {
    const user = userEvent.setup()
    renderCatalog()
    await user.click(screen.getAllByText('View Details →')[0])
    expect(
      await screen.findByText('PRODUCT STUB wooden-dining-table'),
    ).toBeInTheDocument()
  })
})
