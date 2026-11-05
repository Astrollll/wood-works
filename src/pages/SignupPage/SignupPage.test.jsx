import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SignupPage from './SignupPage'

function renderSignup() {
  return render(
    <MemoryRouter initialEntries={['/signup']}>
      <Routes>
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/signup-success" element={<div>SIGNUP SUCCESS STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('SignupPage (Figma screen 02)', () => {
  test('renders the exact Figma copy', () => {
    renderSignup()
    expect(screen.getByText('Welcome!')).toBeInTheDocument()
    expect(screen.getByText('Sign up your account')).toBeInTheDocument()
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(screen.getByText('Confirm Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sign Up' })).toBeInTheDocument()
  })

  test('empty submit shows validation errors and stays', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect((await screen.findAllByRole('alert')).length).toBeGreaterThan(0)
    expect(screen.queryByText('SIGNUP SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('mismatched passwords are rejected', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'different')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(await screen.findByText('Passwords do not match')).toBeInTheDocument()
    expect(screen.queryByText('SIGNUP SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('valid submit navigates to /signup-success (mock)', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(await screen.findByText('SIGNUP SUCCESS STUB')).toBeInTheDocument()
  })
})
