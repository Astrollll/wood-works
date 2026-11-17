import { act, waitFor, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import App from './App'
import { supabase } from './lib/supabase'

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

  test('a mid-signup session event does not bounce the page off its 06 landing', async () => {
    const user = userEvent.setup()
    // Live supabase: the SIGNED_IN event and signUp's resolution land within
    // microseconds of each other (nav log: the 06 push, then a guest-bounce
    // replace 3ms later that overwrites it). The decided GuestRoute
    // semantics: only users who ARRIVE signed-in bounce; a session that
    // appears mid-signup must not hijack the page's own navigation.
    let resolveSignUp = () => {}
    vi.mocked(supabase.auth.signUp).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveSignUp = resolve
        }),
    )
    window.history.replaceState({}, '', '/signup')
    render(<App />)
    // GuestRoute renders nothing until the session hydrates; await the form.
    await user.type(
      await screen.findByPlaceholderText('Enter your email'),
      'a@b.com',
    )
    await user.type(screen.getByLabelText('Password'), 'secret')
    await user.type(screen.getByLabelText('Confirm Password'), 'secret')
    await user.click(screen.getByRole('button', { name: 'Sign Up' }))

    // The SIGNED_IN event arrives while signUp is still pending: the page
    // must stay on the form (no hijack to /home).
    await act(async () => {
      stateChanges[stateChanges.length - 1]('SIGNED_IN', {
        user: { email: 'a@b.com' },
      })
    })
    expect(
      screen.queryByText('Crafted With Wood,Built With Purpose.'),
    ).not.toBeInTheDocument()
    expect(
      screen.getByPlaceholderText('Enter your email'),
    ).toBeInTheDocument()

    // signUp resolves; the page completes its own 06 landing.
    await act(async () => {
      resolveSignUp({
        data: { user: { email: 'a@b.com' }, session: { user: { email: 'a@b.com' } } },
        error: null,
      })
    })
    expect(
      await screen.findByText('Account Sign up Successfully!'),
    ).toBeInTheDocument()
  })

  test('logged-in visit to /signup also bounces to /home', async () => {
    window.history.replaceState({}, '', '/signup')
    sessionForTests.data = { session: { user: { email: 'a@b.com' } } }
    render(<App />)
    expect(
      await screen.findByText('Crafted With Wood,Built With Purpose.'),
    ).toBeInTheDocument()
    expect(
      screen.queryByPlaceholderText('Enter your email'),
    ).not.toBeInTheDocument()
  })
})
