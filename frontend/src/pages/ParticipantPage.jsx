import { useEffect, useState, useRef } from 'react'
import { useParams } from 'react-router-dom'
import api from '../utils/api'
import ConsentScreen from '../components/participant/ConsentScreen'
import BlockRenderer from '../components/participant/BlockRenderer'
import { Layers } from 'lucide-react'

export default function ParticipantPage() {
  const { participantToken } = useParams()
  const [study, setStudy] = useState(null)
  const [error, setError] = useState(null)
  const [phase, setPhase] = useState('loading')   // loading | consent | test | done
  const [step, setStep] = useState(0)
  const sessionRef = useRef(null)
  const blockStartRef = useRef(Date.now())
  const currentBlockIdRef = useRef(null)
  const recordersRef = useRef({
    screen: null,
    camera: null,
    audio: null,
  })
  const chunkIndexRef = useRef({
    screen: 0,
    camera: 0,
    audio: 0,
  })
  const uploadQueueRef = useRef(Promise.resolve())
  const [consent, setConsent] = useState(null)
  const cameraVideoRef = useRef(null)
  const screenVideoRef = useRef(null)

  useEffect(() => {
    const init = async () => {
      try {
        // Fetch published study
        const res = await api.get(`/studies/public/${participantToken}/`)
        setStudy(res.data)

        // Start session
        const ua = navigator.userAgent
        const isMobile = /Mobi|Android/i.test(ua)
        const isTablet = /Tablet|iPad/i.test(ua)
        const qp = new URLSearchParams(window.location.search)
        const variantPref = qp.get('variant') || qp.get('variant_name') || qp.get('variantName')
        const sessionRes = await api.post(`/sessions/start/${participantToken}/`, {
          device_type: isMobile ? 'mobile' : isTablet ? 'tablet' : 'desktop',
          browser: getBrowser(ua),
          os: getOS(ua),
          screen_width: window.screen.width,
          screen_height: window.screen.height,
          user_agent: ua,
          ...(variantPref ? { variant_name: variantPref } : {}),
        })
        sessionRef.current = sessionRes.data
        setPhase('consent')
      } catch (err) {
        setError(err.response?.data?.detail || 'Study not found or no longer active.')
      }
    }
    init()
  }, [participantToken])

  useEffect(() => {
    // Track currently active block for associating recording chunks to a block (optional).
    currentBlockIdRef.current = study?.blocks?.[step]?.id ?? null
  }, [study, step])

  const uploadRecordingBlob = async (blob, recording_type, chunk_index) => {
    const sessionToken = sessionRef.current?.sessionToken
    if (!sessionToken) return
    if (!blob || blob.size === 0) return

    const form = new FormData()
    form.append('file', blob, `${recording_type}_chunk_${chunk_index}.webm`)
    form.append('recording_type', recording_type)
    form.append('chunk_index', String(chunk_index))

    // Optional: link chunk to the active block at upload time.
    if (currentBlockIdRef.current) form.append('block_id', currentBlockIdRef.current)

    uploadQueueRef.current = uploadQueueRef.current.then(() =>
      api.post(`/sessions/${sessionToken}/recording/`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).catch(() => {})

    return uploadQueueRef.current
  }

  const startRecording = async (consentPayload) => {
    const sessionToken = sessionRef.current?.sessionToken
    if (!sessionToken) return

    // Reset refs
    recordersRef.current = { screen: null, camera: null, audio: null }
    chunkIndexRef.current = { screen: 0, camera: 0, audio: 0 }

    const createRecorder = (stream, candidates) => {
      if (!window.MediaRecorder) return null
      // Pick the first supported mimeType; fallback to default constructor.
      const mimeType = (candidates || []).find((t) => MediaRecorder.isTypeSupported?.(t))
      return mimeType ? new MediaRecorder(stream, { mimeType }) : new MediaRecorder(stream)
    }

    const stopStreams = (streams = []) => {
      streams.forEach((s) => s?.getTracks?.().forEach((t) => t.stop()))
    }

    try {
      if (consentPayload?.screen_recording) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        })
        if (screenVideoRef.current) {
          screenVideoRef.current.srcObject = screenStream
          screenVideoRef.current.play().catch(() => {})
        }
        const recorder = createRecorder(screenStream, ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'])
        if (!recorder) return
        recorder.ondataavailable = async (ev) => {
          const idx = chunkIndexRef.current.screen++
          await uploadRecordingBlob(ev.data, 'screen', idx)
        }
        recorder.start(5000) // chunk every 5s
        recordersRef.current.screen = { recorder, stream: screenStream }
      }

      if (consentPayload?.camera) {
        const cameraStream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        })
        if (cameraVideoRef.current) {
          cameraVideoRef.current.srcObject = cameraStream
          cameraVideoRef.current.play().catch(() => {})
        }
        const recorder = createRecorder(cameraStream, ['video/webm;codecs=vp9', 'video/webm', 'video/mp4'])
        if (!recorder) return
        recorder.ondataavailable = async (ev) => {
          const idx = chunkIndexRef.current.camera++
          await uploadRecordingBlob(ev.data, 'camera', idx)
        }
        recorder.start(5000)
        recordersRef.current.camera = { recorder, stream: cameraStream }
      }

      if (consentPayload?.audio) {
        const audioStream = await navigator.mediaDevices.getUserMedia({
          video: false,
          audio: true,
        })
        const recorder = createRecorder(audioStream, ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg'])
        if (!recorder) return
        recorder.ondataavailable = async (ev) => {
          const idx = chunkIndexRef.current.audio++
          await uploadRecordingBlob(ev.data, 'audio', idx)
        }
        recorder.start(5000)
        recordersRef.current.audio = { recorder, stream: audioStream }
      }
    } catch (e) {
      // If permissions are denied, still allow the study to run without recordings.
      stopStreams([
        recordersRef.current.screen?.stream,
        recordersRef.current.camera?.stream,
        recordersRef.current.audio?.stream,
      ])
    }
  }

  const stopRecording = async () => {
    const entries = Object.entries(recordersRef.current)
    for (const [, v] of entries) {
      try {
        if (v?.recorder && v.recorder.state !== 'inactive') {
          v.recorder.stop()
        }
      } catch {}
    }
    // Stop tracks after stopping recorders
    for (const [, v] of entries) {
      try {
        v?.stream?.getTracks?.().forEach((t) => t.stop())
      } catch {}
    }
    // Wait for queued uploads to finish
    await uploadQueueRef.current
    if (cameraVideoRef.current) cameraVideoRef.current.srcObject = null
    if (screenVideoRef.current) screenVideoRef.current.srcObject = null
  }

  useEffect(() => {
    // Cleanup on unmount to prevent camera/mic running.
    return () => {
      stopRecording()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConsent = async (consent) => {
    await api.post(`/sessions/${sessionRef.current.sessionToken}/consent/`, consent)
    setConsent(consent)
    setPhase('test')
    blockStartRef.current = Date.now()

    // Start recordings after consent is stored.
    // README notes recording isn't fully complete; this implements a minimal camera/audio/screen flow.
    await startRecording(consent)
  }

  const handleNext = async (response) => {
    const block = study.blocks[step]
    const timeSpent = Math.round((Date.now() - blockStartRef.current) / 1000)

    // Submit response if there's something to save
    if (response !== null && block.type !== 'intro' && block.type !== 'context' && block.type !== 'thankyou') {
      try {
        await api.post(`/sessions/${sessionRef.current.sessionToken}/response/`, {
          block_id: block.id,
          time_spent_seconds: timeSpent,
          ...response,
        })
      } catch (e) {
        console.error('Failed to save response', e)
      }
    }

    blockStartRef.current = Date.now()

    if (step >= study.blocks.length - 1) {
      // Complete
      await api.post(`/sessions/${sessionRef.current.sessionToken}/complete/`)
      // Stop recordings at the end of the study.
      await stopRecording()
      setPhase('done')
    } else {
      setStep(s => s + 1)
    }
  }

  if (error) return <ErrorScreen message={error} />
  if (phase === 'loading') return <LoadingScreen />

  if (phase === 'consent') {
    return <ConsentScreen studyTitle={study?.title} onAccept={handleConsent} />
  }

  if (phase === 'done') {
    // The last block (thank-you) already rendered - just in case
    return (
      <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mb-4 text-2xl">✓</div>
        <h1 className="text-2xl font-bold text-ink-900 mb-2">All done!</h1>
        <p className="text-ink-500">Thank you for participating. You can close this window.</p>
      </div>
    )
  }

  const block = study.blocks[step]

  return (
    <div className="min-h-screen bg-surface-50 flex flex-col">
      {phase === 'test' && consent && (consent.camera || consent.screen_recording) && (
        <div className="w-full bg-white border-b border-surface-200 px-4 py-3">
          <div className="flex items-center gap-3 flex-wrap">
            <div className="text-xs text-ink-500">Recording preview (camera/screen):</div>
            {consent.camera && (
              <video
                ref={cameraVideoRef}
                muted
                playsInline
                className="w-32 h-20 rounded border border-surface-200 bg-black"
              />
            )}
            {consent.screen_recording && (
              <video
                ref={screenVideoRef}
                muted
                playsInline
                className="w-48 h-20 rounded border border-surface-200 bg-black"
              />
            )}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="h-1 bg-surface-200 fixed top-0 left-0 right-0 z-50">
        <div
          className="h-full bg-brand-500 transition-all duration-500"
          style={{ width: `${((step + 1) / study.blocks.length) * 100}%` }}
        />
      </div>

      <div className="flex-1 flex flex-col pt-1">
        <BlockRenderer
          block={block}
          onNext={handleNext}
          session={sessionRef.current}
        />
      </div>

      {/* Branding */}
      <footer className="text-center py-4">
        <div className="inline-flex items-center gap-1.5 text-ink-200 text-xs">
          <Layers size={11} />
          <span>Powered by InsightLab</span>
        </div>
      </footer>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-8 h-8 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-ink-500 text-sm">Loading study…</span>
      </div>
    </div>
  )
}

function ErrorScreen({ message }) {
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center p-8 text-center">
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mb-4 text-xl">✕</div>
      <h2 className="text-xl font-bold text-ink-900 mb-2">Study unavailable</h2>
      <p className="text-ink-500 text-sm max-w-sm">{message}</p>
    </div>
  )
}

function getBrowser(ua) {
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Safari')) return 'Safari'
  if (ua.includes('Edge')) return 'Edge'
  return 'Unknown'
}

function getOS(ua) {
  if (ua.includes('Windows')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Linux')) return 'Linux'
  return 'Unknown'
}
