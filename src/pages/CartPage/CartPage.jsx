import { useCallback, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import QuantityStepper from '../../components/QuantityStepper/QuantityStepper'
import { listCart, setQuantity, removeCartItem, placeOrder } from '../../lib/cart'
import { formatPrice } from '../../lib/formatPrice'
import { useAuth } from '../../auth/AuthProvider'
import './CartPage.css'

/**
 * Figma screen 15 — Cart.
 * One page lists items, shows quantities, and carries the SUBMIT ORDER button.
 * CartPage guards its own auth (not ProtectedRoute) so it can redirect with state.from = '/cart'.
 */
export default function CartPage() {
  const navigate = useNavigate()
  const { user, loading } = useAuth()
  const [fetch, setFetch] = useState({ status: 'loading', lines: [], message: '' })
  const [actionError, setActionError] = useState('')
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const load = useCallback(() => {
    listCart()
      .then((lines) => setFetch({ status: 'ready', lines, message: '' }))
      .catch((e) => setFetch({ status: 'error', lines: [], message: e.message }))
  }, [])

  useEffect(() => {
    if (user) {
      load()
    }
  }, [user, load])

  if (loading) {
    return null
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: '/cart' }} replace />
  }

  const changeQuantity = async (productId, quantity) => {
    setActionError('')
    try {
      await setQuantity(productId, quantity)
      load()
    } catch (e) {
      setActionError(e.message)
    }
  }

  const remove = async (productId) => {
    setActionError('')
    try {
      await removeCartItem(productId)
      load()
    } catch (e) {
      setActionError(e.message)
    }
  }

  const handleSubmit = async () => {
    setSubmitError('')
    setSubmitting(true)
    try {
      const order = await placeOrder()
      navigate('/order-confirmation', { state: { order } })
    } catch (e) {
      setSubmitError(e.message)
    } finally {
      setSubmitting(false)
    }
  }

  const { status, lines, message } = fetch
  const grandTotal = lines.reduce((sum, line) => sum + line.lineTotal, 0)

  return (
    <PageLayout>
      <section className="cart">
        <h1 className="cart__title">Your Cart</h1>

        {status === 'loading' && <p>Loading...</p>}

        {status === 'error' && (
          <>
            <p className="cart__error" role="alert">
              {message}
            </p>
            <button type="button" className="cart__retry" onClick={load}>
              Retry
            </button>
          </>
        )}

        {status === 'ready' && (
          <>
            {lines.length === 0 ? (
              <>
                <p className="cart__empty">Your cart is empty.</p>
                <Link to="/catalog" className="cart__catalog-link">
                  Browse the catalog
                </Link>
              </>
            ) : (
              <>
                {lines.map((line) => (
                  <div key={line.product.id} className="cart__row">
                    <div className="cart__row-left">
                      <div className="cart__row-name">{line.product.name}</div>
                      <div className="cart__row-unit-price">{formatPrice(line.product.price)}</div>
                    </div>
                    <div className="cart__row-right">
                      <QuantityStepper
                        value={line.quantity}
                        onChange={(next) => changeQuantity(line.product.id, next)}
                        onRemove={() => remove(line.product.id)}
                      />
                      <div className="cart__row-line-total">{formatPrice(line.lineTotal)}</div>
                      <button
                        type="button"
                        className="cart__remove"
                        onClick={() => remove(line.product.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
                <div className="cart__total">
                  Total: {formatPrice(grandTotal)}
                </div>

                {actionError && (
                  <p className="cart__error" role="alert">
                    {actionError}
                  </p>
                )}

                {submitError && (
                  <p className="cart__error" role="alert">
                    {submitError}
                  </p>
                )}

                <Button variant="filled" disabled={submitting} onClick={handleSubmit}>
                  SUBMIT ORDER
                </Button>
              </>
            )}
          </>
        )}
      </section>
    </PageLayout>
  )
}