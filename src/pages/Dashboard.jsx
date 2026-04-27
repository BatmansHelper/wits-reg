import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, TrendingUp, Zap, CheckCircle, Package } from 'lucide-react'
import { useOrders } from '../hooks/useOrders'
import { useAuth } from '../hooks/useAuth'
import { canCreateOrder } from '../utils/roleChecks'
import OrderCard from '../components/orders/OrderCard'
import Button from '../components/ui/Button'

function StatCard({ label, value, icon: Icon, accentColor, loading }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-shadow">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center mb-4"
        style={{ backgroundColor: accentColor + '18' }}
      >
        <Icon size={18} style={{ color: accentColor }} />
      </div>
      <p className="text-4xl font-bold text-gray-900 tabular-nums">
        {loading ? '—' : value}
      </p>
      <p className="text-sm text-gray-400 mt-1.5 font-medium">{label}</p>
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
    const completed = orders.filter(o => o.status === 'completed').length
    return { active, awaitingAction, completed }
  }, [orders, userDoc])

  const sorted = useMemo(() => {
    return [...orders].sort((a, b) => {
      const aAction = needsAction(a, userDoc) ? 1 : 0
      const bAction = needsAction(b, userDoc) ? 1 : 0
      if (bAction !== aAction) return bAction - aAction
      return (b.updatedAt?.seconds || 0) - (a.updatedAt?.seconds || 0)
    })
  }, [orders, userDoc])

  const firstName = userDoc?.displayName?.split(' ')[0] || null

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-end justify-between mb-10">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">WROP</p>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            {firstName ? `Welcome back, ${firstName}` : 'Dashboard'}
          </h1>
        </div>
        {canCreate && (
          <Button as={Link} to="/orders/new">
            <Plus size={16} />
            New Order
          </Button>
        )}
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-10">
        <StatCard
          label="Active orders"
          value={stats.active}
          icon={TrendingUp}
          accentColor="#003DA5"
          loading={loading}
        />
        <StatCard
          label="Awaiting your action"
          value={stats.awaitingAction}
          icon={Zap}
          accentColor="#C9A84C"
          loading={loading}
        />
        <StatCard
          label="Completed"
          value={stats.completed}
          icon={CheckCircle}
          accentColor="#16a34a"
          loading={loading}
        />
      </div>

      {/* Orders section */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-gray-900">Orders</h2>
        {!loading && (
          <span className="text-sm text-gray-400 font-medium">
            {orders.length} {orders.length === 1 ? 'order' : 'orders'}
          </span>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-20">
          <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-16 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mx-auto mb-4">
            <Package size={24} className="text-gray-300" />
          </div>
          <p className="text-gray-500 font-medium">No orders yet</p>
          {canCreate && (
            <Link to="/orders/new" className="mt-3 inline-block text-sm text-wits-blue hover:underline font-semibold">
              Create the first order →
            </Link>
          )}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {sorted.map(order => (
          <OrderCard key={order.id} order={order} userDoc={userDoc} />
        ))}
      </div>
    </div>
  )
}
