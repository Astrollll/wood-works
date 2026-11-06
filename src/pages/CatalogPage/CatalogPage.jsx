import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import CategoryChip from '../../components/CategoryChip/CategoryChip'
import ProductCard from '../../components/ProductCard/ProductCard'
import { CATEGORIES, getByCategory } from '../../data/products'
import './CatalogPage.css'

/**
 * Figma screen 11 — Furniture Catalog.
 * Title + subtext, the six category chips (All selected by default), and the
 * 4-column grid of ProductCards filtered by the active chip. An empty
 * category ("Others") renders zero cards with the page still mounted.
 */
export default function CatalogPage() {
  const navigate = useNavigate()
  const [category, setCategory] = useState('All')
  const visible = getByCategory(category)

  return (
    <PageLayout>
      <section className="catalog">
        <h1 className="catalog__title">Furniture Collection</h1>
        <p className="catalog__sub">Browse our handcrafted furniture.</p>

        <div className="catalog__chips" role="group" aria-label="Furniture categories">
          {CATEGORIES.map((label) => (
            <CategoryChip
              key={label}
              label={label}
              selected={category === label}
              onClick={setCategory}
            />
          ))}
        </div>

        <div className="catalog__grid">
          {visible.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onOpen={(id) => navigate(`/product/${id}`)}
            />
          ))}
        </div>
      </section>
    </PageLayout>
  )
}
