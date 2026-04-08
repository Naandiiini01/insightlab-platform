import { Field, Section, useBlockUpdate } from './shared'

export default function IntroEditor({ block }) {
  const update = useBlockUpdate(block.id)
  const c = block.content

  return (
    <div className="p-4">
      <Field label="Study Title *">
        <input className="input" defaultValue={c.title} onBlur={e => update({ title: e.target.value })} placeholder="Welcome to our study" />
      </Field>
      <Field label="Description">
        <textarea className="input resize-none" rows={3} defaultValue={c.description} onBlur={e => update({ description: e.target.value })} placeholder="Brief intro for participants…" />
      </Field>
      <Field label="Researcher Note (private)">
        <textarea className="input resize-none" rows={2} defaultValue={c.researcherNote} onBlur={e => update({ researcherNote: e.target.value })} placeholder="Internal note, not shown to participants…" />
      </Field>
      <Section title="Button" />
      <Field label="Continue Button Label *">
        <input className="input" defaultValue={c.continueLabel || 'Get started'} onBlur={e => update({ continueLabel: e.target.value })} />
      </Field>
    </div>
  )
}
