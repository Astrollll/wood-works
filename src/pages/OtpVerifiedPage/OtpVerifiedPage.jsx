import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import '../../styles/auth-form.css'

/**
 * Figma screen 08 — OTP Verified.
 * Centered card: "OTP Verified Successfully!" wraps naturally,
 * then "Go to Reset Password" advances to the Reset Password screen.
 */
export default function OtpVerifiedPage() {
  const navigate = useNavigate()
  return (
    <AuthLayout>
      <div className="auth-form auth-form--centered">
        <h1 className="auth-form__title">OTP Verified Successfully!</h1>
        <p className="auth-form__subtitle">You can reset your password</p>
        <Button variant="filled" onClick={() => navigate('/reset-password')}>
          Go to Reset Password
        </Button>
      </div>
    </AuthLayout>
  )
}
