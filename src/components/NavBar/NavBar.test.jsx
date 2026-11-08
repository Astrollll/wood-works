import { beforeEach, describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from '../../auth/AuthProvider'
import NavBar from './NavBar'

const signOut = vi.hoisted(() => vi.fn(async () => ({})))
const sessionForTests = vi.hoisted(() => ({
  data: { session: { user: { email: 'a@b.com' } } },
}))

vi.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut,
      getSession: vi.fn(async () => sessionForTests),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

function renderNavbar() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  )
}

function renderNavbarLoggedIn() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<div>LOGIN STUB</div>} />
          <Route path="/home" element={<NavBar />} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('NavBar', () => {
  beforeEach(() => {
    signOut.mockClear()
  })

  test('renders the 4 nav links with their routes', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Furniture' })).toHaveAttribute('href', '/catalog')
    expect(screen.getByRole('link', { name: 'Custom Order' })).toHaveAttribute('href', '/custom-order')
    expect(screen.getByRole('link', { name: 'My Orders' })).toHaveAttribute('href', '/my-orders')
  })

  test('logo text links home', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: 'WOOD WORKS' })).toHaveAttribute('href', '/home')
  })

  test('logged-out profile stays an inert image', () => {
    renderNavbar()
    expect(screen.getByRole('img', { name: 'Profile' })).toBeInTheDocument()
  })

  test('is a nav landmark', () => {
    const { container } = renderNavbar()
    expect(container.querySelector('nav')).toBeInTheDocument()
  })

  test('logged-in profile becomes a button that opens the account popover', async () => {
    const user = userEvent.setup()
    renderNavbarLoggedIn()
    await user.click(
      await screen.findByRole('button', { name: 'Account options' }),
    )
    expect(await screen.findByText('a@b.com')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Log out' })).toBeInTheDocument()
  })

  test('Log out signs out and returns to /login', async () => {
    const user = userEvent.setup()
    renderNavbarLoggedIn()
    await user.click(
      await screen.findByRole('button', { name: 'Account options' }),
    )
    await user.click(await screen.findByRole('button', { name: 'Log out' }))
    expect(signOut).toHaveBeenCalled()
    expect(await screen.findByText('LOGIN STUB')).toBeInTheDocument()
  })
})
