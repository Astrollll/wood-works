import '@testing-library/jest-dom'
import { vi } from 'vitest'

// The Supabase seam throws at import when the env keys are missing. CI runs
// the test step without real env (the build step owns the loud-failure
// guard), so seed inert values here: tests mock the seam module and never
// touch the network; components render the logged-out default without it.
vi.stubEnv('VITE_SUPABASE_URL', 'https://test.supabase.co')
vi.stubEnv('VITE_SUPABASE_ANON_KEY', 'test-anon-key')
