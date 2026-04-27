import { useNavigate } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { signOut } from '../../lib/auth'
import { useAuth } from '../../hooks/useAuth'
import toast from 'react-hot-toast'

export default function Topbar() {
  const { userDoc } = useAuth()
  const navigate = useNavigate()

  async function handleSignOut() {
    try {
      await signOut()
      navigate('/login')
    } catch {
      toast.error('Failed to sign out')
    }
  }

  return (
    <header className="h-14 bg-white border-b border-border-default flex items-center justify-between px-6 flex-shrink-0">
      <div />
      <div className="flex items-center gap-4">
        <span className="text-sm text-gray-500">{userDoc?.email}</span>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
        >
          <LogOut size={15} />
          Sign out
        </button>
      </div>
    </header>
  )
}
