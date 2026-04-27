import { useEffect, useState } from 'react'
import { subscribeToOrders } from '../lib/firestore'
import { useAuth } from './useAuth'
import { canViewAllOrders } from '../utils/roleChecks'

export function useOrders(statusFilter) {
  const { userDoc } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!userDoc) return

    const filters = {}
    if (!canViewAllOrders(userDoc)) {
      filters.universityId = userDoc.universityId
    }
    if (statusFilter) {
      filters.status = statusFilter
    }

    const unsubscribe = subscribeToOrders(filters, snapshot => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsubscribe
  }, [userDoc, statusFilter])

  return { orders, loading, error }
}
