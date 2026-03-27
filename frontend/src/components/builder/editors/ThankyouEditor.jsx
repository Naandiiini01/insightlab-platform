import { Field, Section, useBlockUpdate } from './shared'

export function ThankyouEditor({ block }) {
  const update = useBlockUpdate(block.id)
  const c = block.content
  return (
    <div className="p-4">
      <Field label="Title">
        <input className="input" defaultValue={c.title} onBlur={e => update({ title: e.target.value })} placeholder="Thank you!" />
      </Field>
      <Field label="Message">
        <textarea className="input resize-none" rows={3} defaultValue={c.message}
          onBlur={e => update({ message: e.target.value })}
          placeholder="Your responses have been recorded…" />
      </Field>
      <Field label="Next Steps (optional)">
        <textarea className="input resize-none" rows={2} defaultValue={c.nextSteps}
          onBlur={e => update({ nextSteps: e.target.value })} />
      </Field>
      <Section title="Redirect" />
      <Field label="Redirect URL (optional)">
        <input className="input" defaultValue={c.redirectUrl} onBlur={e => update({ redirectUrl: e.target.value })} placeholder="https://…" />
      </Field>
      <Field label="Redirect Button Label">
        <input className="input" defaultValue={c.redirectLabel} onBlur={e => update({ redirectLabel: e.target.value })} placeholder="Back to website" />
      </Field>
    </div>
  )
}

export default ThankyouEditor
