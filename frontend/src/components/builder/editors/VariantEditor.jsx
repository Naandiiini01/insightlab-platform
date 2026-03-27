import { useState } from 'react'
import { Field, Section, useBlockUpdate } from './shared'
import { Plus, Trash2 } from 'lucide-react'
import { v4 as uuidv4 } from 'uuid'

export default function VariantEditor({ block }) {
  const update = useBlockUpdate(block.id)
  const c = block.content
  const [variants, setVariants] = useState(c.variants || [])

  const addVariant = () => {
    const next = [...variants, { id: uuidv4(), name: `Variant ${String.fromCharCode(65 + variants.length)}`, embedUrl: '', description: '' }]
    setVariants(next)
    update({ variants: next })
  }

  const removeVariant = (id) => {
    const next = variants.filter(v => v.id !== id)
    setVariants(next)
    update({ variants: next })
  }

  const updateVariant = (id, field, val) => {
    const next = variants.map(v => v.id === id ? { ...v, [field]: val } : v)
    setVariants(next)
    update({ variants: next })
  }

  return (
    <div className="p-4">
      <Field label="Block Name">
        <input className="input" defaultValue={c.variantName} onBlur={e => update({ variantName: e.target.value })} />
      </Field>

      <Section title="Assignment" />
      <Field label="Assignment Method">
        <select className="input" value={c.assignmentMethod || 'random'} onChange={e => update({ assignmentMethod: e.target.value })}>
          <option value="random">Random</option>
          <option value="manual">Manual</option>
          <option value="equal">Equal Split</option>
        </select>
      </Field>

      <Section title="Variants" />
      <div className="space-y-4 mb-3">
        {variants.map((v, idx) => (
          <div key={v.id} className="card p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-ink-500">Variant {String.fromCharCode(65 + idx)}</span>
              {variants.length > 2 && (
                <button onClick={() => removeVariant(v.id)} className="text-red-400 hover:text-red-600">
                  <Trash2 size={13} />
                </button>
              )}
            </div>
            <Field label="Name">
              <input className="input text-sm" value={v.name} onChange={e => updateVariant(v.id, 'name', e.target.value)} />
            </Field>
            <Field label="URL / Embed">
              <input className="input text-sm font-mono" value={v.embedUrl} onChange={e => updateVariant(v.id, 'embedUrl', e.target.value)} placeholder="https://…" />
            </Field>
            <Field label="Description">
              <input className="input text-sm" value={v.description} onChange={e => updateVariant(v.id, 'description', e.target.value)} />
            </Field>
          </div>
        ))}
      </div>
      <button className="btn-secondary w-full text-sm justify-center" onClick={addVariant}>
        <Plus size={14} /> Add variant
      </button>
    </div>
  )
}
