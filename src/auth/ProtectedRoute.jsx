import { Navigate } from 'react-router-dom'
import { useAuth } from './AuthProvider'

/**
 * Guard for store routes (/home, /catalog, /product/:id, /custom-order,
 * /order-confirmation, /my-orders): stays blank while the session hydrates
 * (no redirect flash), renders its children when signed in, otherwise
 * redirects to /login.
 */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return null
  if (!user) return <Navigate to="/login" replace />
  return children
}
