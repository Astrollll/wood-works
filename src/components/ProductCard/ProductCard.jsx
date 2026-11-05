import './ProductCard.css'
import { formatPrice } from '../../lib/formatPrice'

/**
 * Wood Works product card — mirrors the Figma "Product Card" component:
 * image block (#A1887F), body padded 16/16/12 with 4px stack gap,
 * title 600/18, blurb 400/14 muted, price 600/16, "View Details →".
 */
export default function ProductCard({ product, onOpen }) {
  return (
    <article className="product-card">
      <button
        type="button"
        className="product-card__image"
        role="img"
        aria-label={`${product.name} image`}
        onClick={() => onOpen(product.id)}
      />
      <div className="product-card__body">
        <h3 className="product-card__title">{product.name}</h3>
        <p className="product-card__blurb">{product.blurb}</p>
        <p className="product-card__price">{formatPrice(product.price)}</p>
        <button
          type="button"
          className="product-card__link"
          onClick={() => onOpen(product.id)}
        >
          View Details →
        </button>
      </div>
    </article>
  )
}
