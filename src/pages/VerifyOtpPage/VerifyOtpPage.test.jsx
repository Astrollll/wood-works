import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import VerifyOtpPage from './VerifyOtpPage'

function renderVerifyOtp() {
  return render(
    <MemoryRouter initialEntries={['/verify-otp']}>
      <Routes>
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/otp-verified" element={<div>OTP VERIFIED STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function typeDigits(user, value) {
  for (let i = 0; i < value.length; i++) {
    await user.type(screen.getAllByRole('textbox')[i], value[i])
  }
}

describe('VerifyOtpPage (Figma screen 04)', () => {
  test('renders the exact Figma copy with the OTP label and six tiles', () => {
    renderVerifyOtp()
    expect(screen.getByText('Welcome!')).toBeInTheDocument()
    expect(screen.getByText('Reset your password')).toBeInTheDocument()
    expect(screen.getByText('OTP')).toBeInTheDocument()
    expect(screen.getAllByRole('textbox')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Send OTP' })).toBeInTheDocument()
  })

  test('partial digits do NOT advance (Review Focus #4)', async () => {
    const user = userEvent.setup()
    renderVerifyOtp()
    await typeDigits(user, '24681')
    await user.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect(screen.queryByText('OTP VERIFIED STUB')).not.toBeInTheDocument()
  })

  test('all six digits navigate to /otp-verified (mock)', async () => {
    const user = userEvent.setup()
    renderVerifyOtp()
    await typeDigits(user, '246813')
    await user.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect(await screen.findByText('OTP VERIFIED STUB')).toBeInTheDocument()
  })
})
