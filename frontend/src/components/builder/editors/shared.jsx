import { useBuilderStore } from '../../../store/builderStore'

// Hook: returns update function bound to a block
export function useBlockUpdate(blockId) {
  const updateBlock = useBuilderStore(s => s.updateBlock)
  return (fields) => updateBlock(blockId, fields)
}

// Generic text field
export function Field({ label, children }) {
  return (
    <div className="mb-4">
      {label && <label className="label">{label}</label>}
      {children}
    </div>
  )
}

// Section divider
export function Section({ title }) {
  return (
    <div className="px-4 py-2 bg-surface-50 border-y border-surface-100 -mx-4 mb-4">
      <span className="section-title">{title}</span>
    </div>
  )
}

// Toggle switch
export function Toggle({ label, checked, onChange }) {
  return (
    <label className="flex items-center justify-between gap-3 mb-3 cursor-pointer">
      <span className="text-sm text-ink-700">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-9 h-5 rounded-full transition-colors ${
          checked ? 'bg-brand-600' : 'bg-surface-300'
        }`}
      >
        <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
          checked ? 'translate-x-4' : ''
        }`} />
      </button>
    </label>
  )
}
