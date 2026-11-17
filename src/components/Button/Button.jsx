import './Button.css'

/**
 * Wood Works button — mirrors the Figma "Button" component set:
 * Filled (solid #3E2723) and Outline (1.5px stroke). Labels are passed
 * verbatim (the design mixes "LOG IN" and "Sign Up" casing per screen).
 */
export default function Button({
  variant = 'filled',
  type = 'button',
  disabled = false,
  onClick,
  children,
}) {
  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={variant === 'outline' ? 'btn btn--outline' : 'btn btn--filled'}
    >
      {children}
    </button>
  )
}
