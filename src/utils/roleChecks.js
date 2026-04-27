export function canApproveStep(userDoc, step) {
  if (!userDoc || !step) return false
  return step.allowedApprovers?.includes(userDoc.role)
}

export function canUploadToStep(userDoc, step) {
  if (!userDoc || !step) return false
  return step.allowedUploaders?.includes(userDoc.role)
}

export function canSkipStep(userDoc, step) {
  if (!userDoc || !step) return false
  return userDoc.role === 'super_admin' && step.canBeSkipped
}

export function canCreateOrder(userDoc) {
  return ['admin', 'super_admin'].includes(userDoc?.role)
}

export function canManageUsers(userDoc) {
  return userDoc?.role === 'super_admin'
}

export function canViewAllOrders(userDoc) {
  return ['super_admin', 'admin'].includes(userDoc?.role)
}

export function isSuperAdmin(userDoc) {
  return userDoc?.role === 'super_admin'
}

export function isAdmin(userDoc) {
  return ['admin', 'super_admin'].includes(userDoc?.role)
}

export function isViewer(userDoc) {
  return userDoc?.role === 'viewer'
}
