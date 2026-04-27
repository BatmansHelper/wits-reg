import { useNavigate } from 'react-router-dom'
import { Clock, Package } from 'lucide-react'
import StepTracker from './StepTracker'
import Badge from '../ui/Badge'
import { formatDate, STATUS_LABELS } from '../../utils/formatters'

function needsAction(order, userDoc) {
  if (!order.steps || !userDoc) return false
  const step = order.steps[order.currentStepIndex]
  if (!step) return false
  if (step.status === 'awaiting_approval' && step.allowedApprovers?.includes(userDoc.role)) return true
  if (step.status === 'in_progress' && step.allowedUploaders?.includes(userDoc.role)) return true
  return false
}

export default function OrderCard({ order, userDoc }) {
  const navigate = useNavigate()
  const action = needsAction(order, userDoc)
  const currentStep = order.steps?.[order.currentStepIndex]

  const borderColor = action ? 'border-l-wits-gold' : 'border-l-wits-blue'

  return (
    <div
      onClick={() => navigate(`/orders/${order.id}`)}
      className={`bg-white rounded-lg border border-border-default border-l-[3px] ${borderColor} p-4 cursor-pointer hover:shadow-md transition-shadow`}
    >
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono text-gray-400">{order.orderNumber}</span>
            {order.poNumber && (
              <span className="text-xs font-mono bg-surface text-gray-500 px-1.5 py-0.5 rounded">{order.poNumber}</span>
            )}
            <Badge label={STATUS_LABELS[order.status] || order.status} variant={order.status} />
            {action && <Badge label="Action needed" variant="awaiting_approval" />}
          </div>
          <h3 className="mt-1 font-medium text-gray-900 truncate">{order.title}</h3>
          <p className="text-sm text-gray-500 mt-0.5">{order.universityName} · {order.facultyName}</p>
        </div>
        {order.estimatedDelivery && (
          <div className="flex items-center gap-1 text-xs text-gray-400 flex-shrink-0">
            <Clock size={12} />
            {formatDate(order.estimatedDelivery)}
          </div>
        )}
      </div>

      {/* Item chips */}
      {order.orderItems?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {order.orderItems.slice(0, 3).map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-surface text-gray-600 rounded px-2 py-0.5">
              <Package size={10} />
              {item.quantity}× {item.description}
            </span>
          ))}
          {order.orderItems.length > 3 && (
            <span className="text-xs text-gray-400">+{order.orderItems.length - 3} more</span>
          )}
        </div>
      )}

      {/* Step progress */}
      {order.steps?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-border-default">
          <div className="flex items-center gap-3">
            <StepTracker steps={order.steps} currentStepIndex={order.currentStepIndex} compact />
            <span className="text-xs font-medium text-gray-600 flex-shrink-0">
              {currentStep?.title || '—'}
            </span>
          </div>
        </div>
      )}
    </div>
  )
}
