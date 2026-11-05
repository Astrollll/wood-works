import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import PageLayout from './PageLayout'

function renderPage(children) {
  return render(<MemoryRouter><PageLayout>{children}</PageLayout></MemoryRouter>)
}

describe('PageLayout', () => {
  test('wraps content in a main landmark', () => {
    renderPage(<div data-testid="page-slot" />)
    expect(screen.getByRole('main')).toBeInTheDocument()
    expect(screen.getByTestId('page-slot')).toBeInTheDocument()
  })

  test('renders the navbar', () => {
    renderPage(null)
    expect(screen.getByRole('link', { name: 'WOOD WORKS' })).toBeInTheDocument()
  })
})
