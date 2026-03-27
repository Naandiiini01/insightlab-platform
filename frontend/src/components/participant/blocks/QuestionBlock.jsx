import { useState } from 'react'

export default function QuestionBlock({ block, onNext }) {
  const c = block.content
  const [answer, setAnswer] = useState(null)
  const [error, setError] = useState('')

  const qType = c.questionType || 'open_text'
  const required = c.required !== false

  const handleSubmit = () => {
    if (required && (answer === null || answer === '' || (Array.isArray(answer) && !answer.length))) {
      setError('This question is required.')
      return
    }
    setError('')
    onNext({ answer })
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <div className="card p-8">
          <p className="section-title mb-3">
            {block.type === 'followup' ? 'Follow-up Question' : 'Question'}
          </p>
          <h2 className="text-xl font-semibold text-ink-900 mb-6">{c.questionText}</h2>

          <QuestionInput type={qType} options={c.options || []} scale={c.scale} value={answer} onChange={setAnswer} />

          {error && <p className="text-red-500 text-sm mt-3">{error}</p>}

          <div className="flex justify-end mt-6 gap-3">
            {!required && (
              <button className="btn-ghost" onClick={() => onNext({ answer: null })}>Skip</button>
            )}
            <button className="btn-primary px-8" onClick={handleSubmit}>Continue →</button>
          </div>
        </div>
      </div>
    </div>
  )
}

function QuestionInput({ type, options, scale, value, onChange }) {
  switch (type) {
    case 'open_text':
      return (
        <textarea
          className="input resize-none"
          rows={4}
          placeholder="Type your answer…"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
        />
      )

    case 'yes_no':
      return (
        <div className="flex gap-3">
          {['Yes', 'No'].map(opt => (
            <button
              key={opt}
              className={`flex-1 py-3 rounded-xl border-2 font-medium transition-all ${
                value === opt ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-ink-600 hover:border-brand-300'
              }`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )

    case 'single_choice':
      return (
        <div className="space-y-2">
          {options.map((opt, i) => (
            <button
              key={i}
              className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                value === opt ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-ink-700 hover:border-brand-300'
              }`}
              onClick={() => onChange(opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      )

    case 'multiple_choice':
      return (
        <div className="space-y-2">
          {options.map((opt, i) => {
            const selected = Array.isArray(value) && value.includes(opt)
            return (
              <button
                key={i}
                className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                  selected ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-surface-200 text-ink-700 hover:border-brand-300'
                }`}
                onClick={() => {
                  const prev = Array.isArray(value) ? value : []
                  onChange(selected ? prev.filter(v => v !== opt) : [...prev, opt])
                }}
              >
                <span className={`w-4 h-4 rounded border-2 flex-shrink-0 flex items-center justify-center ${
                  selected ? 'bg-brand-600 border-brand-600' : 'border-ink-300'
                }`}>
                  {selected && <span className="text-white text-[10px]">✓</span>}
                </span>
                {opt}
              </button>
            )
          })}
        </div>
      )

    case 'rating':
    case 'opinion': {
      const min = scale?.min ?? 1
      const max = scale?.max ?? 5
      const steps = Array.from({ length: max - min + 1 }, (_, i) => i + min)
      return (
        <div>
          <div className="flex gap-2 justify-between mb-2">
            {steps.map(n => (
              <button
                key={n}
                className={`flex-1 py-3 rounded-xl border-2 font-semibold transition-all ${
                  value === n ? 'border-brand-500 bg-brand-600 text-white' : 'border-surface-200 text-ink-600 hover:border-brand-300'
                }`}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-ink-400">
            <span>{scale?.minLabel || 'Poor'}</span>
            <span>{scale?.maxLabel || 'Excellent'}</span>
          </div>
        </div>
      )
    }

    case 'nps': {
      const steps = Array.from({ length: 11 }, (_, i) => i)
      return (
        <div>
          <div className="flex gap-1 mb-2">
            {steps.map(n => (
              <button
                key={n}
                className={`flex-1 py-2.5 rounded-lg border-2 font-semibold text-sm transition-all ${
                  value === n ? 'border-brand-500 bg-brand-600 text-white' : 'border-surface-200 text-ink-600 hover:border-brand-300'
                }`}
                onClick={() => onChange(n)}
              >
                {n}
              </button>
            ))}
          </div>
          <div className="flex justify-between text-xs text-ink-400">
            <span>Not likely</span>
            <span>Extremely likely</span>
          </div>
        </div>
      )
    }

    default:
      return <textarea className="input resize-none" rows={4} value={value || ''} onChange={e => onChange(e.target.value)} />
  }
}
