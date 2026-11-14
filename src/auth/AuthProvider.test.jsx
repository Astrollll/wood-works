import { act } from 'react'
import { describe, expect, test, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { AuthProvider, useAuth } from './AuthProvider'
import { supabase } from '../lib/supabase'

const signUp = vi.hoisted(() => vi.fn())
const getSessionHandback = vi.hoisted(() => ({}))
const stateChanges = vi.hoisted(() => [])
const unsubscribes = vi.hoisted(() => [])

vi.mock('../lib/supabase', () => ({
  supabase: {
    auth: {
      signUp,
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(async () => getSessionHandback),
      onAuthStateChange: vi.fn((cb) => {
        stateChanges.push(cb)
        const unsubscribe = vi.fn()
        unsubscribes.push(unsubscribe)
        return { data: { subscription: { unsubscribe } } }
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

  test('settles loading to false when getSession fails', async () => {
    getSessionHandback.data = { session: null }
    vi.mocked(supabase.auth.getSession).mockRejectedValueOnce(
      new Error('network down'),
    )
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(screen.getByText('false|none')).toBeInTheDocument()
    })
  })

  test('unsubscribes from state changes on unmount', async () => {
    getSessionHandback.data = { session: null }
    const { unmount } = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    )
    await waitFor(() => {
      expect(stateChanges.length).toBeGreaterThan(0)
    })
    unmount()
    expect(unsubscribes.at(-1)).toHaveBeenCalled()
  })
})
