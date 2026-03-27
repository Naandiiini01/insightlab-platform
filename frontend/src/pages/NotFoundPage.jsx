import { useNavigate } from 'react-router-dom'
export default function NotFoundPage() {
  const navigate = useNavigate()
  return (
    <div className="min-h-screen bg-surface-50 flex flex-col items-center justify-center text-center p-8">
      <p className="text-7xl font-black text-surface-200 mb-4">404</p>
      <h1 className="text-2xl font-bold text-ink-900 mb-2">Page not found</h1>
      <p className="text-ink-500 mb-6">The page you're looking for doesn't exist.</p>
      <button className="btn-primary" onClick={() => navigate('/')}>Go home</button>
    </div>
  )
}
