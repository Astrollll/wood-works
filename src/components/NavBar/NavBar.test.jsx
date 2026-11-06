import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NavBar from './NavBar'

function renderNavbar() {
  return render(
    <MemoryRouter>
      <NavBar />
    </MemoryRouter>,
  )
}

describe('NavBar', () => {
  test('renders the 4 nav links with their routes', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: 'Home' })).toHaveAttribute('href', '/home')
    expect(screen.getByRole('link', { name: 'Furniture' })).toHaveAttribute('href', '/catalog')
    expect(screen.getByRole('link', { name: 'Custom Order' })).toHaveAttribute('href', '/custom-order')
    expect(screen.getByRole('link', { name: 'My Orders' })).toHaveAttribute('href', '/my-orders')
  })

  test('logo text links home', () => {
    renderNavbar()
    expect(screen.getByRole('link', { name: 'WOOD WORKS' })).toHaveAttribute('href', '/home')
  })

  test('renders the profile icon', () => {
    renderNavbar()
    expect(screen.getByRole('img', { name: 'Profile' })).toBeInTheDocument()
  })

  test('is a nav landmark', () => {
    const { container } = renderNavbar()
    expect(container.querySelector('nav')).toBeInTheDocument()
  })
})
