import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import MyOrdersStubPage from './MyOrdersStubPage'

describe('MyOrdersStubPage (stub for the My Orders nav link)', () => {
  test('renders the heading and the empty line in the store design language', () => {
    render(
      <MemoryRouter initialEntries={['/my-orders']}>
        <MyOrdersStubPage />
      </MemoryRouter>,
    )
    expect(screen.getByRole('heading', { name: 'My Orders' })).toBeInTheDocument()
    expect(screen.getByText('No orders yet.')).toBeInTheDocument()
  })
})
