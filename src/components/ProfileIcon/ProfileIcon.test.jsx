import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import ProfileIcon from './ProfileIcon'

describe('ProfileIcon', () => {
  test('renders a 40px circular decorative icon with a profile label', () => {
    render(<ProfileIcon />)
    const icon = screen.getByRole('img')
    expect(icon).toHaveAttribute('aria-label', 'Profile')
    expect(icon).toHaveClass('profile-icon')
  })
})
