import './ProductCard.css'
import { formatPrice } from '../../lib/formatPrice'

/**
 * Wood Works product card — mirrors the Figma "Product Card" component:
 * image block (#A1887F), body padded 16/16/12 with 4px stack gap,
 * title 600/18, blurb 400/14 muted, price 600/16, "View Details →".
 * The whole card is the hotspot (plan Task 6): one click handler on the
 * article; the image is a plain placeholder image and "View Details →"
 * gives keyboard users the explicit focusable affordance (its click
 * bubbles to the card handler).
 */
export default function ProductCard({ product, onOpen }) {
  return (
    <article className="product-card" onClick={() => onOpen(product.id)}>
      <span
        className="product-card__image"
        role="img"
        aria-label={`${product.name} image`}
      />
      <div className="product-card__body">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__blurb">{product.blurb}</p>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <button type="button" className="product-card__link">
          View Details →
        </button>
      </div>
    </article>
  )
}
