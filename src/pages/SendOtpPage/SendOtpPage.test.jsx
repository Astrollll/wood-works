import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SendOtpPage from './SendOtpPage'

function renderSendOtp() {
  return render(
    <MemoryRouter initialEntries={['/send-otp']}>
      <Routes>
        <Route path="/send-otp" element={<SendOtpPage />} />
        <Route path="/otp-sent-success" element={<div>OTP SENT SUCCESS STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SendOtpPage (Figma screen 03)', () => {
  test('renders the exact Figma copy', () => {
    renderSendOtp()
    expect(screen.getByText('Welcome!')).toBeInTheDocument()
    expect(screen.getByText('Reset your password')).toBeInTheDocument()
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Send OTP' })).toBeInTheDocument()
  })

  test('empty submit shows a validation error and stays', async () => {
    const user = userEvent.setup()
    renderSendOtp()
    await user.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.queryByText('OTP SENT SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('invalid email format shows an error and stays', async () => {
    const user = userEvent.setup()
    renderSendOtp()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'nope')
    await user.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.queryByText('OTP SENT SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('valid email navigates to /otp-sent-success (mock)', async () => {
    const user = userEvent.setup()
    renderSendOtp()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.click(screen.getByRole('button', { name: 'Send OTP' }))
    expect(await screen.findByText('OTP SENT SUCCESS STUB')).toBeInTheDocument()
  })
})
