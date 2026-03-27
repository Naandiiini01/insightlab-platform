import { useState } from 'react'
import { Monitor, Camera, Mic, Shield } from 'lucide-react'

export default function ConsentScreen({ studyTitle, onAccept }) {
  const [consent, setConsent] = useState({
    screen_recording: false,
    camera: false,
    audio: false,
  })

  const toggle = k => setConsent(c => ({ ...c, [k]: !c[k] }))

  const ITEMS = [
    { key: 'screen_recording', Icon: Monitor, label: 'Screen Recording', desc: 'We will record your screen during tasks so we can see how you interact with the interface.' },
    { key: 'camera',           Icon: Camera,  label: 'Camera (optional)', desc: 'Your facial reactions may be recorded to better understand your experience.' },
    { key: 'audio',            Icon: Mic,     label: 'Microphone (optional)', desc: 'You can think aloud during the study and we will record your commentary.' },
  ]

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="w-12 h-12 rounded-xl bg-brand-50 flex items-center justify-center mb-6">
          <Shield size={24} className="text-brand-600" />
        </div>

        <h1 className="text-2xl font-bold text-ink-900 mb-2">Before we begin</h1>
        <p className="text-ink-500 mb-1 text-sm">
          You're about to start: <strong className="text-ink-700">{studyTitle}</strong>
        </p>
        <p className="text-ink-400 text-sm mb-6">
          Please review what data we'd like to collect. You can opt out of optional recordings below.
        </p>

        <div className="space-y-3 mb-8">
          {ITEMS.map(({ key, Icon, label, desc }) => (
            <div
              key={key}
              onClick={() => toggle(key)}
              className={`card p-4 cursor-pointer transition-all border-2 ${
                consent[key] ? 'border-brand-400 bg-brand-50/30' : 'border-surface-200'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  consent[key] ? 'bg-brand-600 text-white' : 'bg-surface-100 text-ink-400'
                }`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-ink-900 text-sm">{label}</span>
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                      consent[key] ? 'bg-brand-600 border-brand-600' : 'border-ink-300'
                    }`}>
                      {consent[key] && <span className="text-white text-[10px]">✓</span>}
                    </div>
                  </div>
                  <p className="text-xs text-ink-400 mt-1">{desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <p className="text-xs text-ink-300 mb-4 text-center">
          Your data is stored securely and only used for research purposes. You can stop at any time.
        </p>

        <button
          className="btn-primary w-full justify-center py-3 text-base"
          onClick={() => onAccept(consent)}
        >
          I agree, start the study
        </button>
      </div>
    </div>
  )
}
