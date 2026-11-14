import { act, waitFor, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'

const sessionForTests = vi.hoisted(() => ({ data: { session: null } }))
const stateChanges = vi.hoisted(() => [])

vi.mock('./lib/supabase', () => ({
  supabase: {
    auth: {
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      getSession: vi.fn(async () => sessionForTests),
      onAuthStateChange: vi.fn((cb) => {
        stateChanges.push(cb)
        return { data: { subscription: { unsubscribe: vi.fn() } } }
      }),
    },
  },
}))

describe('App routing', () => {
  beforeEach(() => {
    sessionForTests.data = { session: null }
  })

  test('entry route renders the login screen', async () => {
    render(<App />)
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
  })

  test('unknown route /nonsense redirects to the login screen (Review Focus #5)', async () => {
    window.history.replaceState({}, '', '/nonsense')
    render(<App />)
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
  })

  test('logged-out direct visit to /home redirects to /login', async () => {
    window.history.replaceState({}, '', '/home')
    render(<App />)
    expect(await screen.findByText('Welcome Back')).toBeInTheDocument()
    expect(
      screen.queryByText('Crafted With Wood,Built With Purpose.'),
    ).not.toBeInTheDocument()
  })

  test('logged-in visit to /login bounces to /home', async () => {
    window.history.replaceState({}, '', '/login')
    sessionForTests.data = { session: { user: { email: 'a@b.com' } } }
    render(<App />)
    expect(
      await screen.findByText('Crafted With Wood,Built With Purpose.'),
    ).toBeInTheDocument()
    expect(screen.queryByText('Welcome Back')).not.toBeInTheDocument()
  })

  test('/ redirects per session', async () => {
    window.history.replaceState({}, '', '/')
    sessionForTests.data = { session: { user: { email: 'a@b.com' } } }
    render(<App />)
    expect(
      await screen.findByText('Crafted With Wood,Built With Purpose.'),
    ).toBeInTheDocument()
  })

  test('sign-out event on a store screen lands on login (not a dead screen)', async () => {
    window.history.replaceState({}, '', '/home')
    sessionForTests.data = { session: { user: { email: 'a@b.com' } } }
    render(<App />)
    expect(
      await screen.findByText('Crafted With Wood,Built With Purpose.'),
    ).toBeInTheDocument()
    await act(async () => {
      stateChanges[stateChanges.length - 1]('SIGNED_OUT', null)
    })
    await waitFor(() =>
      expect(screen.getByText('Welcome Back')).toBeInTheDocument(),
    )
  })
})
