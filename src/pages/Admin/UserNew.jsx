import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { createUserDoc, getUniversities } from '../../lib/firestore'
import { createAuthUser } from '../../lib/auth'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'super_admin', label: 'Super Admin' },
  { value: 'admin', label: 'Admin' },
  { value: 'viewer', label: 'Viewer' },
]

export default function UserNew() {
  const { userDoc } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState([])
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const selectedRole = watch('role')
  const needsUniversity = selectedRole === 'viewer'

  useEffect(() => {
    getUniversities().then(setUniversities)
  }, [])

  async function onSubmit(data) {
    setLoading(true)
    try {
      const uid = await createAuthUser(data.email)
      await createUserDoc(uid, {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        universityId: data.universityId || null,
        createdBy: userDoc.id,
      })
      toast.success(`User "${data.displayName}" created — password setup email sent to ${data.email}`)
      navigate('/admin/users')
    } catch (err) {
      console.error(err)
      if (err.code === 'auth/email-already-in-use') {
        toast.error('A user with this email already exists')
      } else {
        toast.error('Failed to create user')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-xl font-medium text-gray-900 mb-6">New User</h1>

      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg border border-border-default p-6 space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Full name</label>
          <input
            {...register('displayName', { required: 'Name is required' })}
            className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
            placeholder="Jane Smith"
          />
          {errors.displayName && <p className="mt-1 text-xs text-danger">{errors.displayName.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            type="email"
            {...register('email', { required: 'Email is required' })}
            className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
            placeholder="jane@university.ac.za"
          />
          {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
          <select
            {...register('role', { required: 'Select a role' })}
            className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
          >
            <option value="">Select role</option>
            {ROLES.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          {errors.role && <p className="mt-1 text-xs text-danger">{errors.role.message}</p>}
        </div>

        {needsUniversity && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
            <select
              {...register('universityId', { required: needsUniversity ? 'Select a university for this viewer' : false })}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
            >
              <option value="">Select university</option>
              {universities.map(u => (
                <option key={u.id} value={u.id}>{u.name}</option>
              ))}
            </select>
            {errors.universityId && <p className="mt-1 text-xs text-danger">{errors.universityId.message}</p>}
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading}>Create user</Button>
        </div>
      </form>
    </div>
  )
}
