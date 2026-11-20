import { useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import { AuthProvider, useAuth } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import LoginPage from './pages/LoginPage/LoginPage'
import SignupPage from './pages/SignupPage/SignupPage'
import SignupSuccessPage from './pages/SignupSuccessPage/SignupSuccessPage'
import HomePage from './pages/HomePage/HomePage'
import CatalogPage from './pages/CatalogPage/CatalogPage'
import ProductDetailsPage from './pages/ProductDetailsPage/ProductDetailsPage'
import CustomOrderPage from './pages/CustomOrderPage/CustomOrderPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage/OrderConfirmationPage'
import MyOrdersPage from './pages/MyOrdersPage/MyOrdersPage'
import SendOtpPage from './pages/SendOtpPage/SendOtpPage'
import OtpSentSuccessPage from './pages/OtpSentSuccessPage/OtpSentSuccessPage'
import VerifyOtpPage from './pages/VerifyOtpPage/VerifyOtpPage'
import OtpVerifiedPage from './pages/OtpVerifiedPage/OtpVerifiedPage'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage'
import ResetSuccessPage from './pages/ResetSuccessPage/ResetSuccessPage'
import CartPage from './pages/CartPage/CartPage'

/**
 * Wood Works app shell. Routes come online task-by-task per the plan;
 * the Figma numbering starts at Login, so "/" redirects there.
 * Auth chain: 01 login ⇄ 02 signup → 06 signup-success; forgot-password
 * chain 03 → 07 → 04 → 08 → 05 → 09 → 01 (spec §4 flow wiring).
 * Session-aware routing: store routes are guarded, auth pages bounce
 * signed-in users home, and "/" follows the session (real-auth spec §3).
 */

/** "/" follows the session: home when signed in, login otherwise. */
function RootRedirect() {
  const { user, loading } = useAuth()
  if (loading) return null
  return <Navigate to={user ? '/home' : '/login'} replace />
}

/**
 * Auth pages stay unsigned-in territory — but only for users who ARRIVE
 * signed in. A session that appears mid-signup (supabase fires SIGNED_IN
 * before signUp resolves) must not hijack the page's own navigation: the
 * signup page owns its screen-06 landing, and the live nav log showed the
 * old unguarded bounce overwriting that landing 3ms after it was pushed.
 */
function GuestRoute({ children }) {
  const { user, loading } = useAuth()
  // Arrival snapshot via the render-phase state-adjustment idiom (React:
  // "adjusting state when a prop changes"): the settled value commits in
  // the same render that first observes it, so there is no guest flash,
  // and later session changes (mid-signup SIGNED_IN) cannot move it.
  const [arrival, setArrival] = useState({ settled: false, signedIn: false })
  if (!loading && !arrival.settled) {
    setArrival({ settled: true, signedIn: Boolean(user) })
  }
  if (loading || !arrival.settled) return null
  if (arrival.signedIn) return <Navigate to="/home" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route
            path="/login"
            element={
              <GuestRoute>
                <LoginPage />
              </GuestRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <GuestRoute>
                <SignupPage />
              </GuestRoute>
            }
          />
          <Route path="/signup-success" element={<SignupSuccessPage />} />
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <HomePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/catalog"
            element={
              <ProtectedRoute>
                <CatalogPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:id"
            element={
              <ProtectedRoute>
                <ProductDetailsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/custom-order"
            element={
              <ProtectedRoute>
                <CustomOrderPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/order-confirmation"
            element={
              <ProtectedRoute>
                <OrderConfirmationPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/my-orders"
            element={
              <ProtectedRoute>
                <MyOrdersPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/cart"
            element={
              <CartPage />
            }
          />
          <Route path="/send-otp" element={<SendOtpPage />} />
          <Route path="/otp-sent-success" element={<OtpSentSuccessPage />} />
          <Route path="/verify-otp" element={<VerifyOtpPage />} />
          <Route path="/otp-verified" element={<OtpVerifiedPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/reset-success" element={<ResetSuccessPage />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
