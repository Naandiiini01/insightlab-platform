export default function IntroBlock({ block, onNext }) {
  const c = block.content
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-md w-full">
        {c.mediaUrl && <img src={c.mediaUrl} alt="" className="w-full rounded-xl mb-6 object-cover max-h-48" />}
        <h1 className="text-3xl font-bold text-ink-900 mb-4">{c.title || 'Welcome'}</h1>
        {c.description && <p className="text-ink-500 text-base leading-relaxed mb-8">{c.description}</p>}
        <button className="btn-primary justify-center px-8 py-3 text-base" onClick={() => onNext(null)}>
          {c.continueLabel || 'Get started'}
        </button>
      </div>
    </div>
  )
}
