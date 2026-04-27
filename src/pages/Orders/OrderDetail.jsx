import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, FileText } from 'lucide-react'
import { useOrder, useOrderActivity } from '../../hooks/useOrder'
import { useAuth } from '../../hooks/useAuth'
import StepTracker from '../../components/orders/StepTracker'
import StepPanel from '../../components/orders/StepPanel'
import OrderItemsTable from '../../components/orders/OrderItemsTable'
import Badge from '../../components/ui/Badge'
import { formatDate, formatDateTime, formatRelative, STATUS_LABELS, ROLE_LABELS } from '../../utils/formatters'

function ActivityItem({ item }) {
  return (
    <div className="flex gap-3 py-3 border-b border-border-default last:border-0">
      <div className="w-7 h-7 rounded-full bg-wits-blue-light flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-xs font-medium text-wits-blue">
          {(item.performedByName || '?').charAt(0).toUpperCase()}
        </span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-gray-900">{item.message}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.timestamp)}</p>
      </div>
    </div>
  )
}

export default function OrderDetail() {
  const { orderId } = useParams()
  const navigate = useNavigate()
  const { userDoc } = useAuth()
  const { order, loading, error } = useOrder(orderId)
  const { activity } = useOrderActivity(orderId)
  const [activeStepIndex, setActiveStepIndex] = useState(null)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-4 border-wits-blue border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <p className="text-danger">{error || 'Order not found'}</p>
      </div>
    )
  }

  const displayStepIndex = activeStepIndex ?? order.currentStepIndex

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors"
      >
        <ChevronLeft size={16} />
        Back
      </button>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
            <Badge label={STATUS_LABELS[order.status] || order.status} variant={order.status} />
          </div>
          <h1 className="text-xl font-medium text-gray-900 mt-1">{order.title}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{order.facultyName} · {order.universityName}</p>
        </div>
      </div>

      {/* Step tracker */}
      {order.steps?.length > 0 && (
        <div className="bg-white rounded-lg border border-border-default p-5 mb-6">
          <h2 className="text-xs font-medium text-gray-500 mb-4 uppercase tracking-wider">Progress</h2>
          <div className="flex items-center gap-3">
            <StepTracker
              steps={order.steps}
              currentStepIndex={order.currentStepIndex}
              onStepClick={i => setActiveStepIndex(i === activeStepIndex ? null : i)}
            />
          </div>
          <div className="mt-4 flex items-center gap-4">
            {order.steps.map((step, i) => (
              <button
                key={i}
                onClick={() => setActiveStepIndex(i === activeStepIndex ? null : i)}
                className={`text-xs transition-colors ${
                  i === displayStepIndex ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'
                }`}
              >
                {step.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: step panel */}
        <div className="lg:col-span-2 space-y-4">
          <StepPanel order={order} stepIndex={displayStepIndex} />
        </div>

        {/* Sidebar: order info */}
        <div className="space-y-4">
          {/* Order info card */}
          <div className="bg-white rounded-lg border border-border-default p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Order info</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-gray-500">PO Number</dt>
                <dd className="font-medium text-gray-900">{order.poNumber || '—'}</dd>
              </div>
              <div>
                <dt className="text-gray-500">Created</dt>
                <dd className="text-gray-900">{formatDate(order.createdAt)}</dd>
              </div>
              {order.estimatedDelivery && (
                <div>
                  <dt className="text-gray-500">Est. delivery</dt>
                  <dd className="flex items-center gap-1 text-gray-900">
                    <Clock size={13} />
                    {formatDate(order.estimatedDelivery)}
                  </dd>
                </div>
              )}
              {order.poDocumentUrl && (
                <div>
                  <a
                    href={order.poDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-wits-blue hover:underline text-sm"
                  >
                    <FileText size={14} />
                    View PO document
                  </a>
                </div>
              )}
            </dl>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-lg border border-border-default p-5">
            <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Items</h3>
            <OrderItemsTable items={order.orderItems} />
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-lg border border-border-default p-5">
              <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">Notes</h3>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="mt-6 bg-white rounded-lg border border-border-default p-5">
        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">Activity log</h3>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400">No activity yet.</p>
        ) : (
          <div>
            {activity.map(item => (
              <ActivityItem key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
