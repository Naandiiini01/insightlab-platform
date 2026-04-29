import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import { ArrowLeft, Download, Copy, Check, Users, TrendingUp, Clock } from 'lucide-react'
import { formatDistanceToNow, format } from 'date-fns'

export default function ReportPage() {
  const { studyId } = useParams()
  const navigate = useNavigate()
  const [report, setReport] = useState(null)
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [selectedBlockId, setSelectedBlockId] = useState(null)

  useEffect(() => {
    Promise.all([
      api.get(`/analytics/${studyId}/report/`),
      api.get(`/sessions/study/${studyId}/`),
    ])
      .then(([reportRes, sessionsRes]) => {
        setReport(reportRes.data)
        setSessions(sessionsRes.data?.sessions || [])
      })
      .finally(() => setLoading(false))
  }, [studyId])

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePrint = () => window.print()

  const s = report?.summary || {}
  const study = report?.study || {}
  const blocks = report?.blocks_analytics || []
  const avgTimeByBlockId = Object.fromEntries(
    (blocks || []).map((b) => [b.block_id, b.avg_time_seconds]),
  )
  const blockMetaById = Object.fromEntries((study.blocks || []).map((b) => [b.id, b]))
  const blockRows = (study.blocks || []).map((b, idx) => ({
    id: b.id,
    order: idx + 1,
    type: b.type,
    title: b.content?.title || b.content?.taskTitle || b.content?.questionText || b.content?.question_text || b.type,
  }))

  const blockSessionRows = sessions.flatMap((session) =>
    (session.responses || [])
      .map((r) => {
      const block = blockMetaById[r.block_id] || {}
      const blockOrder = (study.blocks || []).findIndex((b) => b.id === r.block_id)
      return {
        blockId: r.block_id,
        sessionId: session.id,
        blockOrder: blockOrder >= 0 ? blockOrder + 1 : '—',
        blockType: block.type || '—',
        blockTitle: block.content?.title || block.content?.taskTitle || block.content?.questionText || block.content?.question_text || 'Untitled block',
        submittedAt: r.created_at,
        response: block.type === 'task' ? formatTaskRow(r) : formatAnswer(r.answer),
      }
    }),
  )
  useEffect(() => {
    if (selectedBlockId || blockRows.length === 0) return
    const responseBlockIds = new Set(
      sessions.flatMap((session) => (session.responses || []).map((r) => r.block_id)),
    )
    const firstWithResponses = blockRows.find((b) => responseBlockIds.has(b.id))
    setSelectedBlockId(firstWithResponses?.id || blockRows[0].id)
  }, [selectedBlockId, blockRows, sessions])

  const screenRows = selectedBlockId
    ? blockSessionRows.filter((r) => r.blockId === selectedBlockId)
    : blockSessionRows

  const printableRowsByBlock = blockRows
    .map((b) => ({
      ...b,
      rows: sessions.flatMap((session) =>
        (session.responses || [])
          .filter((r) => r.block_id === b.id)
          .map((r) => {
            const block = blockMetaById[r.block_id] || {}
            return {
              sessionId: session.id,
              submittedAt: r.created_at,
              response: block.type === 'task' ? formatTaskRow(r) : formatAnswer(r.answer),
            }
          }),
      ),
    }))
    .filter((b) => b.rows.length > 0)
  const questionBlocks = (study.blocks || []).filter((b) => b.type === 'question' || b.type === 'followup')
  const printableQuestionSections = questionBlocks.map((qb, idx) => {
    const rows = sessions.flatMap((session) =>
      (session.responses || [])
        .filter((r) => r.block_id === qb.id && r.answer !== null && r.answer !== undefined && r.answer !== '')
        .map((r) => ({
          sessionId: session.id,
          answer: r.answer,
          submittedAt: r.created_at,
        })),
    )

    const distribution = {}
    rows.forEach((row) => {
      if (Array.isArray(row.answer)) {
        row.answer.forEach((opt) => {
          const key = String(opt)
          distribution[key] = (distribution[key] || 0) + 1
        })
      } else if (typeof row.answer !== 'object') {
        const key = String(row.answer)
        distribution[key] = (distribution[key] || 0) + 1
      }
    })

    const totalChoices = Object.values(distribution).reduce((sum, n) => sum + n, 0)
    return {
      id: qb.id,
      order: (study.blocks || []).findIndex((b) => b.id === qb.id) + 1 || idx + 1,
      title: qb.content?.questionText || qb.content?.question_text || 'Question',
      qType: qb.content?.questionType || qb.content?.question_type || 'open_text',
      rows,
      distribution: Object.entries(distribution)
        .map(([option, count]) => ({
          option,
          count,
          pct: totalChoices ? Math.round((count / totalChoices) * 100) : 0,
        }))
        .sort((a, b) => b.count - a.count),
    }
  }).filter((sct) => sct.rows.length > 0)

  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

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

        {/* Print-only: full session-level evidence across all blocks */}
        <section className="mb-12 hidden print:block">
          <h2 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-surface-200">
            Session Detail (All Blocks)
          </h2>
          {printableRowsByBlock.length === 0 ? (
            <p className="text-ink-400 text-sm">No session-level block responses yet.</p>
          ) : (
            <div className="space-y-5">
              {printableRowsByBlock.map((block) => (
                <div key={block.id} className="card p-4 break-inside-avoid">
                  <div className="mb-3">
                    <span className="badge bg-surface-100 text-ink-500 border border-surface-200">
                      Block #{block.order} · {block.type}
                    </span>
                    <p className="text-sm font-medium text-ink-900 mt-1">{block.title}</p>
                  </div>
                  <div className="overflow-x-auto rounded-xl border border-surface-200">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-surface-200 bg-surface-50">
                          <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Session</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Submitted</th>
                          <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Response</th>
                        </tr>
                      </thead>
                      <tbody>
                        {block.rows.map((row, idx) => (
                          <tr key={`${block.id}-${row.sessionId}-${idx}`} className="border-b border-surface-100">
                            <td className="px-3 py-2 font-mono text-xs text-ink-500">{row.sessionId.slice(0, 8)}…</td>
                            <td className="px-3 py-2 text-ink-500 text-xs">
                              {row.submittedAt ? formatDistanceToNow(new Date(row.submittedAt), { addSuffix: true }) : '—'}
                            </td>
                            <td className="px-3 py-2 text-ink-700 whitespace-pre-wrap">{row.response}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Print-only: richer question evidence (Maze-style detail) */}
        <section className="mb-12 hidden print:block">
          <h2 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-surface-200">
            Question Responses (Detailed)
          </h2>
          {printableQuestionSections.length === 0 ? (
            <p className="text-ink-400 text-sm">No question responses recorded yet.</p>
          ) : (
            <div className="space-y-5">
              {printableQuestionSections.map((q) => (
                <div key={q.id} className="card p-4 break-inside-avoid">
                  <div className="mb-3">
                    <span className="badge bg-surface-100 text-ink-500 border border-surface-200">
                      Block #{q.order} · {q.qType}
                    </span>
                    <p className="text-sm font-medium text-ink-900 mt-1">{q.title}</p>
                  </div>

                  {q.distribution.length > 0 && (
                    <div className="mb-4 rounded-xl border border-surface-200 overflow-hidden">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-surface-200 bg-surface-50">
                            <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Option</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Count</th>
                            <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Share</th>
                          </tr>
                        </thead>
                        <tbody>
                          {q.distribution.map((d) => (
                            <tr key={`${q.id}-${d.option}`} className="border-b border-surface-100">
                              <td className="px-3 py-2 text-ink-700">{d.option}</td>
                              <td className="px-3 py-2 text-ink-700">{d.count}</td>
                              <td className="px-3 py-2 text-ink-500">{d.pct}%</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="space-y-2">
                    {q.rows.map((row, idx) => (
                      <div key={`${q.id}-${row.sessionId}-${idx}`} className="rounded-lg border border-surface-200 px-3 py-2">
                        <div className="flex items-center justify-between gap-2 text-xs text-ink-400 mb-1">
                          <span className="font-mono">{row.sessionId.slice(0, 8)}…</span>
                          <span>{row.submittedAt ? formatDistanceToNow(new Date(row.submittedAt), { addSuffix: true }) : '—'}</span>
                        </div>
                        <p className="text-sm text-ink-700 whitespace-pre-wrap">{formatAnswer(row.answer)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
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

        {/* Block + session matrix (Maze-style detail) */}
        <section className="mb-12 print:hidden">
          <h2 className="text-xl font-bold text-ink-900 mb-5 pb-2 border-b border-surface-200">
            Block-wise Session Detail
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-4 space-y-2 max-h-[60vh] overflow-y-auto pr-1">
              {blockRows.map((row) => (
                <button
                  key={row.id}
                  type="button"
                  onClick={() => setSelectedBlockId(row.id)}
                  className={`w-full text-left card px-4 py-3 transition-all ${
                    selectedBlockId === row.id
                      ? 'ring-2 ring-brand-500 border-brand-200 shadow-md bg-brand-50/40'
                      : 'hover:shadow-md'
                  }`}
                >
                  <p className="text-xs text-ink-400 mb-1">Block #{row.order} · {row.type}</p>
                  <p className="text-sm text-ink-800 font-medium truncate">{row.title}</p>
                </button>
              ))}
            </div>
            <div className="lg:col-span-8 card p-4">
              {screenRows.length === 0 ? (
                <p className="text-ink-400 text-sm">No session-level block responses yet.</p>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-surface-200">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-surface-200 bg-surface-50">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Session</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Block</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Type</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Avg time</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Response</th>
                      </tr>
                    </thead>
                    <tbody>
                      {screenRows.map((row, idx) => (
                        <tr key={`${row.sessionId}-${idx}`} className="border-b border-surface-100">
                          <td className="px-3 py-2 font-mono text-xs text-ink-500">{row.sessionId.slice(0, 8)}…</td>
                          <td className="px-3 py-2 text-ink-700">#{row.blockOrder}</td>
                          <td className="px-3 py-2 text-ink-500">{row.blockType}</td>
                          <td className="px-3 py-2 text-ink-500 text-xs">{avgTimeByBlockId[row.blockId] ?? '—'}s</td>
                          <td className="px-3 py-2 text-ink-700 whitespace-pre-wrap">{row.response}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
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

function formatAnswer(answer) {
  if (answer === null || answer === undefined || answer === '') return '—'
  if (Array.isArray(answer)) return answer.join(', ')
  if (typeof answer === 'object') {
    try {
      return JSON.stringify(answer)
    } catch {
      return String(answer)
    }
  }
  return String(answer)
}

function formatTaskRow(r) {
  const status = r.task_completion_status || '—'
  const map = { success: 'Completed', fail: "Couldn't complete", skip: 'Skipped' }
  const label = map[status] || status
  return label
}
