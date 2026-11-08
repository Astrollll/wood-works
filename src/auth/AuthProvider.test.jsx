import { act } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'

const signUp = vi.hoisted(() => vi.fn())
const getSessionHandback = vi.hoisted(() => ({}))
const stateChanges = vi.hoisted(() => [])

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(async () => getSessionHandback),
      onAuthStateChange: vi.fn((cb) => {
        stateChanges.push(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
  },
}))

function Probe() {
  const { user, loading } = useAuth()
  return (
    <div>
      {String(loading)}|{user ? user.email : 'none'}
    </div>
  )
}

describe('AuthProvider', () => {
  test('hydrates the session from getSession', async () => {
    getSessionHandback.data = { session: { user: { email: 'a@b.com' } } }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() =>
      expect(screen.getByText('false|a@b.com')).toBeInTheDocument(),
    )
  })

  test('exposes no user until getSession resolves', () => {
    getSessionHandback.data = { session: null }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    expect(screen.getByText('true|none')).toBeInTheDocument()
    return waitFor(() =>
      expect(screen.getByText('false|none')).toBeInTheDocument(),
    )
  })

  test('clears the user on SIGNED_OUT state change', async () => {
    getSessionHandback.data = { session: { user: { email: 'a@b.com' } } }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() =>
      expect(screen.getByText('false|a@b.com')).toBeInTheDocument(),
    )
    await act(async () => {
      stateChanges[stateChanges.length - 1]('SIGNED_OUT', null)
    })
    await waitFor(() =>
      expect(screen.getByText('false|none')).toBeInTheDocument(),
    )
  })
})
