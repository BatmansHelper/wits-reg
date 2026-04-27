import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useOrders } from '../../hooks/useOrders'
import { useAuth } from '../../hooks/useAuth'
import { canCreateOrder } from '../../utils/roleChecks'
import OrderCard from '../../components/orders/OrderCard'
import Button from '../../components/ui/Button'

const STATUS_FILTERS = [
  { label: 'All', value: undefined },
  { label: 'Active', value: 'active' },
  { label: 'Completed', value: 'completed' },
  { label: 'On hold', value: 'on_hold' },
]

export default function OrdersList() {
  const { userDoc } = useAuth()
  const [statusFilter, setStatusFilter] = useState(undefined)
  const { orders, loading } = useOrders(statusFilter)
  const canCreate = canCreateOrder(userDoc)

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl font-medium text-gray-900">Orders</h1>
        {canCreate && (
          <Link to="/orders/new">
            <Button>
              <Plus size={16} />
              New Order
            </Button>
          </Link>
        )}
      </div>

      {/* Status filter tabs */}
      <div className="flex gap-1 mb-5 bg-white border border-border-default rounded-lg p-1 w-fit">
        {STATUS_FILTERS.map(f => (
          <button
            key={String(f.value)}
            onClick={() => setStatusFilter(f.value)}
            className={`px-3 py-1.5 text-sm rounded transition-colors ${
              statusFilter === f.value
                ? 'bg-wits-blue text-white'
                : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-lg border border-border-default p-12 text-center">
          <p className="text-gray-500">No orders found.</p>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {orders.map(order => (
          <OrderCard key={order.id} order={order} userDoc={userDoc} />
        ))}
      </div>
    </div>
  )
}
