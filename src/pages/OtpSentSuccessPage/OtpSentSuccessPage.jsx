import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import '../../styles/auth-form.css'

/**
 * Figma screen 07 — Send OTP Successful.
 * Centered card: "Email found Successfully!" wraps naturally at card width,
 * then "Go to verify OTP" advances to the Verify OTP screen.
 */
export default function OtpSentSuccessPage() {
  const navigate = useNavigate()
  return (
    <AuthLayout>
      <div className="auth-form auth-form--centered">
        <h1 className="auth-form__title">Email found Successfully!</h1>
        <p className="auth-form__subtitle">The OTP is sent to your email</p>
        <Button variant="filled" onClick={() => navigate('/verify-otp')}>
          Go to verify OTP
        </Button>
      </div>
    </AuthLayout>
  )
}
