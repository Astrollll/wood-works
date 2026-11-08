import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { supabase } from '../../lib/supabase'
import { isEmail, isFilled, passwordsMatch } from '../../lib/validation'
import '../../styles/auth-form.css'

/**
 * Figma screen 02 — Sign Up.
 * Welcome! card with email, password, confirm password.
 * Submits to /signup-success in the mock flow (no backend).
 */
export default function SignupPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [errors, setErrors] = useState({})

  const handleSubmit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!isFilled(email)) next.email = 'Email is required'
    else if (!isEmail(email)) next.email = 'Enter a valid email'
    if (!isFilled(password)) next.password = 'Password is required'
    if (!isFilled(confirm)) next.confirm = 'Confirm your password'
    else if (!passwordsMatch(password, confirm)) next.confirm = 'Passwords do not match'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      const { error } = await supabase.auth.signUp({ email, password })
      if (error) {
        setErrors({ ...next, email: /already/i.test(error.message)
          ? 'Account already exists - try logging in.'
          : error.message })
        return
      }
      navigate('/signup-success')
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-form__title">Welcome!</h1>
        <p className="auth-form__subtitle">Sign up your account</p>

        <Input
          label="Email Address"
          id="signup-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <Input
          label="Password"
          id="signup-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <Input
          label="Confirm Password"
          id="signup-confirm"
          type="password"
          placeholder="Enter your password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
        />

        <Button variant="filled" type="submit">
          Sign Up
        </Button>
      </form>
    </AuthLayout>
  )
}
