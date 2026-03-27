import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, Download, Share2, Copy, Check, Users, TrendingUp, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ReportPage() {
  const { studyId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    api.get(`/analytics/${studyId}/report/`)
      .then(r => setReport(r.data))
      .finally(() => setLoading(false))
  }, [studyId])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => window.print()

  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const s = report?.summary || {}
  const study = report?.study || {}
  const blocks = report?.blocks_analytics || []

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Toolbar – hidden on print */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40 print:hidden">
        <div className="max-w-4xl mx-auto px-6 h-14 flex items-center gap-3">
          <button onClick={() => navigate(`/studies/${studyId}/results`)} className="btn-ghost p-2">
            <ArrowLeft size={16} />
          </button>
          <span className="font-semibold text-ink-900 flex-1">{study.title} — Report</span>
          <button className="btn-secondary text-sm" onClick={copyLink}>
            {copied ? <><Check size={14} /> Copied</> : <><Copy size={14} /> Copy link</>}
          </button>
          <button className="btn-secondary text-sm" onClick={handlePrint}>
            <Download size={14} /> Export PDF
          </button>
        </div>
      </header>

      {/* Report document */}
      <div className="max-w-4xl mx-auto px-6 py-12 print:py-6 print:px-0">
        {/* Cover */}
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <div className="w-6 h-6 rounded bg-brand-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">IL</span>
            </div>
            <span className="text-xs font-semibold text-ink-400 uppercase tracking-widest">InsightLab Report</span>
          </div>

          <h1 className="text-4xl font-bold text-ink-900 mb-3">{study.title}</h1>
          {study.description && <p className="text-ink-500 text-lg mb-4">{study.description}</p>}

          <div className="flex items-center gap-6 text-sm text-ink-400">
            {study.published_at && (
              <span>Published {format(new Date(study.published_at), 'MMM d, yyyy')}</span>
            )}
            <span>Device target: {study.device_target || 'Responsive'}</span>
          </div>
        </div>

        {/* Summary metrics */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-surface-200">
            Summary
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total participants', value: s.total_sessions ?? 0, Icon: Users, color: 'text-brand-600' },
              { label: 'Completion rate',   value: `${s.completion_rate ?? 0}%`, Icon: TrendingUp, color: 'text-green-600' },
              { label: 'Completed',         value: s.completed_sessions ?? 0, Icon: Clock, color: 'text-purple-600' },
            ].map(({ label, value, Icon, color }) => (
              <div key={label} className="card p-5 text-center">
                <Icon size={20} className={`${color} mx-auto mb-2`} />
                <div className="text-3xl font-bold text-ink-900 mb-1">{value}</div>
                <div className="text-xs text-ink-400">{label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Methodology */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-surface-200">
            Methodology
          </h2>
          <p className="text-ink-700 leading-relaxed">
            This study was conducted as an unmoderated usability test using InsightLab. Participants
            were recruited via a shared link and completed the study independently. The test consisted
            of {study.blocks?.length || 0} blocks including tasks, questions, and follow-up questions.
            {study.device_target !== 'responsive' && ` The study was optimised for ${study.device_target} devices.`}
          </p>
        </section>

        {/* Block-by-block findings */}
        <section className="mb-12">
          <h2 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-surface-200">
            Task & Question Findings
          </h2>
          {blocks.length === 0 ? (
            <p className="text-ink-400 text-sm">No block data available yet.</p>
          ) : (
            <div className="space-y-6">
              {blocks.map((b, idx) => (
                <div key={b.block_id} className="card p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className="badge bg-surface-100 text-ink-500 border border-surface-200 mb-2">
                        Block {idx + 1} · {b.block_type}
                      </span>
                    </div>
                    <div className="text-right text-sm text-ink-400">
                      <div>{b.total_responses} responses</div>
                      <div>Avg time: {b.avg_time_seconds}s</div>
                    </div>
                  </div>

                  {b.block_type === 'task' && (
                    <div className="flex gap-6 mt-2">
                      {b.success_rate !== undefined && (
                        <div>
                          <div className="text-2xl font-bold text-green-600">{b.success_rate}%</div>
                          <div className="text-xs text-ink-400">Success rate</div>
                        </div>
                      )}
                    </div>
                  )}

                  {b.open_responses?.slice(0, 3).map((r, i) => (
                    <div key={i} className="bg-surface-50 rounded-lg px-3 py-2 text-sm text-ink-700 mt-2">
                      "{r}"
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Footer */}
        <div className="border-t border-surface-200 pt-6 text-center">
          <p className="text-xs text-ink-300">
            Generated by InsightLab · {format(new Date(), 'MMMM d, yyyy')}
          </p>
        </div>
      </div>
    </div>
  )
}
