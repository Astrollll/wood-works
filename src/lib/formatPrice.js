/**
 * Formats an amount as a Philippine peso price string, matching the Figma copy
 * verbatim: "₱5,000" (peso sign + en-US thousands separator, no decimals).
 */
export function formatPrice(amount) {
  return `₱${amount.toLocaleString('en-US')}`
}
