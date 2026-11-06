import { useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import ProductCard from '../../components/ProductCard/ProductCard'
import { PRODUCTS } from '../../data/products'
import './HomePage.css'

const FEATURED = PRODUCTS.slice(0, 4)

/**
 * Figma screen 10 — Home.
 * Hero (700/48 heading, subtext, CTA pair) with the decorative accent image
 * block, then the Featured Furniture section with the first 4 products.
 */
export default function HomePage() {
  const navigate = useNavigate()
  return (
    <PageLayout>
      <section className="home__hero">
        <div className="home__hero-copy">
          <h1 className="home__hero-title">
            Crafted With Wood,
            <br />
            Built With Purpose.
          </h1>
          <p className="home__hero-sub">
            Explore handcrafted furniture made for your home and space.
          </p>
          <div className="home__hero-actions">
            <Button variant="filled" onClick={() => navigate('/catalog')}>
              BROWSE FURNITURE
            </Button>
            <Button variant="outline" onClick={() => navigate('/custom-order')}>
              CUSTOM ORDER
            </Button>
          </div>
        </div>
        <span className="home__hero-image" role="img" aria-label="Wood Works hero" />
      </section>

      <section className="home__featured">
        <h2 className="home__section-title">Featured Furniture</h2>
        <p className="home__section-sub">Explore some of our available furniture.</p>
        <div className="home__grid">
          {FEATURED.map((product) => (
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
