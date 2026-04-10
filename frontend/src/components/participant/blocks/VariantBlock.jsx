export default function VariantBlock({ block, session, onNext }) {
  const c = block.content
  const variants = c.variants || []
  const assignmentMethod = c.assignmentMethod || c.assignment_method || 'random'
  const assigned = session?.variantAssigned || session?.variant_assigned

  // Prefer explicit session assignment from backend.
  let variant = variants.find((v) => v.name === assigned)

  // Fallback by configured assignment method for preview/legacy sessions.
  if (!variant && variants.length > 0) {
    if (assignmentMethod === 'random') {
      variant = variants[Math.floor(Math.random() * variants.length)]
    } else {
      variant = variants[0]
    }
  }

  // If selected variant has no URL, pick first variant with a URL to avoid false "not working" states.
  if ((!variant?.embedUrl) && variants.length > 0) {
    const withUrl = variants.find((v) => v.embedUrl)
    if (withUrl) variant = withUrl
  }

  if (!variant) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-ink-400">No variant configured.</p>
    </div>
  )

  return (
    <div className="min-h-screen flex flex-col">
      <div className="bg-white border-b border-surface-200 px-6 py-4">
        <p className="section-title mb-1">Variant Task</p>
        <h2 className="font-bold text-ink-900">{variant.name}</h2>
        {variant.description && <p className="text-ink-500 text-sm">{variant.description}</p>}
      </div>
      {variant.embedUrl ? (
        <iframe src={variant.embedUrl} className="flex-1 border-0 w-full" title={variant.name}
          sandbox="allow-same-origin allow-scripts allow-forms allow-popups" />
      ) : (
        <div className="flex-1 flex items-center justify-center bg-surface-50">
          <p className="text-ink-400">No embed URL configured for this variant.</p>
        </div>
      )}
      <div className="bg-white border-t border-surface-200 px-6 py-4 flex justify-end">
        <button className="btn-primary" onClick={() => onNext({ answer: variant.name })}>Continue →</button>
      </div>
    </div>
  )
}
