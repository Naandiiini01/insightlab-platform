import { useBuilderStore } from '../../store/builderStore'
import { BLOCK_TYPES } from '../../utils/constants'
import IntroEditor from './editors/IntroEditor'
import ContextEditor from './editors/ContextEditor'
import TaskEditor from './editors/TaskEditor'
import QuestionEditor from './editors/QuestionEditor'
import ThankyouEditor from './editors/ThankyouEditor'
import VariantEditor from './editors/VariantEditor'
import { Settings2 } from 'lucide-react'

const EDITORS = {
  intro:    IntroEditor,
  context:  ContextEditor,
  task:     TaskEditor,
  question: QuestionEditor,
  followup: QuestionEditor,
  thankyou: ThankyouEditor,
  variant:  VariantEditor,
}

export default function BuilderPanel() {
  const { blocks, selectedBlockId } = useBuilderStore()
  const block = blocks.find(b => b.id === selectedBlockId)

  if (!block) {
    return (
      <aside className="w-full xl:w-80 bg-white border-t xl:border-t-0 xl:border-l border-surface-200 flex items-center justify-center flex-shrink-0 min-h-[12rem] xl:min-h-0">
        <div className="text-center px-6">
          <div className="w-10 h-10 rounded-xl bg-surface-100 flex items-center justify-center mx-auto mb-3">
            <Settings2 size={20} className="text-ink-300" />
          </div>
          <p className="text-sm font-medium text-ink-700 mb-1">Select a block</p>
          <p className="text-xs text-ink-400">Click any block on the canvas to edit its content and settings.</p>
        </div>
      </aside>
    )
  }

  const Editor = EDITORS[block.type]
  const meta = BLOCK_TYPES[block.type] || {}

  return (
    <aside className="w-full xl:w-80 bg-white border-t xl:border-t-0 xl:border-l border-surface-200 flex flex-col flex-shrink-0 overflow-hidden min-h-0 max-h-[50vh] xl:max-h-none">
      {/* Panel header */}
      <div className="px-4 py-3 border-b border-surface-100 flex items-center gap-2 flex-shrink-0">
        <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="text-sm font-semibold text-ink-900">{meta.label}</span>
      </div>

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        {Editor ? <Editor block={block} /> : (
          <div className="p-4 text-sm text-ink-400">No editor for type: {block.type}</div>
        )}
      </div>
    </aside>
  )
}
