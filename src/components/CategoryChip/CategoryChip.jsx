import './CategoryChip.css'

/**
 * Wood Works category chip — Figma "Category Button" set:
 * Selected = solid #3E2723 pill, Default = white pill with 1px border.
 */
export default function CategoryChip({ label, selected = false, onClick }) {
  return (
    <button
      type="button"
      className={selected ? 'chip chip--selected' : 'chip chip--default'}
      aria-pressed={selected}
      onClick={() => onClick(label)}
    >
      {label}
    </button>
  )
}
