import { describe, expect, test, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import QuantityStepper from './QuantityStepper'

const onChange = vi.hoisted(() => vi.fn())
const onRemove = vi.hoisted(() => vi.fn())

describe('QuantityStepper', () => {
  test('renders the current value with labeled buttons', () => {
    render(<QuantityStepper value={1} onChange={onChange} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Decrease quantity' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Increase quantity' })).toBeInTheDocument()
  })

  test('$plus increments via onChange', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuantityStepper value={1} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Increase quantity' }))
    expect(onChange).toHaveBeenCalledWith(2)
  })

  test('minus holds at the minimum of 1 (Review Focus: stepper bound)', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuantityStepper value={1} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(onChange).not.toHaveBeenCalled()
  })

  test('minus decrements above 1', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<QuantityStepper value={2} onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(onChange).toHaveBeenCalledWith(1)
  })

  test('minus at the minimum calls onRemove when provided', async () => {
    const user = userEvent.setup()
    render(<QuantityStepper value={1} onChange={onChange} onRemove={onRemove} />)
    await user.click(screen.getByRole('button', { name: 'Decrease quantity' }))
    expect(onRemove).toHaveBeenCalledTimes(1)
    expect(onChange).not.toHaveBeenCalled()
  })
})
