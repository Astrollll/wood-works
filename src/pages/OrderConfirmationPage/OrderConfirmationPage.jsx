import { useLocation, useNavigate } from 'react-router-dom'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import Button from '../../components/Button/Button'
import ProfileIcon from '../../components/ProfileIcon/ProfileIcon'
import { DEFAULT_ORDER } from '../../lib/orders'
import './OrderConfirmationPage.css'

/**
 * Figma screen 14 — Order Confirmation.
 * Direct visits (no router state) render DEFAULT_ORDER; the ORDER NOW /
 * custom-order submissions arrive via router state and replace the record.
 * The mauve summary panel is square-cornered per spec §4a.
 */
export default function OrderConfirmationPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const order = state?.order ?? DEFAULT_ORDER

  return (
    <PageLayout>
      <section className="confirmation">
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
      </section>
    </PageLayout>
  )
}
