import { Field, Section, Toggle, useBlockUpdate } from './shared'
import { TASK_TYPES } from '../../../utils/constants'

export default function TaskEditor({ block }) {
  const update = useBlockUpdate(block.id)
  const c = block.content

  return (
    <div className="p-4">
      <Field label="Task Title">
        <input className="input" defaultValue={c.taskTitle} onBlur={e => update({ taskTitle: e.target.value })} placeholder="Find the pricing page" />
      </Field>
      <Field label="Task Instructions">
        <textarea className="input resize-none" rows={4} defaultValue={c.instructions} onBlur={e => update({ instructions: e.target.value })} placeholder="Please navigate to the pricing page and tell us which plan you would choose." />
      </Field>

      <Section title="Task Type" />
      <Field label="Type">
        <select className="input" value={c.taskType || 'website'} onChange={e => update({ taskType: e.target.value })}>
          {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
        </select>
      </Field>

      {(c.taskType === 'website' || c.taskType === 'prototype' || c.taskType === 'app') && (
        <Field label="Embed URL">
          <input className="input font-mono text-xs" defaultValue={c.embedUrl} onBlur={e => update({ embedUrl: e.target.value })} placeholder="https://your-website.com" />
        </Field>
      )}

      <Section title="Settings" />
      <Field label="Success Criteria">
        <input className="input" defaultValue={c.successCriteria} onBlur={e => update({ successCriteria: e.target.value })} placeholder="Participant reaches /checkout" />
      </Field>

      <div className="mb-4">
        <label className="label">Time Limit (seconds, 0 = none)</label>
        <input type="number" className="input" min={0} defaultValue={c.timeLimit || 0}
          onBlur={e => update({ timeLimit: parseInt(e.target.value) || null })} />
      </div>
    </div>
  )
}
