import { useBuilderStore } from '../../store/builderStore'
import { BLOCK_TYPES, DEVICE_TYPES } from '../../utils/constants'
import { Plus, Monitor, Smartphone, Tablet, Laptop, Maximize2 } from 'lucide-react'
import clsx from 'clsx'

const DEVICE_ICONS = {
  desktop: Monitor, laptop: Laptop, tablet: Tablet, mobile: Smartphone, responsive: Maximize2,
}

export default function BuilderSidebar() {
  const { addBlock, study, updateStudyMeta, selectedBlockId, blocks } = useBuilderStore()

  const selectedIdx = blocks.findIndex(b => b.id === selectedBlockId)
  const insertAfter = selectedIdx >= 0 ? selectedIdx : blocks.length - 1

  return (
    <aside className="w-56 bg-white border-r border-surface-200 flex flex-col overflow-y-auto flex-shrink-0">
      {/* Device target */}
      <div className="p-4 border-b border-surface-100">
        <p className="section-title mb-3">Device Target</p>
        <div className="grid grid-cols-3 gap-1.5">
          {DEVICE_TYPES.map(({ value, label }) => {
            const Icon = DEVICE_ICONS[value]
            const active = study?.deviceTarget === value || study?.device_target === value
            return (
              <button
                key={value}
                title={label}
                onClick={() => updateStudyMeta({ device_target: value })}
                className={clsx(
                  'flex flex-col items-center gap-1 rounded-lg p-2 text-xs transition-all',
                  active
                    ? 'bg-brand-50 text-brand-700 border border-brand-200'
                    : 'text-ink-400 hover:bg-surface-50 border border-transparent'
                )}
              >
                <Icon size={16} />
                <span className="text-[10px] leading-none">{label.split(' ')[0]}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Add blocks */}
      <div className="p-4 flex-1">
        <p className="section-title mb-3">Add Block</p>
        <div className="space-y-1">
          {Object.entries(BLOCK_TYPES).map(([type, { label, icon: iconName, color }]) => (
            <button
              key={type}
              onClick={() => addBlock(type, insertAfter)}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-ink-700
                         hover:bg-surface-50 border border-transparent hover:border-surface-200
                         transition-all group text-left"
            >
              <span
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="truncate">{label}</span>
              <Plus size={14} className="ml-auto opacity-0 group-hover:opacity-100 text-ink-300 flex-shrink-0" />
            </button>
          ))}
        </div>
      </div>

      {/* Study settings */}
      <div className="p-4 border-t border-surface-100">
        <p className="section-title mb-2">Study Info</p>
        <div className="space-y-2">
          <div>
            <label className="label">Description</label>
            <textarea
              className="input text-xs resize-none"
              rows={3}
              placeholder="Brief study description…"
              defaultValue={study?.description || ''}
              onBlur={(e) => updateStudyMeta({ description: e.target.value })}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}
