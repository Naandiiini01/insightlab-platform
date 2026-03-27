export default function ContextBlock({ block, onNext }) {
  const c = block.content
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8">
      <div className="max-w-lg w-full">
        <div className="card p-8">
          <p className="section-title mb-4">Scenario</p>
          {c.mediaUrl && <img src={c.mediaUrl} alt="" className="w-full rounded-lg mb-5 object-cover max-h-48" />}
          <p className="text-ink-800 text-base leading-relaxed mb-6 whitespace-pre-wrap">{c.scenarioText}</p>
          {c.deviceInstructions && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6">
              <p className="text-amber-800 text-sm">{c.deviceInstructions}</p>
            </div>
          )}
          <button className="btn-primary justify-center w-full py-3" onClick={() => onNext(null)}>
            {c.continueLabel || 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}
