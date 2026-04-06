import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import toast from 'react-hot-toast'
import { Layers } from 'lucide-react'
import { extractFieldErrors, formatApiError } from '../utils/apiErrors'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [errorBanner, setErrorBanner] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const { register } = useAuthStore()
  const navigate = useNavigate()

  const set = (k) => (e) => {
    setFieldErrors((fe) => {
      const next = { ...fe }
      delete next[k]
      return next
    })
    setErrorBanner('')
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorBanner('')
    setFieldErrors({})
    setLoading(true)
    try {
      await register(form.name, form.email, form.password)
      navigate('/')
      toast.success('Welcome to InsightLab!')
    } catch (err) {
      const data = err.response?.data
      const msg = formatApiError(err)
      setErrorBanner(msg)
      setFieldErrors(extractFieldErrors(data))
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface-50 flex items-center justify-center p-8">
      <div className="w-full max-w-sm">
        <div className="flex items-center gap-2 mb-8">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center">
            <Layers size={16} className="text-white" />
          </div>
          <span className="font-semibold text-ink-900">InsightLab</span>
        </div>
        <h2 className="text-2xl font-bold text-ink-900 mb-1">Create your account</h2>
        <p className="text-ink-500 mb-8">Start building usability studies today</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {errorBanner ? (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800"
            >
              {errorBanner}
            </div>
          ) : null}
          <div>
            <label className="label">Full name</label>
            <input
              className={`input ${fieldErrors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
              type="text"
              placeholder="Alex Johnson"
              value={form.name}
              onChange={set('name')}
              required
              aria-invalid={!!fieldErrors.name}
            />
            {fieldErrors.name ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p>
            ) : null}
          </div>
          <div>
            <label className="label">Work email</label>
            <input
              className={`input ${fieldErrors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
              type="email"
              placeholder="alex@company.com"
              value={form.email}
              onChange={set('email')}
              required
              aria-invalid={!!fieldErrors.email}
            />
            {fieldErrors.email ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
            ) : null}
          </div>
          <div>
            <label className="label">Password</label>
            <input
              className={`input ${fieldErrors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
              type="password"
              placeholder="Min. 8 characters"
              value={form.password}
              onChange={set('password')}
              minLength={8}
              required
              aria-invalid={!!fieldErrors.password}
            />
            {fieldErrors.password ? (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
            ) : null}
          </div>
          <button className="btn-primary w-full justify-center py-2.5" disabled={loading}>
            {loading ? 'Creating account…' : 'Create free account'}
          </button>
        </form>

        <p className="text-center text-xs text-ink-300 mt-4">
          By signing up you agree to our Terms of Service and Privacy Policy.
        </p>
        <p className="text-center text-sm text-ink-500 mt-4">
          Already have an account?{' '}
          <Link to="/login" className="text-brand-600 font-medium hover:underline">Sign in</Link>
        </p>
      </div>
    </div>
  )
}
