import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import ProfileIcon from '../../components/ProfileIcon/ProfileIcon'
import { listOrders } from '../../lib/orders'
import './OrderConfirmationPage.css'

/**
 * Figma screen 14 — Order Confirmation.
 * The custom-order submission arrives via router state and renders exactly
 * what saved. Direct visits (refresh, deep link) fall back to the user's
 * latest saved order; with no orders yet the panel shows the pinned
 * no-recent-order line, and a failed fetch shows the raw error inline.
 * The mauve summary panel is square-cornered per spec §4a.
 */
export default function OrderConfirmationPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const savedOrder = state?.order
  const [fetch, setFetch] = useState(
    savedOrder ? { status: 'idle' } : { status: 'loading' },
  )

  useEffect(() => {
    if (savedOrder) return undefined
    listOrders()
      .then((rows) => setFetch({ status: 'done', order: rows[0] ?? null }))
      .catch((error) => setFetch({ status: 'error', message: error.message }))
    return undefined
  }, [savedOrder])

  const order = savedOrder ?? (fetch.status === 'done' ? fetch.order : null)
  const loading = !savedOrder && fetch.status === 'loading'
  const fetchError = fetch.status === 'error' ? fetch.message : ''

  let content
  if (order) {
    content = (
      <>
        <ProfileIcon />
        <h1 className="confirmation__title">ORDER SUBMITTED</h1>
        <p className="confirmation__sub">
          Your custom furniture request has been successfully submitted.
        </p>

        <div className="confirmation__panel">
          <p>Order #: {order.number}</p>
          <p>Furniture: {order.furniture}</p>
          <p>Status: {order.status}</p>
          <p>Estimated Response: {order.eta}</p>
        </div>

        <div className="confirmation__actions">
          <Button variant="filled" onClick={() => navigate('/my-orders')}>
            VIEW MY ORDERS
          </Button>
          <Button variant="outline" onClick={() => navigate('/home')}>
            BACK TO HOME
          </Button>
        </div>
      </>
    )
  } else if (loading) {
    content = null
  } else if (fetchError) {
    content = (
      <p className="confirmation__fetch-error" role="alert">
        {fetchError}
      </p>
    )
  } else {
    content = <p className="confirmation__empty">No recent order found.</p>
  }

  return (
    <PageLayout>
      <section className="confirmation">{content}</section>
    </PageLayout>
  )
}
