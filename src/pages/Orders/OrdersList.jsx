import { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Plus, Search, X } from 'lucide-react'
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
  const [search, setSearch] = useState('')
  const { orders, loading, error } = useOrders(statusFilter)
  const canCreate = canCreateOrder(userDoc)

  const filtered = useMemo(() => {
    if (!search.trim()) return orders
    const q = search.toLowerCase()
    return orders.filter(o =>
      o.title?.toLowerCase().includes(q) ||
      o.poNumber?.toLowerCase().includes(q) ||
      o.orderNumber?.toLowerCase().includes(q) ||
      o.universityName?.toLowerCase().includes(q) ||
      o.facultyName?.toLowerCase().includes(q)
    )
  }, [orders, search])

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Orders</h1>
        {canCreate && (
          <Link to="/orders/new">
            <Button>
              <Plus size={16} />
              New Order
            </Button>
          </Link>
        )}
      </div>

      {/* Search + filter row */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by title, PO number, university…"
            className="w-full pl-10 pr-9 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-wits-blue"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status filters */}
        <div className="flex gap-1 bg-white border border-gray-200 rounded-xl p-1 flex-shrink-0">
          {STATUS_FILTERS.map(f => (
            <button
              key={String(f.value)}
              onClick={() => setStatusFilter(f.value)}
              className={`px-3 py-1.5 text-sm rounded-lg transition-colors font-medium ${
                statusFilter === f.value
                  ? 'bg-wits-blue text-white'
                  : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Result count */}
      {!loading && !error && (
        <p className="text-sm text-gray-400 font-medium mb-4">
          {filtered.length} {filtered.length === 1 ? 'order' : 'orders'}
          {search && ` matching "${search}"`}
        </p>
      )}

      {loading && (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {!loading && error && (
        <div className="bg-danger-bg border border-danger/20 rounded-xl p-4 text-sm text-danger">
          <strong>Firestore error:</strong> {error}
        </div>
      )}

      {!loading && !error && filtered.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
          <p className="text-gray-500 font-medium">
            {search ? `No orders match "${search}"` : 'No orders found.'}
          </p>
          {search && (
            <button onClick={() => setSearch('')} className="mt-2 text-sm text-wits-blue hover:underline font-semibold">
              Clear search
            </button>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {filtered.map(order => (
          <OrderCard key={order.id} order={order} userDoc={userDoc} />
        ))}
      </div>
    </div>
  )
}
