import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import Input from '../../components/Input/Input'
import { isFilled, passwordsMatch } from '../../lib/validation'
import '../../styles/auth-form.css'

/**
 * Figma screen 05 — Reset Password.
 * "Welcome Back" card: New Password + Confirm New Password, the shared
 * ☐ Remember me row, then Reset Password (validates the match rule).
 * Submits to /reset-success in the mock flow.
 */
export default function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState({})

  const handleSubmit = (event) => {
    event.preventDefault()
    const next = {}
    if (!isFilled(password)) next.password = 'Password is required'
    if (!isFilled(confirm)) next.confirm = 'Confirm your password'
    else if (isFilled(password) && !passwordsMatch(password, confirm)) {
      next.confirm = 'Passwords do not match'
    }
    setErrors(next)
    if (Object.keys(next).length === 0) {
      navigate('/reset-success')
    }
  }

  return (
    <AuthLayout>
      <form className="auth-form" onSubmit={handleSubmit} noValidate>
        <h1 className="auth-form__title">Welcome Back</h1>
        <p className="auth-form__subtitle">Reset your password</p>

        <Input
          label="New Password"
          id="new-password"
          type="password"
          placeholder="Enter new password"
          value={password}
          onChange={setPassword}
          error={errors.password}
        />
        <Input
          label="Confirm New Password"
          id="confirm-new-password"
          type="password"
          placeholder="Confirm new password"
          value={confirm}
          onChange={setConfirm}
          error={errors.confirm}
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
        </div>

        <Button variant="filled" type="submit">
          Reset Password
        </Button>
      </form>
    </AuthLayout>
  )
}
