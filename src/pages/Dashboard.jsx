import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import { canCreateOrder } from '../utils/roleChecks'
import OrderCard from '../components/orders/OrderCard'
import Button from '../components/ui/Button'

function StatCard({ label, value, accentColour, loading }) {
  return (
    <div
      className="bg-white rounded-lg border border-border-default p-5"
      style={{ borderTop: `3px solid ${accentColour}` }}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="text-3xl font-medium text-gray-900 mt-1">
        {loading ? '—' : value}
      </p>
    </div>
  )
}

function needsAction(order, userDoc) {
  if (!order.steps || !userDoc) return false
  const step = order.steps[order.currentStepIndex]
  if (!step) return false
  if (step.status === 'awaiting_approval' && step.allowedApprovers?.includes(userDoc.role)) return true
  if (step.status === 'in_progress' && step.allowedUploaders?.includes(userDoc.role)) return true
  return false
}

export default function Dashboard() {
  const { userDoc } = useAuth()
  const { orders, loading } = useOrders()
  const canCreate = canCreateOrder(userDoc)

  const stats = useMemo(() => {
    const active = orders.filter(o => o.status === 'active').length
    const awaitingAction = orders.filter(o => needsAction(o, userDoc)).length
    const inProduction = orders.filter(o => {
      const step = o.steps?.[o.currentStepIndex]
      return o.status === 'active' && (step?.title?.toLowerCase().includes('fabric') || step?.title?.toLowerCase().includes('print'))
    }).length
    const completed = orders.filter(o => o.status === 'completed').length
    return { active, awaitingAction, inProduction, completed }
  }, [orders, userDoc])

  // Sort: action-needed first, then by updatedAt
  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aAction = needsAction(a, userDoc) ? 1 : 0
      const bAction = needsAction(b, userDoc) ? 1 : 0
      if (bAction !== aAction) return bAction - aAction
      const aTime = a.updatedAt?.seconds || 0
      const bTime = b.updatedAt?.seconds || 0
      return bTime - aTime
    })
  }, [orders, userDoc])

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Dashboard</h1>
        {canCreate && (
          <Button as={Link} to="/orders/new">
            <Plus size={16} />
            New Order
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Active orders" value={stats.active} accentColour="#003DA5" loading={loading} />
        <StatCard label="Awaiting your action" value={stats.awaitingAction} accentColour="#C9A84C" loading={loading} />
        <StatCard label="In production" value={stats.inProduction} accentColour="#003DA5" loading={loading} />
        <StatCard label="Completed" value={stats.completed} accentColour="#3B6D11" loading={loading} />
      </div>

      {/* Order list */}
      <h2 className="text-sm font-medium text-gray-700 mb-3">
        {loading ? 'Loading orders…' : `${orders.length} order${orders.length !== 1 ? 's' : ''}`}
      </h2>

      {!loading && sorted.length === 0 && (
        <div className="bg-white rounded-lg border border-border-default p-12 text-center">
          <p className="text-gray-500">No orders yet.</p>
          {canCreate && (
            <Link to="/orders/new" className="mt-4 inline-block text-sm text-wits-blue hover:underline">
              Create the first order →
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-3">
        {sorted.map(order => (
          <OrderCard key={order.id} order={order} userDoc={userDoc} />
        ))}
      </div>
    </div>
  )
}
