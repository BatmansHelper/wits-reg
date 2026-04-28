import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Clock, FileText, ImageIcon } from 'lucide-react'
import { useOrder, useOrderActivity } from '../../hooks/useOrder'
import { useAuth } from '../../hooks/useAuth'
import StepTracker from '../../components/orders/StepTracker'
import StepPanel from '../../components/orders/StepPanel'
import OrderItemsTable from '../../components/orders/OrderItemsTable'
import Badge from '../../components/ui/Badge'
import { formatDate, formatRelative, STATUS_LABELS } from '../../utils/formatters'

function ActivityRow({ item }) {
  const initials = (item.performedByName || '?')
    .split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  return (
    <tr className="border-b border-gray-50 last:border-0 group hover:bg-gray-50/40 transition-colors">
      <td className="py-3 pr-6 align-top whitespace-nowrap">
        <span className="text-xs font-medium text-gray-400">{formatDate(item.timestamp)}</span>
      </td>
      <td className="py-3 pr-6 align-top">
        <p className="text-sm text-gray-800">{item.message}</p>
        <p className="text-xs text-gray-400 mt-0.5">{formatRelative(item.timestamp)}</p>
      </td>
      <td className="py-3 align-top">
        <div className="flex items-center gap-2 justify-end">
          <span className="text-xs text-gray-400 whitespace-nowrap hidden sm:block">{item.performedByName}</span>
          <div className="w-6 h-6 rounded-full bg-wits-blue-light flex items-center justify-center flex-shrink-0">
            <span className="text-[9px] font-bold text-wits-blue">{initials}</span>
          </div>
        </div>
      </td>
    </tr>
  )
}

function SectionLabel({ children }) {
  return (
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mb-4">{children}</p>
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

      {/* Header — PO prominent above title */}
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div>
            {order.poNumber && (
              <p className="text-2xl font-bold text-wits-blue tracking-tight">{order.poNumber}</p>
            )}
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight mt-0.5">{order.title}</h1>
            <p className="text-sm text-gray-400 mt-1 font-medium">{order.facultyName} · {order.universityName}</p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 mt-1">
            <Badge label={STATUS_LABELS[order.status] || order.status} variant={order.status} />
            <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
          </div>
        </div>
      </div>

      {/* Step progress card */}
      {order.steps?.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <SectionLabel>Progress</SectionLabel>
              <p className="text-sm font-semibold text-gray-700 -mt-2">
                {completedCount} of {totalSteps} steps complete
              </p>
            </div>
            <p className="text-4xl font-bold text-gray-900 tabular-nums">{progressPct}%</p>
          </div>

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
        {/* Main column */}
        <div className="lg:col-span-2 space-y-4">
          <StepPanel order={order} stepIndex={displayStepIndex} />

          {/* Order items — below step panel, same width */}
          {order.orderItems?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <SectionLabel>Items</SectionLabel>
              <OrderItemsTable items={order.orderItems} />
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Order info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <SectionLabel>Order info</SectionLabel>
            <dl className="space-y-0 divide-y divide-gray-50">
              <div className="flex items-center justify-between py-2.5">
                <dt className="text-sm text-gray-400">Created</dt>
                <dd className="text-sm font-semibold text-gray-900">{formatDate(order.createdAt)}</dd>
              </div>
              {order.estimatedDelivery && (
                <div className="flex items-center justify-between py-2.5">
                  <dt className="text-sm text-gray-400">Est. delivery</dt>
                  <dd className="flex items-center gap-1 text-sm font-semibold text-gray-900">
                    <Clock size={12} />
                    {formatDate(order.estimatedDelivery)}
                  </dd>
                </div>
              )}
              {order.poDocumentUrl && (
                <div className="py-2.5">
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
            </dl>
          </div>

          {/* Reference images */}
          {order.referenceImages?.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <SectionLabel>Reference Images</SectionLabel>
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
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
              <SectionLabel>Notes</SectionLabel>
              <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{order.notes}</p>
            </div>
          )}
        </div>
      </div>

      {/* Activity log — table style like movement history */}
      <div className="mt-6 bg-white rounded-2xl border border-gray-200 p-6">
        <div className="flex items-baseline gap-3 mb-5">
          <SectionLabel>Activity log</SectionLabel>
          {activity.length > 0 && (
            <span className="text-xs font-semibold text-gray-400 -mt-3 mb-4">
              {activity.length} events
            </span>
          )}
        </div>
        {activity.length === 0 ? (
          <p className="text-sm text-gray-400 py-2">No activity yet.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 pr-6 w-28">Date</th>
                <th className="pb-2 text-left text-xs font-semibold text-gray-400 pr-6">Action</th>
                <th className="pb-2 text-right text-xs font-semibold text-gray-400">By</th>
              </tr>
            </thead>
            <tbody>
              {activity.map(item => (
                <ActivityRow key={item.id} item={item} />
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
