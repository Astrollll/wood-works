import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import OtpSentSuccessPage from './OtpSentSuccessPage'

function renderOtpSent() {
  return render(
    <MemoryRouter initialEntries={['/otp-sent-success']}>
      <Routes>
        <Route path="/otp-sent-success" element={<OtpSentSuccessPage />} />
        <Route path="/verify-otp" element={<div>VERIFY OTP STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('OtpSentSuccessPage (Figma screen 07)', () => {
  test('renders the exact Figma copy as one wrapping heading', () => {
    const { container } = renderOtpSent()
    expect(screen.getByText('Email found Successfully!')).toBeInTheDocument()
    expect(screen.getByText('The OTP is sent to your email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to verify OTP' })).toBeInTheDocument()
    expect(container.querySelector('.auth-form--centered')).not.toBeNull()
  })

  test('Go to verify OTP navigates to /verify-otp', async () => {
    const user = userEvent.setup()
    renderOtpSent()
    await user.click(screen.getByRole('button', { name: 'Go to verify OTP' }))
    expect(await screen.findByText('VERIFY OTP STUB')).toBeInTheDocument()
  })
})
