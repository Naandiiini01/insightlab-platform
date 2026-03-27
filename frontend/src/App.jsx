import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { useAuthStore } from './store/authStore'

// Pages
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import StudyBuilderPage from './pages/StudyBuilderPage'
import StudyResultsPage from './pages/StudyResultsPage'
import ParticipantPage from './pages/ParticipantPage'
import ReportPage from './pages/ReportPage'
import NotFoundPage from './pages/NotFoundPage'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            fontFamily: 'Sora, sans-serif',
            fontSize: '14px',
            borderRadius: '10px',
            border: '1px solid #e4e7f0',
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
          },
        }}
      />
      <Routes>
        {/* Auth */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        {/* Researcher routes (protected) */}
        <Route path="/" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
        <Route path="/studies/:studyId/build" element={<PrivateRoute><StudyBuilderPage /></PrivateRoute>} />
        <Route path="/studies/:studyId/results" element={<PrivateRoute><StudyResultsPage /></PrivateRoute>} />
        <Route path="/studies/:studyId/report" element={<PrivateRoute><ReportPage /></PrivateRoute>} />

        {/* Public participant route */}
        <Route path="/t/:participantToken" element={<ParticipantPage />} />

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  )
}
