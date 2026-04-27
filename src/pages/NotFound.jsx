import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-surface">
      <div className="text-center">
        <p className="text-6xl font-medium text-gray-200 mb-4">404</p>
        <p className="text-gray-600 mb-6">Page not found</p>
        <Link to="/dashboard" className="text-sm text-wits-blue hover:underline">
          Back to dashboard →
        </Link>
      </div>
    </div>
  )
}
