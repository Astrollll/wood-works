import { render, screen } from '@testing-library/react'
import App from './App'

test('entry route renders the login screen', () => {
  render(<App />)
  expect(screen.getByText('Welcome Back')).toBeInTheDocument()
})

test('unknown route /nonsense redirects to the login screen (Review Focus #5)', () => {
  window.history.replaceState({}, '', '/nonsense')
  render(<App />)
  expect(screen.getByText('Welcome Back')).toBeInTheDocument()
})
