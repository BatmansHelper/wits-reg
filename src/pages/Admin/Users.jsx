import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { UserPlus } from 'lucide-react'
import { getAllUsers, updateUserDoc } from '../../lib/firestore'
import Badge from '../../components/ui/Badge'
import Button from '../../components/ui/Button'
import { formatDate, ROLE_LABELS } from '../../utils/formatters'
import toast from 'react-hot-toast'

export default function Users() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getAllUsers()
      .then(u => { setUsers(u); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  async function toggleActive(user) {
    try {
      await updateUserDoc(user.id, { isActive: !user.isActive })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, isActive: !u.isActive } : u))
      toast.success(`User ${user.isActive ? 'deactivated' : 'activated'}`)
    } catch {
      toast.error('Failed to update user')
    }
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Users</h1>
        <Link to="/admin/users/new">
          <Button>
            <UserPlus size={16} />
            New user
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-border-default overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-gray-500 border-b border-border-default bg-surface">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">University</th>
                <th className="px-4 py-3 font-medium">Created</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id} className="border-b border-border-default last:border-0 hover:bg-surface/50">
                  <td className="px-4 py-3 font-medium text-gray-900">{user.displayName}</td>
                  <td className="px-4 py-3 text-gray-600">{user.email}</td>
                  <td className="px-4 py-3">
                    <Badge label={ROLE_LABELS[user.role] || user.role} variant={user.role} />
                  </td>
                  <td className="px-4 py-3 text-gray-600">{user.universityId || '—'}</td>
                  <td className="px-4 py-3 text-gray-500">{formatDate(user.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium ${user.isActive ? 'text-success' : 'text-danger'}`}>
                      {user.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive(user)}
                      className="text-xs text-gray-400 hover:text-gray-700"
                    >
                      {user.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                    No users yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
