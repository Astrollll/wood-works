import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { getProduct, DIMENSIONS_PLAIN } from '../../data/products'
import { createOrder } from '../../lib/orders'
import { isFilled } from '../../lib/validation'
import './CustomOrderPage.css'

const FORM_FIELDS = [
  { id: 'furniture-type', label: 'Furniture Type' },
  { id: 'wood-type', label: 'Wood Type' },
  { id: 'length', label: 'Length' },
  { id: 'width', label: 'Width' },
  { id: 'height', label: 'Height' },
  { id: 'quantity', label: 'Quantity' },
]

const SUMMARY_PRODUCT_ID = 'wooden-dining-table'

const EMPTY_VALUES = {
  'furniture-type': '',
  'wood-type': '',
  length: '',
  width: '',
  height: '',
  quantity: '',
  notes: '',
}

/**
 * Figma screen 13 — Custom Orders (Inter typography page).
 * Light form card (1px black stroke) holding the dining-table summary block,
 * the six 420px fields with white Inter 700 labels, the square-cornered
 * notes textarea, the blue upload link, and SUBMIT CUSTOM ORDER.
 * Submit builds a mock order record and routes with router state.
 */
export default function CustomOrderPage() {
  const navigate = useNavigate()
  const product = getProduct(SUMMARY_PRODUCT_ID)
  const [values, setValues] = useState(EMPTY_VALUES)
  const [errors, setErrors] = useState({})

  const setValue = (key) => (value) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    const next = {}
    for (const { id, label } of FORM_FIELDS) {
      if (!isFilled(values[id])) {
        next[id] = `${label} is required`
      }
    }
    setErrors(next)
    if (Object.keys(next).length === 0) {
      const order = createOrder({ furniture: values['furniture-type'] })
      navigate('/order-confirmation', { state: { order } })
    }
  }

  return (
    <PageLayout>
      <section className="custom">
        <h1 className="custom__title">Create Your Custom Furniture</h1>
        <p className="custom__sub">
          Tell us what you need and we&apos;ll help bring your idea to life.
        </p>

        <div className="custom__card">
          <div className="custom__summary">
            <span
              className="custom__summary-image"
              role="img"
              aria-label={`${product.name} image`}
            />
            <h2 className="custom__summary-title">{product.name}</h2>
            <h3 className="custom__summary-heading">Description</h3>
            <p className="custom__summary-desc">{product.description}</p>
            <ul className="custom__summary-details">
              {DIMENSIONS_PLAIN.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </ul>
          </div>

          <form className="custom__form" onSubmit={handleSubmit} noValidate>
            <div className="custom__fields">
              {FORM_FIELDS.map(({ id, label }) => (
                <Input
                  key={id}
                  label={label}
                  id={id}
                  type="text"
                  placeholder=""
                  value={values[id]}
                  onChange={setValue(id)}
                  error={errors[id]}
                />
              ))}
            </div>

            <textarea
              className="custom__notes"
              placeholder="Describe your preferred design, color, style, or other requests..."
              value={values.notes}
              onChange={(e) => setValues((prev) => ({ ...prev, notes: e.target.value }))}
            />

            <button type="button" className="custom__upload">
              + Upload Reference Image.
            </button>

            <div className="custom__submit">
              <Button variant="filled" type="submit">
                SUBMIT CUSTOM ORDER.
              </Button>
            </div>
          </form>
        </div>
      </section>
    </PageLayout>
  )
}
