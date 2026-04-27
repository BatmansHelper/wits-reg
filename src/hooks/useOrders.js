import { useEffect, useState } from 'react'
import { subscribeToOrders } from '../lib/firestore'
import { useAuth } from './useAuth'
import { canViewAllOrders } from '../utils/roleChecks'

export function useOrders(statusFilter) {
  const { userDoc, loading: authLoading } = useAuth()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (authLoading) return
    if (!userDoc) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

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
    }, err => {
      console.error('Orders subscription error:', err)
      setError(err.message)
      setLoading(false)
    })

    return unsubscribe
  }, [userDoc, authLoading, statusFilter])

  return { orders, loading, error }
}
