import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import '../../styles/auth-form.css'

/**
 * Figma screen 09 — Reset Password Successful (terminal screen).
 * Centered card: "Password updated successfully!" wraps naturally,
 * then "Go to Log in" returns to Login.
 */
export default function ResetSuccessPage() {
  const navigate = useNavigate()
  return (
    <AuthLayout>
      <div className="auth-form auth-form--centered">
        <h1 className="auth-form__title">Password updated successfully!</h1>
        <p className="auth-form__subtitle">You can now Log in</p>
        <Button variant="filled" onClick={() => navigate('/login')}>
          Go to Log in
        </Button>
      </div>
    </AuthLayout>
  )
}
