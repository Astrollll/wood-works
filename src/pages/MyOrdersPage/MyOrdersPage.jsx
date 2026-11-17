import { useCallback, useEffect, useState } from 'react'
import PageLayout from '../../layouts/PageLayout/PageLayout'
import { listOrders } from '../../lib/orders'
import './MyOrdersPage.css'

/** Medium locale date, e.g. "Nov 17, 2026" (spec §5.4). */
function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', { dateStyle: 'medium' })
}

/**
 * My Orders — the navbar link Figma never designed a screen for, now real.
 * Lists the signed-in user's orders (RLS keeps them private) in the store
 * design language: order number, furniture, status, eta, created date.
 * Empty state keeps the pinned copy; a failed load shows the raw error
 * with a Retry action.
 */
export default function MyOrdersPage() {
  const [fetch, setFetch] = useState({
    status: 'loading',
    orders: [],
    message: '',
  })

  const load = useCallback(() => {
    listOrders()
      .then((orders) => setFetch({ status: 'done', orders, message: '' }))
      .catch((error) =>
        setFetch({ status: 'error', orders: [], message: error.message }),
      )
  }, [])

  useEffect(() => {
    load()
  }, [load])

  return (
    <PageLayout>
      <section className="my-orders">
        <h1 className="my-orders__title">My Orders</h1>

        {fetch.status === 'loading' ? null : fetch.status === 'error' ? (
          <>
            <p className="my-orders__error" role="alert">
              {fetch.message}
            </p>
            <button
              type="button"
              className="my-orders__retry"
              onClick={load}
            >
              Retry
            </button>
          </>
        ) : fetch.orders.length === 0 ? (
          <p className="my-orders__empty">No orders yet.</p>
        ) : (
          <ul className="my-orders__list">
            {fetch.orders.map((order) => (
              <li className="my-orders__card" key={order.id}>
                <p className="my-orders__card-number">Order #: {order.number}</p>
                <p className="my-orders__card-furniture">{order.furniture}</p>
                <p className="my-orders__card-status">{order.status}</p>
                <p className="my-orders__card-eta">{order.eta}</p>
                <p className="my-orders__card-date">{formatDate(order.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PageLayout>
  )
}
