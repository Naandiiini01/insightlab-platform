export default function ThankyouBlock({ block, onNext }) {
  const c = block.content
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-6 text-3xl">🎉</div>
      <h1 className="text-3xl font-bold text-ink-900 mb-3">{c.title || 'Thank you!'}</h1>
      {c.message && <p className="text-ink-500 max-w-md mb-4">{c.message}</p>}
      {c.nextSteps && <p className="text-ink-400 text-sm mb-6">{c.nextSteps}</p>}
      {c.redirectUrl && (
        <a href={c.redirectUrl} className="btn-primary justify-center px-8 py-3">
          {c.redirectLabel || 'Continue'}
        </a>
      )}
      {!c.redirectUrl && (
        <button className="btn-primary justify-center px-8 py-3" onClick={() => onNext(null)}>Finish</button>
      )}
    </div>
  )
}
