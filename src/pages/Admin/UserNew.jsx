import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../hooks/useAuth'
import { createUserDoc, getUniversities, getAllFaculties } from '../../lib/firestore'
import Button from '../../components/ui/Button'
import toast from 'react-hot-toast'

const ROLES = [
  { value: 'admin', label: 'University Admin' },
  { value: 'university_staff', label: 'University Staff' },
  { value: 'production', label: 'Distinctive Choice (Production)' },
  { value: 'super_admin', label: 'Super Admin' },
]

export default function UserNew() {
  const { userDoc } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [universities, setUniversities] = useState([])
  const [faculties, setFaculties] = useState([])
  const { register, handleSubmit, watch, formState: { errors } } = useForm()

  const selectedUniId = watch('universityId')

  useEffect(() => {
    Promise.all([getUniversities(), getAllFaculties()])
      .then(([unis, facs]) => { setUniversities(unis); setFaculties(facs) })
  }, [])

  const filteredFaculties = faculties.filter(f => f.universityId === selectedUniId)

  async function onSubmit(data) {
    setLoading(true)
    try {
      // NOTE: Creating a Firebase Auth user requires Firebase Admin SDK (Cloud Functions).
      // For now, create the Firestore user doc. In production, this calls a Cloud Function
      // that creates the Auth user and sends the password reset email.
      const uid = `pending_${Date.now()}`
      await createUserDoc(uid, {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        universityId: data.universityId || null,
        facultyId: data.facultyId || null,
        createdBy: userDoc.id,
      })
      toast.success(`User "${data.displayName}" created. Set up Firebase Auth manually or via Cloud Function.`)
      navigate('/admin/users')
    } catch (err) {
      console.error(err)
      toast.error('Failed to create user')
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">University</label>
          <select
            {...register('universityId')}
            className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
          >
            <option value="">None / All universities</option>
            {universities.map(u => (
              <option key={u.id} value={u.id}>{u.name}</option>
            ))}
          </select>
        </div>

        {filteredFaculties.length > 0 && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Faculty (optional)</label>
            <select
              {...register('facultyId')}
              className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
            >
              <option value="">All faculties</option>
              {filteredFaculties.map(f => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" type="button" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={loading}>Create user</Button>
        </div>
      </form>

      <p className="text-xs text-gray-400 mt-4 text-center">
        A password reset email is sent automatically via Cloud Functions once Firebase Auth is configured.
      </p>
    </div>
  )
}
