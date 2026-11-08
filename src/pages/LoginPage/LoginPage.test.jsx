import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'

const signInWithPassword = vi.hoisted(() => vi.fn())

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword,
      signOut: vi.fn(),
      getSession: vi.fn(async () => ({ data: { session: null } })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/home" element={<div>HOME PAGE STUB</div>} />
        <Route path="/send-otp" element={<div>SEND OTP STUB</div>} />
        <Route path="/signup" element={<div>SIGNUP STUB</div>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LoginPage (Figma screen 01)', () => {
  beforeEach(() => {
    signInWithPassword.mockReset()
  })

  test('renders the exact Figma copy', () => {
    renderLogin()
    expect(screen.getByText('Welcome Back')).toBeInTheDocument()
    expect(screen.getByText('Sign in to continue to Wood Works.')).toBeInTheDocument()
    expect(screen.getByText('Email Address')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByText('Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your password')).toBeInTheDocument()
    expect(screen.getByText('☐ Remember me')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'LOG IN' })).toBeInTheDocument()
    expect(screen.getByText(/Don.t have an account\?/)).toBeInTheDocument()
  })

  test('Forgot Password? links to /send-otp', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByText('Forgot Password?'))
    expect(screen.getByText('SEND OTP STUB')).toBeInTheDocument()
  })

  test('Sign Up line links to /signup', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByText('Sign Up'))
    expect(screen.getByText('SIGNUP STUB')).toBeInTheDocument()
  })

  test('empty submit shows validation errors and stays on login', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.click(screen.getByRole('button', { name: 'LOG IN' }))
    expect(await screen.findAllByRole('alert').then((els) => els.length)).toBeGreaterThan(0)
    expect(screen.queryByText('HOME PAGE STUB')).not.toBeInTheDocument()
  })

  test('invalid email shows a format error', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'nope')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'LOG IN' }))
    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument()
    expect(screen.queryByText('HOME PAGE STUB')).not.toBeInTheDocument()
  })

  test('valid credentials sign in and navigate to /home', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret')
    signInWithPassword.mockResolvedValue({
      data: {
        session: { user: { email: 'a@b.com' } },
        user: null,
      },
      error: null,
    })
    await user.click(screen.getByRole('button', { name: 'LOG IN' }))
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'secret',
    })
    expect(await screen.findByText('HOME PAGE STUB')).toBeInTheDocument()
  })

  test('bad credentials render the inline error and stay', async () => {
    const user = userEvent.setup()
    renderLogin()
    await user.type(screen.getByPlaceholderText('Enter your email'), 'a@b.com')
    await user.type(screen.getByPlaceholderText('Enter your password'), 'secret')
    signInWithPassword.mockResolvedValue({
      data: {},
      error: { message: 'Invalid login credentials' },
    })
    await user.click(screen.getByRole('button', { name: 'LOG IN' }))
    expect(
      await screen.findByText('Invalid login credentials'),
    ).toBeInTheDocument()
    expect(screen.queryByText('HOME PAGE STUB')).not.toBeInTheDocument()
  })
})
