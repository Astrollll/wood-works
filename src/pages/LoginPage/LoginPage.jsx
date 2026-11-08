import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { supabase } from '../../lib/supabase'
import { isEmail, isFilled } from '../../lib/validation'
import '../../styles/auth-form.css'

/**
 * Figma screen 01 — Login.
 * Left: brand panel (AuthLayout). Right: "Welcome Back" card with email +
 * password, a remember row, LOG IN, and the sign-up handoff line.
 * Submits to /home in the mock (no backend).
 */
export default function LoginPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = async (event) => {
    event.preventDefault()
    const next = {}
    if (!isFilled(email)) next.email = 'Email is required'
    else if (!isEmail(email)) next.email = 'Enter a valid email'
    if (!isFilled(password)) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length === 0) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      if (error) {
        setErrors({ ...next, password: error.message })
        return
      }
      navigate('/home')
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-form__title">Welcome Back</h1>
        <p className="auth-form__subtitle">Sign in to continue to Wood Works.</p>

        <Input
          label="Email Address"
          id="login-email"
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={setEmail}
          error={errors.email}
        />
        <Input
          label="Password"
          id="login-password"
          type="password"
          placeholder="Enter your password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />

        <div className="auth-form__row">
          <label className="auth-form__checkbox">
            <input
              type="checkbox"
              checked={remember}
              onChange={(e) => setRemember(e.target.checked)}
              aria-label="Remember me"
            />
            <span aria-hidden="true">☐ Remember me</span>
          </label>
          <Link to="/send-otp" className="auth-form__link">
            Forgot Password?
          </Link>
        </div>

        <Button variant="filled" type="submit">
          LOG IN
        </Button>

        <p className="auth-form__footer">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="auth-form__link">
            Sign Up
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
