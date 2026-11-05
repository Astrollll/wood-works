import { useRef } from 'react'
import './OtpCodeInput.css'

/**
 * Six 44x44 OTP tiles (Figma screen 04): cream tiles, radius 10, 11px gap.
 * Typing advances focus, backspace on an empty tile steps back.
 * State lives with the page; this renders and edits the digit array.
 */
export default function OtpCodeInput({ digits, onChange }) {
  const refs = useRef([])

  const setDigit = (index, value) => {
    const next = [...digits]
    next[index] = value.replace(/\D/g, '').slice(-1)
    onChange(next)
    if (value && index < digits.length - 1) {
      refs.current[index + 1].focus()
    }
  }

  const handleKeyDown = (index, event) => {
    if (event.key !== 'Backspace') return
    event.preventDefault()
    const next = [...digits]
    if (next[index]) {
      next[index] = ''
      onChange(next)
    } else if (index > 0) {
      next[index - 1] = ''
      onChange(next)
      refs.current[index - 1].focus()
    }
  }

  return (
    <div className="otp">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(el) => {
            refs.current[index] = el
          }}
          className="otp__tile"
          type="text"
          inputMode="numeric"
          maxLength="1"
          aria-label={`Digit ${index + 1}`}
          value={digit}
          onChange={(e) => setDigit(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
        />
      ))}
    </div>
  )
}
