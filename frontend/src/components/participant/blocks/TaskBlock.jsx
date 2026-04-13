import { useState, useEffect, useRef } from 'react'
import { ExternalLink, Clock, CheckCircle, XCircle } from 'lucide-react'

export default function TaskBlock({ block, onNext, previewMode = false }) {
  const c = block.content
  const [status, setStatus] = useState(null) // null | 'success' | 'fail'
  const [elapsed, setElapsed] = useState(0)
  const [showEmbed, setShowEmbed] = useState(false)
  const timerRef = useRef(null)

  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed(e => e + 1), 1000)
    return () => clearInterval(timerRef.current)
  }, [])

  const timeLimit = c.timeLimit || 0
  const remaining = timeLimit > 0 ? Math.max(0, timeLimit - elapsed) : null

  useEffect(() => {
    if (remaining === 0) {
      clearInterval(timerRef.current)
      setStatus('fail')
    }
  }, [remaining])

  const handleComplete = (s) => {
    clearInterval(timerRef.current)
    setStatus(s)
  }

  const handleSubmit = () => {
    const payload = {
      task_completed: status === 'success',
      task_completion_status: status,
    }
    // Client report hint: how the participant viewed the task (easy to remove later).
    if (c.embedUrl) {
      payload.answer = { embed_mode: showEmbed ? 'embedded' : 'new_tab' }
    }
    onNext(payload)
  }

  const fmt = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className={`${previewMode ? 'h-full min-h-0' : 'min-h-screen'} flex flex-col`}>
      {/* Task header */}
      <div className="bg-white border-b border-surface-200 px-6 py-4 flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="section-title mb-1">Task</p>
          <h2 className="font-bold text-ink-900 text-lg">{c.taskTitle}</h2>
          {c.instructions && <p className="text-ink-500 text-sm mt-1">{c.instructions}</p>}
        </div>
        {timeLimit > 0 && (
          <div className={`flex items-center gap-1.5 text-sm font-mono font-semibold px-3 py-1.5 rounded-full ${
            remaining < 30 ? 'bg-red-100 text-red-600' : 'bg-surface-100 text-ink-600'
          }`}>
            <Clock size={14} />
            {fmt(remaining ?? elapsed)}
          </div>
        )}
      </div>

      {/* Embed area */}
      {c.embedUrl && (
        <div className="flex-1 relative min-h-0 overflow-hidden">
          {showEmbed ? (
            <div className="w-full h-full min-h-0 flex flex-col bg-surface-900 overflow-hidden">
              <div className="p-3 border-b border-surface-700 bg-surface-800 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3 shrink-0">
                <p className="text-xs text-surface-200 flex-1">
                  If the site blocks embedding, this view may look blank. Open the task in a new tab, or switch back to choose how you view it.
                </p>
                <div className="flex flex-wrap gap-2 shrink-0">
                  <a
                    href={c.embedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn-primary text-sm py-1.5 px-3 inline-flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink size={14} /> Open in new tab
                  </a>
                  <button
                    type="button"
                    className="btn-secondary text-sm py-1.5 px-3"
                    onClick={() => setShowEmbed(false)}
                  >
                    Leave embedded view
                  </button>
                </div>
              </div>
              <iframe
                src={c.embedUrl}
                className="w-full flex-1 min-h-0 border-0 bg-white"
                sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
                title="Task content"
              />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 bg-surface-50 gap-4">
              <div className="card p-8 text-center max-w-sm w-full">
                <p className="text-ink-600 mb-4 text-sm">
                  Best option: open the task in a separate tab (some websites block embedded iframes).
                </p>
                <div className="flex flex-col gap-2">
                  <a href={c.embedUrl} target="_blank" rel="noreferrer" className="btn-primary justify-center">
                    <ExternalLink size={14} /> Open in new tab
                  </a>
                  <button className="btn-secondary justify-center" onClick={() => setShowEmbed(true)}>
                    Try embedded view
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completion panel */}
      <div className="bg-white border-t border-surface-200 px-6 py-4">
        {status === null ? (
          <div className="flex items-center gap-3">
            <span className="text-sm text-ink-500 mr-auto">When you're done, mark the task:</span>
            <button
              className="btn gap-2 bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"
              onClick={() => handleComplete('success')}
            >
              <CheckCircle size={15} /> Completed
            </button>
            <button
              className="btn gap-2 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100"
              onClick={() => handleComplete('fail')}
            >
              <XCircle size={15} /> Couldn't complete
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 text-sm font-medium mr-auto ${
              status === 'success' ? 'text-green-600' : 'text-red-500'
            }`}>
              {status === 'success' ? <CheckCircle size={16} /> : <XCircle size={16} />}
              {status === 'success' ? 'Task completed' : "Couldn't complete task"}
            </div>
            <button className="btn-primary" onClick={handleSubmit}>Continue →</button>
          </div>
        )}
      </div>
    </div>
  )
}
