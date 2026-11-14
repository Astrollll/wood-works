import { act } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './AuthProvider'
import ProtectedRoute from './ProtectedRoute'

const sessionForTests = vi.hoisted(() => ({ data: { session: null } }))
const gate = vi.hoisted(() => ({ resolve: null }))

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(
        () =>
          new Promise((resolve) => {
            gate.resolve = resolve
          }),
      ),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
    },
  },
}))

function renderGuard() {
  return render(
    <MemoryRouter initialEntries={['/home']}>
      <AuthProvider>
        <Routes>
          <Route
            path="/home"
            element={
              <ProtectedRoute>
                <div>PRIVATE CHILD</div>
              </ProtectedRoute>
            }
          />
          <Route path="/login" element={<div>LOGIN STUB</div>} />
        </Routes>
      </AuthProvider>
    </MemoryRouter>,
  )
}

describe('ProtectedRoute', () => {
  test('stays blank while the session hydrates, then renders its children', async () => {
    sessionForTests.data = { session: { user: { email: 'a@b.com' } } }
    renderGuard()
    expect(screen.queryByText('PRIVATE CHILD')).not.toBeInTheDocument()
    expect(screen.queryByText('LOGIN STUB')).not.toBeInTheDocument()
    await act(async () => {
      gate.resolve(sessionForTests)
    })
    expect(await screen.findByText('PRIVATE CHILD')).toBeInTheDocument()
  })

  test('renders its children when a user is signed in', async () => {
    sessionForTests.data = { session: { user: { email: 'a@b.com' } } }
    renderGuard()
    // Bypass the gate immediately: resolve the pending hydrate call.
    await act(async () => {
      gate.resolve(sessionForTests)
    })
    expect(await screen.findByText('PRIVATE CHILD')).toBeInTheDocument()
  })

  test('redirects to /login when no user is signed in', async () => {
    sessionForTests.data = { session: null }
    renderGuard()
    await act(async () => {
      gate.resolve(sessionForTests)
    })
    expect(await screen.findByText('LOGIN STUB')).toBeInTheDocument()
    expect(screen.queryByText('PRIVATE CHILD')).not.toBeInTheDocument()
  })
})
