import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import SignupPage from './SignupPage'

const signUp = vi.hoisted(() => vi.fn())

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

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
  beforeEach(() => {
    signUp.mockReset()
  })

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

  test('valid submit creates the account and navigates to /signup-success', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'secret')
    signUp.mockResolvedValue({
      data: {
        user: { email: 'a@b.com' },
        session: { user: { email: 'a@b.com' } },
      },
      error: null,
    })
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(signUp).toHaveBeenCalledWith({ email: 'a@b.com', password: 'secret' })
    expect(await screen.findByText('SIGNUP SUCCESS STUB')).toBeInTheDocument()
  })

  test('an already-registered email shows the pinned copy and stays', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'secret')
    signUp.mockResolvedValue({
      data: {},
      error: { message: 'User already registered' },
    })
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(
      await screen.findByText('Account already exists - try logging in.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('SIGNUP SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('other signup failures render the message inline', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'secret')
    signUp.mockResolvedValue({
      data: {},
      error: { message: 'Password too weak' },
    })
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(await screen.findByText('Password too weak')).toBeInTheDocument()
    expect(screen.queryByText('SIGNUP SUCCESS STUB')).not.toBeInTheDocument()
  })

  test('a user without a session (obfuscated duplicate) shows the pinned copy and stays', async () => {
    const user = userEvent.setup()
    renderSignup()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'secret')
    signUp.mockResolvedValue({
      data: { user: { email: 'a@b.com', identities: [] }, session: null },
      error: null,
    })
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))
    expect(
      await screen.findByText('Account already exists - try logging in.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('SIGNUP SUCCESS STUB')).not.toBeInTheDocument()
  })
})
