import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import AuthLayout from './AuthLayout'

describe('AuthLayout', () => {
  test('renders the fixed brand panel copy', () => {
    render(<AuthLayout>card</AuthLayout>)
    expect(screen.getAllByText('WOOD WORKS').length).toBeGreaterThan(0)
    expect(screen.getByText('Furniture & Custom Woodworks')).toBeInTheDocument()
  })

  test('renders children inside the layout', () => {
    render(<AuthLayout><div data-testid="card-slot" /></AuthLayout>)
    expect(screen.getByTestId('card-slot')).toBeInTheDocument()
  })
})
