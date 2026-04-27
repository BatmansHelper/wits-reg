import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { signIn } from '../lib/auth'
import Button from '../components/ui/Button'
import toast from 'react-hot-toast'

export default function Login() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm()

  async function onSubmit({ email, password }) {
    setLoading(true)
    try {
      await signIn(email, password)
      navigate('/dashboard', { replace: true })
    } catch (err) {
      const msg = err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found'
        ? 'Invalid email or password'
        : 'Sign in failed — please try again'
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-surface flex flex-col items-center justify-center">
      {/* Header bar */}
      <div className="w-full bg-wits-blue py-4 fixed top-0 left-0" />

      <div className="w-full max-w-sm mx-auto px-6 mt-8">
        {/* Wordmark */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-wits-blue rounded-xl mb-4">
            <span className="text-white font-medium text-lg">W</span>
          </div>
          <h1 className="text-2xl font-medium text-gray-900">WROP</h1>
          <p className="text-sm text-gray-500 mt-1">Order Process Portal</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl border border-border-default p-8 shadow-sm">
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
            <input
              type="email"
              autoComplete="email"
              {...register('email', { required: 'Email is required' })}
              className="w-full border border-border-default rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
              placeholder="you@university.ac.za"
            />
            {errors.email && <p className="mt-1 text-xs text-danger">{errors.email.message}</p>}
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
            <input
              type="password"
              autoComplete="current-password"
              {...register('password', { required: 'Password is required' })}
              className="w-full border border-border-default rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue"
            />
            {errors.password && <p className="mt-1 text-xs text-danger">{errors.password.message}</p>}
          </div>

          <Button type="submit" loading={loading} className="w-full justify-center">
            Sign in
          </Button>
        </form>

        <p className="text-center text-xs text-gray-400 mt-6">
          Access by invitation only. Contact your system administrator.
        </p>
      </div>
    </div>
  )
}
