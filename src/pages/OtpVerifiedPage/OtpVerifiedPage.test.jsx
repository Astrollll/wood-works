import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OtpVerifiedPage from './OtpVerifiedPage'

function renderOtpVerified() {
  return render(
    <MemoryRouter initialEntries={['/otp-verified']}>
      <Routes>
        <Route path="/otp-verified" element={<OtpVerifiedPage />} />
        <Route path="/reset-password" element={<div>RESET PASSWORD STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OtpVerifiedPage (Figma screen 08)', () => {
  test('renders the exact Figma copy as one wrapping heading', () => {
    const { container } = renderOtpVerified()
    expect(screen.getByText('OTP Verified Successfully!')).toBeInTheDocument()
    expect(screen.getByText('You can reset your password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Reset Password' })).toBeInTheDocument()
    expect(container.querySelector('.auth-form--centered')).not.toBeNull()
  })

  test('Go to Reset Password navigates to /reset-password', async () => {
    const user = userEvent.setup()
    renderOtpVerified()
    await user.click(screen.getByRole('button', { name: 'Go to Reset Password' }))
    expect(await screen.findByText('RESET PASSWORD STUB')).toBeInTheDocument()
  })
})
