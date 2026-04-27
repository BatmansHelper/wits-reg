import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

export default function ProtectedRoute({ allowedRoles }) {
  const { user, userDoc, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-8 h-8 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) return <Navigate to="/login" replace />
  if (userDoc && !userDoc.isActive) return <Navigate to="/login" replace />

  if (allowedRoles && userDoc && !allowedRoles.includes(userDoc.role)) {
    return <Navigate to="/dashboard" replace />
  }

  // Outer wrapper: render with full layout
  if (!allowedRoles) {
    return (
      <div className="flex h-screen overflow-hidden bg-surface">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Topbar />
          <main className="flex-1 overflow-auto">
            <Outlet />
          </main>
        </div>
      </div>
    )
  }

  return <Outlet />
}
