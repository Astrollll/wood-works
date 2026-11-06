import { useNavigate } from 'react-router-dom'
import AuthLayout from '../../layouts/AuthLayout/AuthLayout'
import Button from '../../components/Button/Button'
import '../../styles/auth-form.css'

/**
 * Figma screen 06 — Sign up Successful (terminal screen).
 * Centered card: "Account Sign up Successfully!" wraps naturally,
 * then "Go to Log in" returns to Login.
 */
export default function SignupSuccessPage() {
  const navigate = useNavigate()
  return (
    <AuthLayout>
      <div className="auth-form auth-form--centered">
        <h1 className="auth-form__title">Account Sign up Successfully!</h1>
        <p className="auth-form__subtitle">You can now Log in</p>
        <Button variant="filled" onClick={() => navigate('/login')}>
          Go to Log in
        </Button>
      </div>
    </AuthLayout>
  )
}
