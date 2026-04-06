import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useBuilderStore } from '../../store/builderStore'
import { Layers, ArrowLeft, Eye, Save, Globe, Copy, Check, BarChart2 } from 'lucide-react'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function BuilderHeader() {
  const navigate = useNavigate()
  const { study, saving, dirty, saveStudy, publishStudy, unpublishStudy,
          setPreviewMode, updateStudyMeta } = useBuilderStore()
  const [publishing, setPublishing] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [copied, setCopied] = useState(false)

  const handlePublish = async () => {
    setPublishing(true)
    try {
      await saveStudy()
      const data = await publishStudy()
      toast.success('Study published!')
    } catch {
      toast.error('Failed to publish')
    } finally {
      setPublishing(false)
    }
  }

  const handleUnpublish = async () => {
    await unpublishStudy()
    toast.success('Study unpublished')
  }

  const copyLink = () => {
    const token = study?.participant_token ?? study?.participantToken
    if (!token) {
      toast.error('Publish the study first to get a participant link.')
      return
    }
    navigator.clipboard.writeText(`${window.location.origin}/t/${token}`)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast.success('Link copied!')
  }

  const isPublished = study?.status === 'published'

  return (
    <header className="bg-white border-b border-surface-200 h-14 flex items-center px-4 gap-4 z-50 flex-shrink-0">
      {/* Back */}
      <button onClick={() => navigate('/')} className="btn-ghost p-2">
        <ArrowLeft size={16} />
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 border-r border-surface-200 pr-4">
        <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
          <Layers size={12} className="text-white" />
        </div>
      </div>

      {/* Study title */}
      <div className="flex-1 min-w-0">
        {editingTitle ? (
          <input
            className="text-sm font-semibold text-ink-900 bg-surface-50 border border-brand-400 rounded px-2 py-0.5 w-64 focus:outline-none"
            defaultValue={study?.title}
            autoFocus
            onBlur={(e) => {
              updateStudyMeta({ title: e.target.value })
              setEditingTitle(false)
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.target.blur()
              if (e.key === 'Escape') setEditingTitle(false)
            }}
          />
        ) : (
          <button
            className="text-sm font-semibold text-ink-900 hover:text-brand-600 truncate max-w-xs text-left"
            onClick={() => setEditingTitle(true)}
          >
            {study?.title || 'Untitled Study'}
          </button>
        )}

        {/* Save status */}
        <div className="flex items-center gap-1 mt-0.5">
          {saving ? (
            <span className="text-xs text-ink-300">Saving…</span>
          ) : dirty ? (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          ) : (
            <span className="text-xs text-green-500">Saved</span>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-2">
        <button
          className="btn-secondary text-sm py-1.5"
          onClick={() => navigate(`/studies/${study?.id}/results`)}
        >
          <BarChart2 size={14} /> Results
        </button>

        <button
          className="btn-secondary text-sm py-1.5"
          onClick={() => setPreviewMode(true)}
        >
          <Eye size={14} /> Preview
        </button>

        <button
          className="btn-secondary text-sm py-1.5"
          onClick={() => saveStudy().then(() => toast.success('Saved!'))}
          disabled={saving || !dirty}
        >
          <Save size={14} /> Save
        </button>

        {isPublished ? (
          <div className="flex items-center gap-2">
            <button
              className={clsx('btn text-sm py-1.5 gap-2',
                'bg-green-50 text-green-700 border border-green-200 hover:bg-green-100')}
              onClick={copyLink}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy link'}
            </button>
            <button
              className="btn-secondary text-sm py-1.5 text-red-500"
              onClick={handleUnpublish}
            >
              Unpublish
            </button>
          </div>
        ) : (
          <button
            className="btn-primary text-sm py-1.5"
            onClick={handlePublish}
            disabled={publishing}
          >
            <Globe size={14} />
            {publishing ? 'Publishing…' : 'Publish'}
          </button>
        )}
      </div>
    </header>
  )
}
