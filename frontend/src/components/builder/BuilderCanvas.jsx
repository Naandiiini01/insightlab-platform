import {
  DndContext, closestCenter, PointerSensor,
  useSensor, useSensors, DragOverlay,
} from '@dnd-kit/core'
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useState } from 'react'
import { useBuilderStore } from '../../store/builderStore'
import { BLOCK_TYPES } from '../../utils/constants'
import { GripVertical, Copy, Trash2, Plus } from 'lucide-react'
import clsx from 'clsx'

function BlockCard({
  block,
  isSelected,
  isOverlay,
  insertMenuOpen = false,
  onToggleInsertMenu = () => {},
  onPickInsertType = () => {},
}) {
  const { selectBlock, removeBlock, duplicateBlock } = useBuilderStore()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: block.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging && !isOverlay ? 0.3 : 1,
  }

  const meta = BLOCK_TYPES[block.type] || {}
  const color = meta.color || '#9099b8'

  const blockLabel = () => {
    const c = block.content
    if (block.type === 'intro') return c.title || 'Intro Screen'
    if (block.type === 'context') return c.scenarioText ? c.scenarioText.slice(0, 40) + '…' : 'Context Screen'
    if (block.type === 'task') return c.taskTitle || 'Task'
    if (block.type === 'question') return c.questionText || 'Question'
    if (block.type === 'followup') return c.questionText || 'Follow-up'
    if (block.type === 'thankyou') return c.title || 'Thank-you Screen'
    if (block.type === 'variant') return c.variantName || 'Variant Comparison'
    return meta.label
  }

  return (
    <div ref={setNodeRef} style={style} className="group relative">
      <div
        onClick={() => selectBlock(block.id)}
        className={clsx(
          'card px-3 py-3 cursor-pointer transition-all flex items-center gap-3',
          isSelected && 'ring-2 ring-brand-500 border-brand-200 shadow-md',
          isOverlay && 'dragging-overlay',
        )}
      >
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="text-ink-200 hover:text-ink-400 cursor-grab active:cursor-grabbing flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          <GripVertical size={16} />
        </button>

        {/* Color dot + type */}
        <div className="flex-shrink-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-ink-400 mb-0.5">{meta.label}</p>
          <p className="text-sm font-medium text-ink-900 truncate">{blockLabel()}</p>
        </div>

        {/* Actions - show on hover */}
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          <button
            className="p-1.5 rounded text-ink-300 hover:text-ink-600 hover:bg-surface-100"
            onClick={(e) => { e.stopPropagation(); duplicateBlock(block.id) }}
            title="Duplicate"
          >
            <Copy size={13} />
          </button>
          <button
            className="p-1.5 rounded text-ink-300 hover:text-red-500 hover:bg-red-50"
            onClick={(e) => { e.stopPropagation(); removeBlock(block.id) }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Insert-after: same block types as left sidebar; hidden while dragging overlay */}
      {!isOverlay && (
        <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            type="button"
            className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg hover:bg-brand-700"
            onClick={(e) => {
              e.stopPropagation()
              onToggleInsertMenu()
            }}
            title="Add block here"
          >
            <Plus size={12} />
          </button>
          {insertMenuOpen && (
            <div
              className="absolute left-1/2 top-full mt-1 z-30 w-56 card py-1 shadow-xl border border-surface-200"
              onClick={(e) => e.stopPropagation()}
            >
              {Object.entries(BLOCK_TYPES).map(([type, meta]) => (
                <button
                  key={type}
                  type="button"
                  className="w-full text-left px-3 py-2 text-sm text-ink-700 hover:bg-surface-50"
                  onClick={(e) => {
                    e.stopPropagation()
                    onPickInsertType(type)
                  }}
                >
                  {meta.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function BuilderCanvas() {
  const { blocks, reorderBlocks, selectedBlockId, addBlock } = useBuilderStore()
  const [activeId, setActiveId] = useState(null)
  const [insertMenuIndex, setInsertMenuIndex] = useState(null)

  const sensors = useSensors(useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  }))

  const activeBlock = blocks.find(b => b.id === activeId)

  const handleDragEnd = ({ active, over }) => {
    setActiveId(null)
    if (!over || active.id === over.id) return
    const oldIndex = blocks.findIndex(b => b.id === active.id)
    const newIndex = blocks.findIndex(b => b.id === over.id)
    reorderBlocks(arrayMove(blocks, oldIndex, newIndex))
  }

  return (
    <main className="flex-1 overflow-y-auto p-4 sm:p-6 min-w-0 min-h-0">
      <div className="max-w-lg mx-auto w-full min-w-0">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="section-title">Study Flow</p>
          <p className="text-xs text-ink-300 mt-1">
            {blocks.length} block{blocks.length !== 1 ? 's' : ''} · Drag to reorder
          </p>
        </div>

        {blocks.length === 0 ? (
          <div className="card py-16 text-center border-dashed">
            <p className="text-ink-300 text-sm">No blocks yet.</p>
            <p className="text-ink-300 text-xs mt-1">Add a block from the left sidebar.</p>
          </div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={({ active }) => setActiveId(active.id)}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-3">
                {blocks.map((block, idx) => (
                  <div key={block.id} className="relative">
                    {/* Step number */}
                    <div className="hidden sm:flex absolute -left-8 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full
                                    bg-surface-200 items-center justify-center">
                      <span className="text-[10px] font-medium text-ink-400">{idx + 1}</span>
                    </div>
                    <BlockCard
                      block={block}
                      isSelected={block.id === selectedBlockId}
                      insertMenuOpen={insertMenuIndex === idx}
                      onToggleInsertMenu={() =>
                        setInsertMenuIndex((prev) => (prev === idx ? null : idx))
                      }
                      onPickInsertType={(type) => {
                        addBlock(type, idx)
                        setInsertMenuIndex(null)
                      }}
                    />
                    {/* Connector line */}
                    {idx < blocks.length - 1 && (
                      <div className="absolute left-1/2 -translate-x-1/2 -bottom-3 w-px h-3 bg-surface-300" />
                    )}
                  </div>
                ))}
              </div>
            </SortableContext>

            <DragOverlay>
              {activeBlock && (
                <BlockCard block={activeBlock} isSelected={false} isOverlay />
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>
    </main>
  )
}
