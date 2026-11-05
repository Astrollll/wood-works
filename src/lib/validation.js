/** True when the value is a non-empty, non-whitespace-only string. */
export function isFilled(value) {
  if (value === null || value === undefined) return false
  return String(value).trim().length > 0
}

/** Loose email shape check: something@something.domain — enough for mock flows. */
export function isEmail(value) {
  if (!isFilled(value)) return false
  return /^\S+@\S+\.\S+$/.test(String(value))
}

/** Strict equality check for a password + confirmation pair. */
export function passwordsMatch(a, b) {
  return a === b
}
