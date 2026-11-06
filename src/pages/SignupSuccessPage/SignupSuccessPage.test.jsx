import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SignupSuccessPage from './SignupSuccessPage'

function renderSignupSuccess() {
  return render(
    <MemoryRouter initialEntries={['/signup-success']}>
      <Routes>
        <Route path="/signup-success" element={<SignupSuccessPage />} />
        <Route path="/login" element={<div>LOGIN STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SignupSuccessPage (Figma screen 06)', () => {
  test('renders the exact Figma copy as one wrapping heading', () => {
    const { container } = renderSignupSuccess()
    expect(screen.getByText('Account Sign up Successfully!')).toBeInTheDocument()
    expect(screen.getByText('You can now Log in')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go to Log in' })).toBeInTheDocument()
    expect(container.querySelector('.auth-form--centered')).not.toBeNull()
  })

  test('Go to Log in navigates to /login', async () => {
    const user = userEvent.setup()
    renderSignupSuccess()
    await user.click(screen.getByRole('button', { name: 'Go to Log in' }))
    expect(await screen.findByText('LOGIN STUB')).toBeInTheDocument()
  })
})
