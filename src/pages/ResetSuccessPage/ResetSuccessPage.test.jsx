import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import ResetSuccessPage from './ResetSuccessPage'

function renderResetSuccess() {
  return render(
    <MemoryRouter initialEntries={['/reset-success']}>
      <Routes>
        <Route path="/reset-success" element={<ResetSuccessPage />} />
        <Route path="/login" element={<div>LOGIN STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('ResetSuccessPage (Figma screen 09)', () => {
  test('renders the exact Figma copy as one wrapping heading', () => {
    const { container } = renderResetSuccess()
    expect(screen.getByText('Password updated successfully!')).toBeInTheDocument()
    expect(screen.getByText('You can now Log in')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Log in' })).toBeInTheDocument()
    expect(container.querySelector('.auth-form--centered')).not.toBeNull()
  })

  test('Go to Log in navigates to /login', async () => {
    const user = userEvent.setup()
    renderResetSuccess()
    await user.click(screen.getByRole('button', { name: 'Go to Log in' }))
    expect(await screen.findByText('LOGIN STUB')).toBeInTheDocument()
  })
})
