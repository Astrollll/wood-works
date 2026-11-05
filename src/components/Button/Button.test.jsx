import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Button from './Button'

describe('Button', () => {
  test('filled variant carries the filled class', () => {
    render(<Button variant="filled">LOG IN</Button>)
    const btn = screen.getByRole('button', { name: 'LOG IN' })
    expect(btn).toHaveClass('btn', 'btn--filled')
  })

  test('outline variant carries the outline class', () => {
    render(<Button variant="outline">CUSTOM ORDER</Button>)
    const btn = screen.getByRole('button', { name: 'CUSTOM ORDER' })
    expect(btn).toHaveClass('btn', 'btn--outline')
  })

  test('label text is rendered verbatim (no normalization)', () => {
    const { container } = render(
      <Button variant="filled">SUBMIT CUSTOM ORDER.</Button>,
    )
    expect(container.textContent).toBe('SUBMIT CUSTOM ORDER.')
  })

  test('click fires onClick', async () => {
    const user = userEvent.setup()
    const onClick = vi.fn()
    render(
      <Button variant="filled" onClick={onClick}>
        LOG IN
      </Button>,
    )
    await user.click(screen.getByRole('button', { name: 'LOG IN' }))
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  test('type defaults to button and can be submit', () => {
    const { rerender } = render(<Button variant="filled">LOG IN</Button>)
    expect(screen.getByRole('button')).toHaveAttribute('type', 'button')

    rerender(
      <form onSubmit={(e) => e.preventDefault()}>
        <Button variant="filled" type="submit">
          LOG IN
        </Button>
      </form>,
    )
    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit')
  })
})
