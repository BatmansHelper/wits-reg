import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, FileText, ImageIcon, Package } from 'lucide-react'
import { useOrder, useOrderActivity } from '../../hooks/useOrder'
import { useAuth } from '../../hooks/useAuth'
import StepTracker from '../../components/orders/StepTracker'
import StepPanel from '../../components/orders/StepPanel'
import OrderItemsTable from '../../components/orders/OrderItemsTable'
import Badge from '../../components/ui/Badge'
import { formatDate, formatRelative, STATUS_LABELS } from '../../utils/formatters'

function ActivityItem({ item }) {
  const initials = (item.performedByName || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-0">
      <div className="w-8 h-8 rounded-full bg-wits-blue-light flex items-center justify-center flex-shrink-0">
        <span className="text-xs font-bold text-wits-blue">{initials}</span>
      </div>
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-gray-800">{item.message}</p>
        <p className="text-xs text-gray-400 mt-1">{formatRelative(item.timestamp)}</p>
      </div>
    </div>
  )
}

function InfoRow({ label, children }) {
  return (
    <div className="flex items-start justify-between gap-3 py-3 border-b border-gray-50 last:border-0">
      <span className="text-sm text-gray-400 font-medium flex-shrink-0">{label}</span>
      <span className="text-sm text-gray-900 font-semibold text-right">{children}</span>
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
      <div className="p-8">
        <p className="text-danger">{error || 'Order not found'}</p>
      </div>
    )
  }

  const displayStepIndex = activeStepIndex ?? order.currentStepIndex
  const totalSteps = order.steps?.length || 0
  const completedCount = order.steps?.filter(
    (s, i) => s.status === 'approved' || s.status === 'skipped' || i < order.currentStepIndex
  ).length || 0
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  return (
    <div className="p-8 max-w-6xl mx-auto">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-800 mb-6 transition-colors font-medium"
      >
        <ChevronLeft size={15} />
        Back
      </button>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2.5 flex-wrap mb-2">
          <span className="text-xs font-mono text-gray-400 tracking-wide">{order.orderNumber}</span>
          {order.poNumber && (
            <span className="text-xs font-mono bg-gray-100 text-gray-500 px-2 py-0.5 rounded-md">
              {order.poNumber}
            </span>
          )}
          <Badge label={STATUS_LABELS[order.status] || order.status} variant={order.status} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{order.title}</h1>
        <p className="text-sm text-gray-400 mt-1 font-medium">{order.facultyName} · {order.universityName}</p>
      </div>

      {/* Step progress card */}
      {order.steps?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Progress</p>
              <p className="text-sm font-semibold text-gray-700">
                {completedCount} of {totalSteps} steps complete
              </p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-gray-900 tabular-nums">{progressPct}%</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 bg-gray-100 rounded-full mb-6 overflow-hidden">
            <div
              className="h-full bg-wits-blue rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <StepTracker
            steps={order.steps}
            currentStepIndex={order.currentStepIndex}
            onStepClick={i => setActiveStepIndex(i === activeStepIndex ? null : i)}
            showLabels
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main: step panel */}
        <div className="lg:col-span-2 space-y-4">
          <StepPanel order={order} stepIndex={displayStepIndex} />
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order info */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Order info</p>
            <div className="mt-3">
              <InfoRow label="PO Number">{order.poNumber || '—'}</InfoRow>
              <InfoRow label="Created">{formatDate(order.createdAt)}</InfoRow>
              {order.estimatedDelivery && (
                <InfoRow label="Est. delivery">
                  <span className="flex items-center gap-1 justify-end">
                    <Clock size={12} />
                    {formatDate(order.estimatedDelivery)}
                  </span>
                </InfoRow>
              )}
              {order.poDocumentUrl && (
                <div className="pt-3">
                  <a
                    href={order.poDocumentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-sm text-wits-blue hover:underline font-semibold"
                  >
                    <FileText size={14} />
                    View PO document
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Order items */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Items</p>
            <OrderItemsTable items={order.orderItems} />
          </div>

          {/* Reference images */}
          {order.referenceImages?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">Reference Images</p>
              <div className="grid grid-cols-2 gap-2">
                {order.referenceImages.map((img, i) => (
                  img.fileType === 'image' ? (
                    <a key={i} href={img.url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={img.url}
                        alt={img.name}
                        className="w-full h-24 object-cover rounded-xl border border-gray-100 hover:opacity-80 transition-opacity"
                      />
                    </a>
                  ) : (
                    <a
                      key={i}
                      href={img.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 p-3 border border-gray-100 rounded-xl text-xs text-wits-blue hover:bg-gray-50 transition-colors"
                    >
                      <ImageIcon size={14} />
                      <span className="truncate font-medium">{img.name}</span>
                    </a>
                  )
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {order.notes && (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
              <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-3">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity log */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-1">Activity log</p>
        <p className="text-sm font-semibold text-gray-700 mb-4">
          {activity.length} {activity.length === 1 ? 'event' : 'events'}
        </p>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 py-4">No activity yet.</p>
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
