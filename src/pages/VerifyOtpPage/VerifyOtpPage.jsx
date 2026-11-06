import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import OtpCodeInput from '../../components/OtpCodeInput/OtpCodeInput'
import '../../styles/auth-form.css'

const EMPTY_CODE = ['', '', '', '', '', '']

/**
 * Figma screen 04 — Verify OTP Code.
 * Six 44px tiles; Send OTP only advances when all six digits are filled
 * (Review Focus #4: partial codes do not advance).
 */
export default function VerifyOtpPage() {
  const navigate = useNavigate()
  const [digits, setDigits] = useState(EMPTY_CODE)

  const handleSubmit = (event) => {
    event.preventDefault()
    if (digits.every((digit) => digit !== '')) {
      navigate('/otp-verified')
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-form__title">Welcome!</h1>
        <p className="auth-form__subtitle">Reset your password</p>

        <span className="auth-form__label">OTP</span>
        <OtpCodeInput digits={digits} onChange={setDigits} />

        <Button variant="filled" type="submit">
          Send OTP
        </Button>
      </form>
    </AuthLayout>
  )
}
