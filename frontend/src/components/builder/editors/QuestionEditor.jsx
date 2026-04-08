import { useState } from 'react'
import { Field, Section, Toggle, useBlockUpdate } from './shared'
import { QUESTION_TYPES } from '../../../utils/constants'
import { Plus, X } from 'lucide-react'

export default function QuestionEditor({ block }) {
  const update = useBlockUpdate(block.id)
  const c = block.content
  const [options, setOptions] = useState(c.options || [])

  const qType = c.questionType || 'open_text'
  const hasOptions = ['multiple_choice', 'single_choice', 'ranking'].includes(qType)

  const addOption = () => {
    const next = [...options, `Option ${options.length + 1}`]
    setOptions(next)
    update({ options: next })
  }

  const removeOption = (idx) => {
    const next = options.filter((_, i) => i !== idx)
    setOptions(next)
    update({ options: next })
  }

  const updateOption = (idx, val) => {
    const next = [...options]
    next[idx] = val
    setOptions(next)
    update({ options: next })
  }

  return (
    <div className="p-4">
      <Field label="Question Text *">
        <textarea className="input resize-none" rows={3} defaultValue={c.questionText}
          onBlur={e => update({ questionText: e.target.value })}
          placeholder="How easy was it to complete the task?" />
      </Field>

      <Field label="Question Type">
        <select className="input" value={qType} onChange={e => update({ questionType: e.target.value })}>
          {QUESTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>

      {/* Options for choice-based types */}
      {hasOptions && (
        <>
          <Section title="Options" />
          <div className="space-y-2 mb-3">
            {options.map((opt, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <input
                  className="input flex-1 text-sm"
                  value={opt}
                  onChange={e => updateOption(idx, e.target.value)}
                  placeholder={`Option ${idx + 1}`}
                />
                <button onClick={() => removeOption(idx)} className="text-ink-300 hover:text-red-500 p-1">
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          <button className="btn-secondary w-full text-sm justify-center" onClick={addOption}>
            <Plus size={14} /> Add option
          </button>
        </>
      )}

      {/* Scale config */}
      {(qType === 'rating' || qType === 'opinion') && (
        <>
          <Section title="Scale" />
          <div className="grid grid-cols-2 gap-2 mb-2">
            <div>
              <label className="label">Min</label>
              <input type="number" className="input" defaultValue={c.scale?.min ?? 1}
                onBlur={e => update({ scale: { ...c.scale, min: +e.target.value } })} />
            </div>
            <div>
              <label className="label">Max</label>
              <input type="number" className="input" defaultValue={c.scale?.max ?? 5}
                onBlur={e => update({ scale: { ...c.scale, max: +e.target.value } })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Min Label">
              <input className="input" defaultValue={c.scale?.minLabel || 'Poor'}
                onBlur={e => update({ scale: { ...c.scale, minLabel: e.target.value } })} />
            </Field>
            <Field label="Max Label">
              <input className="input" defaultValue={c.scale?.maxLabel || 'Excellent'}
                onBlur={e => update({ scale: { ...c.scale, maxLabel: e.target.value } })} />
            </Field>
          </div>
        </>
      )}

      <Section title="Settings" />
      <Toggle label="Required" checked={c.required !== false}
        onChange={v => update({ required: v })} />

      {block.type === 'followup' && (
        <Field label="Linked Task Block ID (optional)">
          <input className="input font-mono text-xs" defaultValue={c.linkedTaskId || ''}
            onBlur={e => update({ linkedTaskId: e.target.value || null })}
            placeholder="block-uuid" />
        </Field>
      )}
    </div>
  )
}
