import { Field, Section, useBlockUpdate } from './shared'

export default function ContextEditor({ block }) {
  const update = useBlockUpdate(block.id)
  const c = block.content

  return (
    <div className="p-4">
      <Field label="Scenario / Background Text">
        <textarea className="input resize-none" rows={5} defaultValue={c.scenarioText} onBlur={e => update({ scenarioText: e.target.value })} placeholder="Imagine you are shopping for a new laptop and you want to compare prices…" />
      </Field>
      <Field label="Device Instructions (optional)">
        <textarea className="input resize-none" rows={2} defaultValue={c.deviceInstructions} onBlur={e => update({ deviceInstructions: e.target.value })} placeholder="Please use your phone for this task…" />
      </Field>
      <Section title="Button" />
      <Field label="Continue Button Label">
        <input className="input" defaultValue={c.continueLabel || 'Continue'} onBlur={e => update({ continueLabel: e.target.value })} />
      </Field>
    </div>
  )
}
