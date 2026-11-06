import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { isEmail, isFilled } from '../../lib/validation'
import '../../styles/auth-form.css'

/**
 * Figma screen 03 — Send OTP (forgot-password start).
 * "Welcome! / Reset your password" card: email input, then Send OTP.
 * Submits to /otp-sent-success in the mock flow.
 */
export default function SendOtpPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()
    const next = {}
    if (!isFilled(email)) next.email = 'Email is required'
    else if (!isEmail(email)) next.email = 'Enter a valid email'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      navigate('/otp-sent-success')
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-form__title">Welcome!</h1>
        <p className="auth-form__subtitle">Reset your password</p>

        <Input
          label="Email Address"
          id="send-otp-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />

        <Button variant="filled" type="submit">
          Send OTP
        </Button>
      </form>
    </AuthLayout>
  )
}
