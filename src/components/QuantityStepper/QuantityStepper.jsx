import './QuantityStepper.css'

/**
 * Figma Product Details quantity selector: − / value / + (500/16).
 * The lower bound of 1 is enforced here so every caller borrows it.
 */
export default function QuantityStepper({ value, onChange }) {
  const decrement = () => {
    if (value > 1) onChange(value - 1)
  }
  return (
    <div className="stepper">
      <button
        type="button"
        className="stepper__btn"
        aria-label="Decrease quantity"
        onClick={decrement}
      >
        −
      </button>
      <span className="stepper__value" aria-label={`Quantity ${value}`}>
        {value}
      </span>
      <button
        type="button"
        className="stepper__btn"
        aria-label="Increase quantity"
        onClick={() => onChange(value + 1)}
      >
        +
      </button>
    </div>
  )
}
