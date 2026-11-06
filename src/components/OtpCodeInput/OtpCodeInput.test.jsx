import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import OtpCodeInput from './OtpCodeInput'

describe('OtpCodeInput', () => {
  test('renders six individual numeric tiles', () => {
    render(<OtpCodeInput digits={['', '', '', '', '', '']} onChange={() => {}} />)
    const boxes = screen.getAllByRole('textbox')
    expect(boxes).toHaveLength(6)
    for (const box of boxes) {
      expect(box).toHaveAttribute('inputMode', 'numeric')
      expect(box).toHaveAttribute('maxLength', '1')
    }
  })

  test('typing a digit records it and advances focus', async () => {
    const user = userEvent.setup()
    const digits = ['', '', '', '', '', '']
    const onChange = (next) => Object.assign(digits, next)
    render(<OtpCodeInput digits={digits} onChange={onChange} />)
    const boxes = screen.getAllByRole('textbox')
    await user.type(boxes[0], '2')
    expect(digits[0]).toBe('2')
    expect(boxes[1]).toHaveFocus()
  })

  test('backspace on an empty tile moves focus back and clears it', async () => {
    const user = userEvent.setup()
    const digits = ['2', '4', '', '', '', '']
    const onChange = (next) => Object.assign(digits, next)
    render(<OtpCodeInput digits={digits} onChange={onChange} />)
    const boxes = screen.getAllByRole('textbox')
    await user.type(boxes[2], '{backspace}')
    expect(boxes[1]).toHaveFocus()
    expect(digits[1]).toBe('')
  })
})
