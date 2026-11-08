import { describe, expect, test, vi } from 'vitest'

describe('supabase client seam', () => {
  test('throws an actionable error when env keys are missing', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', undefined)
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', undefined)
    vi.resetModules()
    await expect(import('./supabase')).rejects.toThrow(/VITE_SUPABASE_URL/i)
  })

  test('exports a client with auth methods when env keys are present', async () => {
    vi.stubEnv('VITE_SUPABASE_URL', 'https://example.supabase.co')
    vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
    vi.resetModules()
    const { supabase } = await import('./supabase')
    expect(supabase.auth).toBeTruthy()
    expect(typeof supabase.auth.signInWithPassword).toBe('function')
    expect(typeof supabase.auth.signUp).toBe('function')
    expect(typeof supabase.auth.signOut).toBe('function')
  })
})
