import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import './App.css'
import LoginPage from './pages/LoginPage/LoginPage'
import SignupPage from './pages/SignupPage/SignupPage'
import SignupSuccessPage from './pages/SignupSuccessPage/SignupSuccessPage'
import HomePage from './pages/HomePage/HomePage'
import CatalogPage from './pages/CatalogPage/CatalogPage'
import ProductDetailsPage from './pages/ProductDetailsPage/ProductDetailsPage'
import CustomOrderPage from './pages/CustomOrderPage/CustomOrderPage'
import OrderConfirmationPage from './pages/OrderConfirmationPage/OrderConfirmationPage'
import MyOrdersStubPage from './pages/MyOrdersStubPage/MyOrdersStubPage'
import SendOtpPage from './pages/SendOtpPage/SendOtpPage'
import OtpSentSuccessPage from './pages/OtpSentSuccessPage/OtpSentSuccessPage'
import VerifyOtpPage from './pages/VerifyOtpPage/VerifyOtpPage'
import OtpVerifiedPage from './pages/OtpVerifiedPage/OtpVerifiedPage'
import ResetPasswordPage from './pages/ResetPasswordPage/ResetPasswordPage'
import ResetSuccessPage from './pages/ResetSuccessPage/ResetSuccessPage'

/**
 * Wood Works app shell. Routes come online task-by-task per the plan;
 * the Figma numbering starts at Login, so "/" redirects there.
 * Auth chain: 01 login ⇄ 02 signup → 06 signup-success; forgot-password
 * chain 03 → 07 → 04 → 08 → 05 → 09 → 01 (spec §4 flow wiring).
 */
export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-success" element={<SignupSuccessPage />} />
        <Route path="/home" element={<HomePage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/product/:id" element={<ProductDetailsPage />} />
        <Route path="/custom-order" element={<CustomOrderPage />} />
        <Route path="/order-confirmation" element={<OrderConfirmationPage />} />
        <Route path="/my-orders" element={<MyOrdersStubPage />} />
        <Route path="/send-otp" element={<SendOtpPage />} />
        <Route path="/otp-sent-success" element={<OtpSentSuccessPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/otp-verified" element={<OtpVerifiedPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-success" element={<ResetSuccessPage />} />
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
