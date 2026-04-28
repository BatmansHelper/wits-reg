const VARIANTS = {
  // Order status
  active: 'bg-wits-blue-light text-wits-blue',
  completed: 'bg-success-bg text-success',
  delivered: 'bg-emerald-100 text-emerald-800',
  on_hold: 'bg-warning-bg text-warning',
  cancelled: 'bg-danger-bg text-danger',
  // Step status
  pending: 'bg-gray-100 text-gray-500',
  in_progress: 'bg-wits-blue-light text-wits-blue',
  awaiting_approval: 'bg-wits-gold-light text-warning',
  approved: 'bg-success-bg text-success',
  skipped: 'bg-gray-100 text-gray-400',
  rejected: 'bg-danger-bg text-danger',
  // Roles
  super_admin: 'bg-gray-900 text-white',
  admin: 'bg-wits-blue-light text-wits-blue',
  university_staff: 'bg-wits-blue-light text-wits-blue',
  production: 'bg-wits-gold-light text-warning',
}

export default function Badge({ label, variant, className = '' }) {
  const style = VARIANTS[variant] || 'bg-gray-100 text-gray-600'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${style} ${className}`}>
      {label}
    </span>
  )
}
