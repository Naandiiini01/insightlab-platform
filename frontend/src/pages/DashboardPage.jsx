import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import api from '../utils/api'
import toast from 'react-hot-toast'
import { Plus, Layers, LogOut, BarChart2, Users, ExternalLink, MoreHorizontal, Trash2, Copy, Eye } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const STATUS_BADGE = {
  draft:     'bg-surface-100 text-ink-500 border-surface-200',
  published: 'bg-green-50 text-green-700 border-green-200',
  closed:    'bg-surface-100 text-ink-300 border-surface-200',
}

/** Django REST returns snake_case; tolerate camelCase if we ever normalize. */
function formatStudyUpdated(study) {
  const raw = study.updated_at ?? study.updatedAt
  if (!raw) return 'recently'
  const d = new Date(raw)
  if (Number.isNaN(d.getTime())) return 'recently'
  return formatDistanceToNow(d, { addSuffix: true })
}

export default function DashboardPage() {
  const { user, logout } = useAuthStore()
  const [studies, setStudies] = useState([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [menuOpen, setMenuOpen] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetchStudies()
  }, [])

  const fetchStudies = async () => {
    try {
      const res = await api.get('/studies')
      setStudies(res.data.studies)
    } catch {
      toast.error('Failed to load studies')
    } finally {
      setLoading(false)
    }
  }

  const createStudy = async () => {
    setCreating(true)
    try {
      const res = await api.post('/studies', { title: 'Untitled Study' })
      navigate(`/studies/${res.data.study.id}/build`)
    } catch {
      toast.error('Failed to create study')
    } finally {
      setCreating(false)
    }
  }

  const deleteStudy = async (id) => {
    if (!confirm('Delete this study? This cannot be undone.')) return
    await api.delete(`/studies/${id}`)
    setStudies((s) => s.filter((st) => st.id !== id))
    toast.success('Study deleted')
  }

  const duplicateStudy = async (id) => {
    try {
      const res = await api.post(`/studies/${id}/duplicate`)
      setStudies((s) => [res.data.study, ...s])
      toast.success('Study duplicated')
    } catch {
      toast.error('Failed to duplicate')
    }
  }

  const copyLink = (token) => {
    navigator.clipboard.writeText(`${window.location.origin}/t/${token}`)
    toast.success('Participant link copied!')
  }

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Layers size={14} className="text-white" />
            </div>
            <span className="font-semibold text-ink-900">InsightLab</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500">{user?.name}</span>
            <button onClick={logout} className="btn-ghost text-sm py-1.5">
              <LogOut size={15} /> Sign out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-10">
        {/* Hero */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-ink-900">Your Studies</h1>
            <p className="text-ink-500 mt-1">Build, run, and analyze usability tests</p>
          </div>
          <button className="btn-primary" onClick={createStudy} disabled={creating}>
            <Plus size={16} /> {creating ? 'Creating…' : 'New study'}
          </button>
        </div>

        {/* Stats row */}
        {studies.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: 'Total studies', value: studies.length, icon: Layers },
              { label: 'Published', value: studies.filter(s => s.status === 'published').length, icon: Eye },
              { label: 'Total responses', value: studies.reduce((a, s) => a + (s.response_count ?? s.responseCount ?? 0), 0), icon: Users },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="card px-5 py-4">
                <div className="flex items-center gap-2 text-ink-300 mb-2">
                  <Icon size={14} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <div className="text-2xl font-bold text-ink-900">{value}</div>
              </div>
            ))}
          </div>
        )}

        {/* Studies grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1,2,3].map(i => (
              <div key={i} className="card p-5">
                <div className="skeleton h-4 w-3/4 mb-3" />
                <div className="skeleton h-3 w-1/2 mb-6" />
                <div className="skeleton h-3 w-full" />
              </div>
            ))}
          </div>
        ) : studies.length === 0 ? (
          <div className="card flex flex-col items-center justify-center py-20 text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-50 flex items-center justify-center mb-4">
              <Layers size={24} className="text-brand-500" />
            </div>
            <h3 className="font-semibold text-ink-900 mb-2">Create your first study</h3>
            <p className="text-ink-500 text-sm mb-6 max-w-xs">Build a usability test in minutes and start collecting participant insights.</p>
            <button className="btn-primary" onClick={createStudy} disabled={creating}>
              <Plus size={16} /> Create study
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {studies.map((study) => (
              <div key={study.id} className="card p-5 hover:shadow-md transition-shadow group relative">
                {/* Status + menu */}
                <div className="flex items-center justify-between mb-3">
                  <span className={`badge border ${STATUS_BADGE[study.status] || STATUS_BADGE.draft}`}>
                    {study.status}
                  </span>
                  <div className="relative">
                    <button
                      className="btn-ghost p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => setMenuOpen(menuOpen === study.id ? null : study.id)}
                    >
                      <MoreHorizontal size={15} />
                    </button>
                    {menuOpen === study.id && (
                      <div className="absolute right-0 top-8 z-50 card min-w-[160px] py-1 shadow-lg animate-scale-in">
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-surface-50"
                          onClick={() => { navigate(`/studies/${study.id}/build`); setMenuOpen(null) }}
                        >
                          <Layers size={14} /> Open builder
                        </button>
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-surface-50"
                          onClick={() => { duplicateStudy(study.id); setMenuOpen(null) }}
                        >
                          <Copy size={14} /> Duplicate
                        </button>
                        {(study.participant_token ?? study.participantToken) && (
                          <button
                            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-ink-700 hover:bg-surface-50"
                            onClick={() => { copyLink(study.participant_token ?? study.participantToken); setMenuOpen(null) }}
                          >
                            <ExternalLink size={14} /> Copy link
                          </button>
                        )}
                        <div className="border-t border-surface-100 my-1" />
                        <button
                          className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50"
                          onClick={() => { deleteStudy(study.id); setMenuOpen(null) }}
                        >
                          <Trash2 size={14} /> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h3 className="font-semibold text-ink-900 mb-1 truncate">{study.title}</h3>
                <p className="text-xs text-ink-400 mb-4">
                  Updated {formatStudyUpdated(study)}
                </p>

                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-ink-400 border-t border-surface-100 pt-3 mb-4">
                  <span className="flex items-center gap-1"><Users size={12} /> {study.response_count ?? study.responseCount ?? 0} responses</span>
                  <span className="flex items-center gap-1"><Layers size={12} /> {study.block_count ?? study.blockCount ?? 0} blocks</span>
                  {(study.device_target ?? study.deviceTarget) && (
                    <span className="capitalize">{study.device_target ?? study.deviceTarget}</span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    className="btn-secondary flex-1 justify-center text-xs"
                    onClick={() => navigate(`/studies/${study.id}/build`)}
                  >
                    Edit
                  </button>
                  <button
                    className="btn-secondary flex-1 justify-center text-xs"
                    onClick={() => navigate(`/studies/${study.id}/results`)}
                  >
                    <BarChart2 size={13} /> Results
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Close menu on outside click */}
      {menuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setMenuOpen(null)} />
      )}
    </div>
  )
}
