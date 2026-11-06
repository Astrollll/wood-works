import PageLayout from '../../layouts/PageLayout/PageLayout'
import './MyOrdersStubPage.css'

/**
 * My Orders stub — the navbar link exists in Figma but no screen does.
 * Held to the store design language so the route never dead-ends.
 */
export default function MyOrdersStubPage() {
  return (
    <PageLayout>
      <section className="my-orders">
        <h1 className="my-orders__title">My Orders</h1>
        <p className="my-orders__empty">No orders yet.</p>
      </section>
    </PageLayout>
  )
}
