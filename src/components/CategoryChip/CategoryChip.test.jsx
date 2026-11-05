import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import CategoryChip from './CategoryChip'

describe('CategoryChip', () => {
  test('default state: outlined, aria-pressed=false', () => {
    render(<CategoryChip label="Tables" selected={false} onClick={() => {}} />)
    const chip = screen.getByRole('button', { name: 'Tables' })
    expect(chip).toHaveAttribute('aria-pressed', 'false')
    expect(chip).toHaveClass('chip', 'chip--default')
  })

  test('selected state: filled, aria-pressed=true', () => {
    render(<CategoryChip label="All" selected onClick={() => {}} />)
    const chip = screen.getByRole('button', { name: 'All' })
    expect(chip).toHaveAttribute('aria-pressed', 'true')
    expect(chip).toHaveClass('chip', 'chip--selected')
  })

  test('click fires onClick with the label', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(<CategoryChip label="Chairs" selected={false} onClick={onClick} />)
    await user.click(screen.getByRole('button', { name: 'Chairs' }))
    expect(onClick).toHaveBeenCalledWith('Chairs')
  })
})
