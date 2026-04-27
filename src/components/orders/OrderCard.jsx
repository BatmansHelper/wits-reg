import { useNavigate } from 'react-router-dom'
import { Clock, Package, ArrowRight } from 'lucide-react'
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
  const totalSteps = order.steps?.length || 0
  const completedCount = order.steps?.filter(
    (s, i) => s.status === 'approved' || s.status === 'skipped' || i < order.currentStepIndex
  ).length || 0
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  return (
    <div
      onClick={() => navigate(`/orders/${order.id}`)}
      className={`bg-white rounded-2xl border shadow-sm cursor-pointer hover:shadow-lg transition-all duration-200 group overflow-hidden
        ${action ? 'border-amber-200' : 'border-gray-100'}`}
    >
      {/* Action indicator bar */}
      {action && (
        <div className="h-[3px] bg-gradient-to-r from-wits-gold via-amber-400 to-wits-gold" />
      )}

      <div className="p-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono text-gray-400 tracking-wide">{order.orderNumber}</span>
              {order.poNumber && (
                <span className="text-xs font-mono bg-gray-50 text-gray-500 px-2 py-0.5 rounded-md border border-gray-100">
                  {order.poNumber}
                </span>
              )}
              <Badge label={STATUS_LABELS[order.status] || order.status} variant={order.status} />
              {action && <Badge label="Action needed" variant="awaiting_approval" />}
            </div>
            <h3 className="mt-2 text-base font-semibold text-gray-900 group-hover:text-wits-blue transition-colors truncate">
              {order.title}
            </h3>
            <p className="text-sm text-gray-400 mt-0.5">
              {order.universityName} · {order.facultyName}
            </p>
          </div>

          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            {order.estimatedDelivery && (
              <div className="flex items-center gap-1.5 text-xs text-gray-400 bg-gray-50 rounded-lg px-2.5 py-1.5 border border-gray-100">
                <Clock size={11} />
                <span>{formatDate(order.estimatedDelivery)}</span>
              </div>
            )}
            <ArrowRight size={16} className="text-gray-300 group-hover:text-wits-blue group-hover:translate-x-0.5 transition-all" />
          </div>
        </div>

        {/* Item chips */}
        {order.orderItems?.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {order.orderItems.slice(0, 3).map((item, i) => (
              <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 rounded-lg px-2.5 py-1 border border-gray-100">
                <Package size={10} className="text-gray-400" />
                {item.quantity}× {item.description}
              </span>
            ))}
            {order.orderItems.length > 3 && (
              <span className="text-xs text-gray-400 self-center">+{order.orderItems.length - 3} more</span>
            )}
          </div>
        )}
      </div>

      {/* Step progression — prominent section */}
      {order.steps?.length > 0 && (
        <div className="px-5 pb-5">
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
            {/* Progress header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
              <div className="flex items-center gap-2">
                {currentStep && (
                  <span className="text-xs font-semibold text-gray-700">
                    {currentStep.title}
                  </span>
                )}
                <span className="text-[11px] font-semibold text-gray-400 tabular-nums">
                  {completedCount}/{totalSteps}
                </span>
              </div>
            </div>

            {/* Step dots — full width compact */}
            <StepTracker
              steps={order.steps}
              currentStepIndex={order.currentStepIndex}
              compact
            />

            {/* Progress bar */}
            <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-wits-blue rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>

            {/* Current step label */}
            {currentStep && (
              <div className="mt-3 flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-wits-gold flex-shrink-0" />
                <span className="text-xs font-medium text-gray-500">
                  Currently: <span className="text-gray-800">{currentStep.title}</span>
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
