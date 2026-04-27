import { useEffect, useState } from 'react'
import { subscribeToOrder, subscribeToActivity } from '../lib/firestore'

export function useOrder(orderId) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!orderId) return

    const unsubscribe = subscribeToOrder(orderId, snapshot => {
      if (snapshot.exists()) {
        setOrder({ id: snapshot.id, ...snapshot.data() })
      } else {
        setError('Order not found')
      }
      setLoading(false)
    })

    return unsubscribe
  }, [orderId])

  return { order, loading, error }
}

export function useOrderActivity(orderId) {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) return

    const unsubscribe = subscribeToActivity(orderId, snapshot => {
      setActivity(snapshot.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })

    return unsubscribe
  }, [orderId])

  return { activity, loading }
}
