import { render, screen } from '@testing-library/react'
import App from './App'

test('entry route renders the login screen', () => {
  render(<App />)
  expect(screen.getByText('Welcome Back')).toBeInTheDocument()
})
