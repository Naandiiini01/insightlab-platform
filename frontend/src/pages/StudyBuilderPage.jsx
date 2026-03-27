import { useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useBuilderStore } from '../store/builderStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import BuilderSidebar from '../components/builder/BuilderSidebar'
import BuilderCanvas from '../components/builder/BuilderCanvas'
import BuilderPanel from '../components/builder/BuilderPanel'
import BuilderHeader from '../components/builder/BuilderHeader'
import PreviewModal from '../components/builder/PreviewModal'

export default function StudyBuilderPage() {
  const { studyId } = useParams()
  const navigate = useNavigate()
  const { loadStudy, study, previewMode, saveStudy, dirty } = useBuilderStore()
  const autosaveTimer = useRef(null)

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/studies/${studyId}/`)
        loadStudy(res.data, res.data.blocks || [])
      } catch {
        toast.error('Study not found')
        navigate('/')
      }
    }
    load()
  }, [studyId])

  // Autosave every 3 seconds when dirty
  useEffect(() => {
    if (!dirty) return
    clearTimeout(autosaveTimer.current)
    autosaveTimer.current = setTimeout(() => {
      saveStudy().catch(() => {})
    }, 3000)
    return () => clearTimeout(autosaveTimer.current)
  }, [dirty])

  if (!study) {
    return (
      <div className="min-h-screen bg-surface-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-ink-500 text-sm">Loading study…</span>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-surface-50">
      <BuilderHeader />
      <div className="flex-1 flex overflow-hidden">
        <BuilderSidebar />
        <BuilderCanvas />
        <BuilderPanel />
      </div>
      {previewMode && <PreviewModal />}
    </div>
  )
}
