import { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import ProductCard from '../../components/ProductCard/ProductCard'
import QuantityStepper from '../../components/QuantityStepper/QuantityStepper'
import { getProduct } from '../../data/products'
import { useAuth } from '../../auth/AuthProvider'
import { upsertCartItem } from '../../lib/cart'
import { formatPrice } from '../../lib/formatPrice'
import './ProductDetailsPage.css'

const RELATED_COUNT = 4

/**
 * Figma screen 12 — Product Details.
 * Left: image placeholder block. Right: title 700/32, price 600/24,
 * Description block, three 400/14 detail lines, quantity stepper with
 * ADD TO CART / CUSTOMIZE. The Figma designer duplicates the same card as the
 * related row — the duplicates are kept verbatim (spec §4a).
 * Unknown ids redirect to /catalog (small deliberate deviation: no designed
 * 404 — flagged in commit message and QA report).
 */
export default function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useAuth()
  const product = getProduct(id)
  const [quantity, setQuantity] = useState(1)
  const [added, setAdded] = useState(false)
  const [error, setError] = useState('')
  const timer = useRef(null)

  useEffect(() => {
    const pending = timer
    return () => clearTimeout(pending.current)
  }, [])

  if (!product) {
    return <Navigate to="/catalog" replace />
  }

  const handleAddToCart = async () => {
    setError('')
    if (!user) {
      navigate('/login', { state: { from: location } })
      return
    }
    try {
      await upsertCartItem(product.id, quantity)
      setAdded(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => setAdded(false), 1500)
    } catch (e) {
      setError(e.message)
    }
  }

  const related = Array.from({ length: RELATED_COUNT }, () => product)

  return (
    <PageLayout>
      <section className="details">
        <span
          className="details__image"
          role="img"
          aria-label={`${product.name} image`}
        />
        <div className="details__body">
          <h1 className="details__title">{product.name}</h1>
          <p className="details__price">{formatPrice(product.price)}</p>

          <h2 className="details__heading">Description</h2>
          <p className="details__description">{product.description}</p>

          <div className="details__specs">
            <p>
              Material: {product.details.Material}
            </p>
            <p>
              Size: {product.details.Size}
            </p>
            <p>
              Availability: {product.details.Availability}
            </p>
          </div>

          <div className="details__purchase">
            <QuantityStepper value={quantity} onChange={setQuantity} />
            <div className="details__actions">
              <Button variant="filled" onClick={handleAddToCart}>
                {added ? 'ADDED ✓' : 'ADD TO CART'}
              </Button>
              <Button variant="outline" onClick={() => navigate('/custom-order')}>
                CUSTOMIZE
              </Button>
            </div>
            {error && (
              <p className="details__error" role="alert">
                {error}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="details__related" aria-label={`Related ${product.name} products`}>
        {related.map((card, index) => (
          <ProductCard
            key={`${card.id}-${index}`}
            product={card}
            onOpen={(openedId) => navigate(`/product/${openedId}`)}
          />
        ))}
      </section>
    </PageLayout>
  )
}
