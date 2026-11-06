import { useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import ProductCard from '../../components/ProductCard/ProductCard'
import QuantityStepper from '../../components/QuantityStepper/QuantityStepper'
import { getProduct } from '../../data/products'
import { createOrder } from '../../lib/orders'
import { formatPrice } from '../../lib/formatPrice'
import './ProductDetailsPage.css'

const RELATED_COUNT = 4

/**
 * Figma screen 12 — Product Details.
 * Left: image placeholder block. Right: title 700/32, price 600/24,
 * Description block, three 400/14 detail lines, quantity stepper with
 * ORDER NOW / CUSTOMIZE. The Figma designer duplicates the same card as the
 * related row — the duplicates are kept verbatim (spec §4a).
 * Unknown ids redirect to /catalog (small deliberate deviation: no designed
 * 404 — flagged in commit message and QA report).
 */
export default function ProductDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const product = getProduct(id)
  const [quantity, setQuantity] = useState(1)

  if (!product) {
    return <Navigate to="/catalog" replace />
  }

  const handleOrderNow = () => {
    const order = createOrder({ furniture: product.name })
    navigate('/order-confirmation', { state: { order } })
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
            <Button variant="filled" onClick={handleOrderNow}>
              ORDER NOW
            </Button>
            <Button variant="outline" onClick={() => navigate('/custom-order')}>
              CUSTOMIZE
            </Button>
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
