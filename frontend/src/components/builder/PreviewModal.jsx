import { useState } from 'react'
import { useBuilderStore } from '../../store/builderStore'
import { X, ChevronLeft, ChevronRight, Monitor, Smartphone, Tablet } from 'lucide-react'
import BlockRenderer from '../participant/BlockRenderer'

const DEVICE_FRAMES = {
  desktop:    { width: '100%',  height: '100%', label: 'Desktop' },
  laptop:     { width: '960px', height: '600px', label: 'Laptop' },
  tablet:     { width: '768px', height: '1024px', label: 'Tablet' },
  mobile:     { width: '390px', height: '844px', label: 'Mobile' },
  responsive: { width: '100%',  height: '100%', label: 'Responsive' },
}

export default function PreviewModal() {
  const { blocks, study, setPreviewMode } = useBuilderStore()
  const [step, setStep] = useState(0)
  const [device, setDevice] = useState(study?.device_target || 'desktop')

  const block = blocks[step]
  const frame = DEVICE_FRAMES[device] || DEVICE_FRAMES.desktop

  /** Advance preview, or close when already on the last block (e.g. Thank you → Finish). */
  const handleBlockNext = () => {
    if (step >= blocks.length - 1) {
      setPreviewMode(false)
      return
    }
    setStep((s) => s + 1)
  }

  return (
    <div className="fixed inset-0 z-50 bg-ink-900/80 backdrop-blur-sm flex flex-col">
      {/* Preview bar */}
      <div className="bg-white border-b border-surface-200 h-12 flex items-center px-4 gap-4 flex-shrink-0">
        <span className="text-sm font-semibold text-ink-900">Preview</span>
        <span className="text-xs text-ink-400">Step {step + 1} of {blocks.length}</span>

        <div className="flex items-center gap-1 ml-4">
          {[
            { id: 'desktop', Icon: Monitor },
            { id: 'tablet',  Icon: Tablet },
            { id: 'mobile',  Icon: Smartphone },
          ].map(({ id, Icon }) => (
            <button
              key={id}
              onClick={() => setDevice(id)}
              className={`p-1.5 rounded text-sm transition-colors ${device === id ? 'text-brand-600 bg-brand-50' : 'text-ink-400 hover:text-ink-600'}`}
            >
              <Icon size={16} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <button
            className="btn-secondary py-1 text-sm"
            onClick={() => setStep(s => Math.max(0, s - 1))}
            disabled={step === 0}
          >
            <ChevronLeft size={15} /> Prev
          </button>
          <button
            className="btn-secondary py-1 text-sm"
            onClick={() => setStep(s => Math.min(blocks.length - 1, s + 1))}
            disabled={step === blocks.length - 1}
          >
            Next <ChevronRight size={15} />
          </button>
          <button className="btn-ghost p-2" onClick={() => setPreviewMode(false)}>
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Frame */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div
          className="bg-white rounded-2xl shadow-2xl overflow-auto"
          style={{ width: frame.width, height: frame.height, maxWidth: '100%', maxHeight: '100%' }}
        >
          {block ? (
            <BlockRenderer block={block} onNext={handleBlockNext} previewMode />
          ) : (
            <div className="flex items-center justify-center h-full text-ink-400">No blocks</div>
          )}
        </div>
      </div>
    </div>
  )
}
