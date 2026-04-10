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
    <header className="bg-white border-b border-surface-200 z-50 flex-shrink-0 px-3 sm:px-4 py-2.5 sm:py-3">
      <div className="flex flex-col gap-3 min-[900px]:flex-row min-[900px]:items-center min-[900px]:gap-4">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
          {/* Back */}
          <button
            type="button"
            onClick={() => navigate('/')}
            className="btn-ghost p-2 rounded-lg shrink-0 self-center"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={16} />
          </button>

          {/* Logo */}
          <div className="flex items-center shrink-0 border-r border-surface-200 pr-2 sm:pr-4 self-center">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <Layers size={12} className="text-white" />
            </div>
          </div>

          {/* Study title */}
          <div className="flex-1 min-w-0 flex flex-col gap-1 justify-center py-0.5">
            {editingTitle ? (
              <input
                className="w-full max-w-md text-sm font-semibold text-ink-900 bg-surface-50 border border-brand-400 rounded-lg px-3 py-2 leading-normal min-h-10 box-border focus:outline-none focus:ring-2 focus:ring-brand-500/25"
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
                type="button"
                className="w-full max-w-md min-h-10 px-3 py-2 -mx-1 rounded-lg text-sm font-semibold text-ink-900 hover:text-brand-600 hover:bg-surface-50 border border-transparent hover:border-surface-200 truncate text-left flex items-center box-border"
                onClick={() => setEditingTitle(true)}
              >
                {study?.title || 'Untitled Study'}
              </button>
            )}

            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 pl-1 sm:pl-0">
              {saving ? (
                <span className="text-xs text-ink-300">Saving…</span>
              ) : dirty ? (
                <span className="text-xs text-amber-500">Unsaved changes</span>
              ) : (
                <span className="text-xs text-green-600">Saved</span>
              )}
            </div>
          </div>
        </div>

        {/* Right actions */}
        <div className="flex flex-wrap items-center gap-2 min-[900px]:justify-end min-[900px]:shrink-0">
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
      </div>
    </header>
  )
}
