import './Input.css'

/**
 * Wood Works text input — mirrors the Figma "Input" component:
 * label above (500/14), bordered field (radius 8, 1px #D8D0CA),
 * 400/14 placeholder in muted gray, optional error line.
 */
export default function Input({
  label,
  id,
  type = 'text',
  placeholder = '',
  value,
  onChange,
  error,
}) {
  return (
    <div className="input">
      <label className="input__label" htmlFor={id}>
        {label}
      </label>
      <input
        className="input__field"
        id={id}
        name={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error ? (
        <div className="input__error" role="alert">
          {error}
        </div>
      ) : null}
    </div>
  )
}
