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
    <header className="h-11 bg-wits-blue border-b border-white/10 flex items-center justify-end px-6 flex-shrink-0 gap-4">
      <span className="text-sm text-white/60">{userDoc?.email}</span>
      <button
        onClick={handleSignOut}
        className="flex items-center gap-1.5 text-sm text-white/60 hover:text-white transition-colors"
      >
        <LogOut size={14} />
        Sign out
      </button>
    </header>
  )
}
