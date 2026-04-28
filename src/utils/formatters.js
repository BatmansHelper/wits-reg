import { format, formatDistanceToNow } from 'date-fns'

export function formatDate(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'd MMM yyyy')
}

export function formatDateTime(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return format(date, 'd MMM yyyy, HH:mm')
}

export function formatRelative(timestamp) {
  if (!timestamp) return '—'
  const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp)
  return formatDistanceToNow(date, { addSuffix: true })
}

export function formatFileSize(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export const ROLE_LABELS = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  viewer: 'Viewer',
}

export const STATUS_LABELS = {
  active: 'Active',
  completed: 'Completed',
  delivered: 'Delivered',
  on_hold: 'On Hold',
  cancelled: 'Cancelled',
}

export const STEP_STATUS_LABELS = {
  pending: 'Pending',
  in_progress: 'In Progress',
  awaiting_approval: 'Awaiting Approval',
  approved: 'Approved',
  skipped: 'Skipped',
  rejected: 'Rejected',
}
