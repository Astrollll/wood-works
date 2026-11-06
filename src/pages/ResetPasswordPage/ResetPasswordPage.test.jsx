import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResetPasswordPage from './ResetPasswordPage'

function renderResetPassword() {
  return render(
    <MemoryRouter initialEntries={['/reset-password']}>
      <Routes>
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/reset-success" element={<div>RESET SUCCESS STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetPasswordPage (Figma screen 05)', () => {
  test('renders the exact Figma copy with the remember row', () => {
    renderResetPassword()
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Reset your password')).toBeInTheDocument()
    expect(screen.getByLabelText('New Password')).toHaveAttribute(
      'placeholder',
      'Enter new password',
    )
    expect(screen.getByLabelText('Confirm New Password')).toHaveAttribute(
      'placeholder',
      'Confirm new password',
    )
    expect(screen.getByText('☐ Remember me')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reset Password' })).toBeInTheDocument()
  })

  test('empty submit shows validation errors and stays', async () => {
    const user = userEvent.setup()
    renderResetPassword()
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.queryByText('RESET SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('mismatched new passwords are rejected (Review Focus: match rule)', async () => {
    const user = userEvent.setup()
    renderResetPassword()
    await user.type(screen.getByLabelText('New Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm New Password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(screen.queryByText('RESET SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('matching passwords navigate to /reset-success (mock)', async () => {
    const user = userEvent.setup()
    renderResetPassword()
    await user.type(screen.getByLabelText('New Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm New Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Reset Password' }))
    expect(await screen.findByText('RESET SUCCESS STUB')).toBeInTheDocument()
  })
})
