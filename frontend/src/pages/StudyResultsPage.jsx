import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../utils/api'
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { ArrowLeft, Users, CheckCircle, Clock, TrendingUp, BarChart2, FileText, Filter } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const COLORS = ['#6272f5', '#10b981', '#f59e0b', '#ec4899', '#06b6d4', '#8b5cf6']

export default function StudyResultsPage() {
  const { studyId } = useParams()
  const navigate = useNavigate()
  const [study, setStudy] = useState(null)
  const [analytics, setAnalytics] = useState(null)
  const [sessions, setSessions] = useState([])
  const [selectedBlock, setSelectedBlock] = useState(null)
  const [blockAnalytics, setBlockAnalytics] = useState(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState('overview') // overview | sessions | blocks

  useEffect(() => {
    const load = async () => {
      try {
        const [studyRes, analyticsRes, sessionsRes] = await Promise.all([
          api.get(`/studies/${studyId}/`),
          api.get(`/analytics/${studyId}/`),
          api.get(`/sessions/study/${studyId}/`),
        ])
        setStudy(studyRes.data)
        setAnalytics(analyticsRes.data)
        setSessions(sessionsRes.data.sessions || [])
      } catch (e) {
        console.error(e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [studyId])

  const loadBlockAnalytics = async (blockId) => {
    setSelectedBlock(blockId)
    const res = await api.get(`/analytics/${studyId}/blocks/${blockId}/`)
    setBlockAnalytics(res.data)
  }

  if (loading) return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const fmt = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`
  const selectedBlockRows = selectedBlock
    ? sessions.flatMap((session) =>
        (session.responses || [])
          .filter((r) => r.block_id === selectedBlock)
          .map((r) => ({
            sessionId: session.id,
            device: session.device_type || '—',
            submittedAt: r.created_at,
            answer: formatResponseValue(r),
          })),
      )
    : []

  return (
    <div className="min-h-screen bg-surface-50">
      {/* Header */}
      <header className="bg-white border-b border-surface-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center gap-4">
          <button onClick={() => navigate('/')} className="btn-ghost p-2"><ArrowLeft size={16} /></button>
          <div className="flex-1">
            <h1 className="font-semibold text-ink-900 truncate">{study?.title}</h1>
          </div>
          <button className="btn-secondary text-sm" onClick={() => navigate(`/studies/${studyId}/build`)}>
            Edit study
          </button>
          <button className="btn-primary text-sm" onClick={() => navigate(`/studies/${studyId}/report`)}>
            <FileText size={14} /> Report
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stat cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Total sessions',    value: analytics?.total_sessions ?? 0,         Icon: Users,         color: 'text-brand-600',  bg: 'bg-brand-50' },
            { label: 'Completed',         value: analytics?.completed_sessions ?? 0,      Icon: CheckCircle,   color: 'text-green-600',  bg: 'bg-green-50' },
            { label: 'Completion rate',   value: `${analytics?.completion_rate ?? 0}%`,   Icon: TrendingUp,    color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Avg duration',      value: fmt(analytics?.avg_duration_seconds ?? 0), Icon: Clock,       color: 'text-amber-600',  bg: 'bg-amber-50' },
          ].map(({ label, value, Icon, color, bg }) => (
            <div key={label} className="card px-5 py-4">
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center mb-3`}>
                <Icon size={16} className={color} />
              </div>
              <div className="text-2xl font-bold text-ink-900 mb-0.5">{value}</div>
              <div className="text-xs text-ink-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-surface-200 mb-8">
          {[
            { id: 'overview', label: 'Overview', Icon: BarChart2 },
            { id: 'sessions', label: 'Sessions', Icon: Users },
            { id: 'blocks',   label: 'Block Results', Icon: Filter },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === id
                  ? 'border-brand-600 text-brand-700'
                  : 'border-transparent text-ink-500 hover:text-ink-700'
              }`}
            >
              <Icon size={15} /> {label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {tab === 'overview' && (
          <div className="space-y-6">
            {/* Daily responses */}
            {analytics?.daily_responses?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-ink-900 mb-4">Daily Responses</h3>
                <ResponsiveContainer width="100%" height={220}>
                  <LineChart data={analytics.daily_responses}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9099b8' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#9099b8' }} allowDecimals={false} />
                    <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e4e7f0' }} />
                    <Line type="monotone" dataKey="count" stroke="#6272f5" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Device breakdown */}
              {analytics?.device_breakdown?.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-semibold text-ink-900 mb-4">Device Breakdown</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={analytics.device_breakdown} dataKey="count" nameKey="device_type"
                        cx="50%" cy="50%" outerRadius={80} label={({ device_type, percent }) =>
                          `${device_type} ${(percent * 100).toFixed(0)}%`}>
                        {analytics.device_breakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              {/* Variant breakdown */}
              {analytics?.variant_breakdown?.some(v => v.variant_assigned) && (
                <div className="card p-6">
                  <h3 className="font-semibold text-ink-900 mb-4">Variant Performance</h3>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.variant_breakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" />
                      <XAxis dataKey="variant_assigned" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="total" fill="#6272f5" name="Total" radius={[4,4,0,0]} />
                      <Bar dataKey="completed" fill="#10b981" name="Completed" radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Drop-off */}
            {analytics?.drop_off_by_block?.length > 0 && (
              <div className="card p-6">
                <h3 className="font-semibold text-ink-900 mb-4">Drop-off Points</h3>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={analytics.drop_off_by_block}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" />
                    <XAxis dataKey="dropped_off_at_block__type" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#f59e0b" radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Sessions Tab */}
        {tab === 'sessions' && (
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-surface-200 bg-surface-50">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400">Session</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400">Device</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400">Variant</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400">Status</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400">Duration</th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-ink-400">Started</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-ink-400">No sessions yet</td></tr>
                  ) : sessions.map(s => (
                    <tr key={s.id} className="border-b border-surface-100 hover:bg-surface-50">
                      <td className="px-4 py-3 font-mono text-xs text-ink-400">{s.id.slice(0, 8)}…</td>
                      <td className="px-4 py-3 text-ink-700 capitalize">{s.device_type || '—'}</td>
                      <td className="px-4 py-3 text-ink-700">{s.variant_assigned || '—'}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${s.completed ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                          {s.completed ? 'Completed' : 'In progress'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-ink-700">
                        {s.duration_seconds ? fmt(s.duration_seconds) : '—'}
                      </td>
                      <td className="px-4 py-3 text-ink-400 text-xs">
                        {formatDistanceToNow(new Date(s.started_at), { addSuffix: true })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Block Results Tab */}
        {tab === 'blocks' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Block list */}
            <div className="lg:col-span-4 xl:col-span-3 space-y-2 lg:sticky lg:top-20 self-start max-h-[72vh] overflow-y-auto pr-1">
              {study?.blocks?.map((block, idx) => (
                <button
                  key={block.id}
                  onClick={() => loadBlockAnalytics(block.id)}
                  className={`w-full text-left card px-4 py-3 transition-all ${
                    selectedBlock === block.id
                      ? 'ring-2 ring-brand-500 border-brand-200 shadow-md bg-brand-50/40'
                      : 'hover:shadow-md'
                  }`}
                >
                  <p className="text-xs text-ink-400 mb-1">Block {idx + 1} · {block.type}</p>
                  <p className="text-sm font-medium text-ink-900 truncate">
                    {block.content?.title || block.content?.taskTitle || block.content?.questionText || block.type}
                  </p>
                </button>
              ))}
            </div>

            {/* Block analytics panel */}
            <div className="lg:col-span-8 xl:col-span-9">
              {blockAnalytics ? (
                <BlockAnalyticsPanel
                  data={blockAnalytics}
                  detailRows={selectedBlockRows}
                />
              ) : (
                <div className="card h-64 flex items-center justify-center text-ink-400 text-sm">
                  Select a block to see its results
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function BlockAnalyticsPanel({ data, detailRows }) {
  const fmt = (s) => s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`

  return (
    <div className="space-y-4">
      <div className="card p-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-ink-400 mb-1">Responses</p>
            <p className="text-2xl font-bold text-ink-900">{data.total_responses}</p>
          </div>
          <div>
            <p className="text-xs text-ink-400 mb-1">Avg time</p>
            <p className="text-2xl font-bold text-ink-900">{fmt(data.avg_time_seconds)}</p>
          </div>
          {data.success_rate !== undefined && (
            <div>
              <p className="text-xs text-ink-400 mb-1">Success rate</p>
              <p className="text-2xl font-bold text-green-600">{data.success_rate}%</p>
            </div>
          )}
        </div>
      </div>

      {/* Task: completion chart */}
      {data.success_count !== undefined && (
        <div className="card p-5">
          <h4 className="font-semibold text-ink-900 mb-4">Task Completion</h4>
          <ResponsiveContainer width="100%" height={160}>
            <BarChart data={[
              { name: 'Success', count: data.success_count },
              { name: 'Failed', count: data.fail_count },
              { name: 'Skipped', count: data.skip_count },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" radius={[4,4,0,0]}>
                {[0,1,2].map((i) => (
                  <Cell key={i} fill={['#10b981','#ef4444','#f59e0b'][i]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Question: answer distribution */}
      {data.answer_distribution && (
        <div className="card p-5">
          <h4 className="font-semibold text-ink-900 mb-4">Answer Distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={Object.entries(data.answer_distribution).map(([k, v]) => ({ answer: k, count: v }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e4e7f0" />
              <XAxis dataKey="answer" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#6272f5" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Open text responses */}
      {data.open_responses?.length > 0 && (
        <div className="card p-5">
          <h4 className="font-semibold text-ink-900 mb-3">Open Responses ({data.open_responses.length})</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {data.open_responses.map((r, i) => (
              <div key={i} className="bg-surface-50 rounded-lg px-3 py-2 text-sm text-ink-700 border border-surface-200">
                "{r}"
              </div>
            ))}
          </div>
        </div>
      )}

      {/* NPS / rating avg */}
      {data.avg_score !== undefined && (
        <div className="card p-5">
          <h4 className="font-semibold text-ink-900 mb-2">Average Score</h4>
          <p className="text-4xl font-bold text-brand-600">{data.avg_score}</p>
        </div>
      )}

      {/* Session-wise rows (Maze-style detail under selected block) */}
      <div className="card p-5">
        <h4 className="font-semibold text-ink-900 mb-4">Session-wise Responses</h4>
        {detailRows?.length ? (
          <div className="overflow-x-auto rounded-xl border border-surface-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-surface-200 bg-surface-50">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Session</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Device</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Submitted</th>
                  <th className="text-left px-3 py-2 text-xs font-semibold text-ink-400">Response</th>
                </tr>
              </thead>
              <tbody>
                {detailRows.map((row, idx) => (
                  <tr key={`${row.sessionId}-${idx}`} className="border-b border-surface-100">
                    <td className="px-3 py-2 font-mono text-xs text-ink-500">{row.sessionId.slice(0, 8)}…</td>
                    <td className="px-3 py-2 text-ink-700 capitalize">{row.device}</td>
                    <td className="px-3 py-2 text-ink-500 text-xs">
                      {row.submittedAt ? formatDistanceToNow(new Date(row.submittedAt), { addSuffix: true }) : '—'}
                    </td>
                    <td className="px-3 py-2 text-ink-700 whitespace-pre-wrap">{row.answer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-ink-400">No session-level responses for this block yet.</p>
        )}
      </div>
    </div>
  )
}

function formatResponseValue(response) {
  if (!response) return '—'
  if (response.task_completion_status) {
    return response.task_completion_status === 'success'
      ? 'Completed'
      : response.task_completion_status === 'fail'
        ? "Couldn't complete"
        : 'Skipped'
  }
  const value = response.answer
  if (value === null || value === undefined || value === '') return '—'
  if (Array.isArray(value)) return value.join(', ')
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value)
    } catch {
      return String(value)
    }
  }
  return String(value)
}
