import { describe, expect, test } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import Input from './Input'

describe('Input', () => {
  test('associates label with input via htmlFor/id', () => {
    render(
      <Input
        label="Email Address"
        id="login-email"
        placeholder="Enter your email"
        value=""
        onChange={() => {}}
      />,
    )
    const input = screen.getByLabelText('Email Address')
    expect(input).toHaveAttribute('id', 'login-email')
    expect(input).toHaveAttribute('placeholder', 'Enter your email')
  })

  test('emits onChange on typing', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(
      <Input
        label="Password"
        id="login-password"
        type="password"
        placeholder="Enter your password"
        value=""
        onChange={onChange}
      />,
    )
    await user.type(screen.getByLabelText('Password'), 'a')
    expect(onChange).toHaveBeenCalledWith('a')
  })

  test('renders error text with alert role when error given', () => {
    render(
      <Input
        label="Email Address"
        id="e"
        placeholder=""
        value=""
        onChange={() => {}}
        error="Email is required"
      />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Email is required')
  })

  test('has no error element when error omitted', () => {
    render(
      <Input label="Email Address" id="e" placeholder="" value="" onChange={() => {}} />,
    )
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  test('passes type through to the input element', () => {
    render(
      <Input
        label="Password"
        id="p"
        type="password"
        placeholder=""
        value=""
        onChange={() => {}}
      />,
    )
    expect(screen.getByLabelText('Password')).toHaveAttribute('type', 'password')
  })
})
