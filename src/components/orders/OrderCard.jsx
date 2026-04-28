import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Package, ChevronDown, ArrowRight } from 'lucide-react'
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
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const action = needsAction(order, userDoc)
  const currentStep = order.steps?.[order.currentStepIndex]
  const totalSteps = order.steps?.length || 0
  const completedCount = order.steps?.filter(
    (s, i) => s.status === 'approved' || s.status === 'skipped' || i < order.currentStepIndex
  ).length || 0
  const progressPct = totalSteps > 0 ? Math.round((completedCount / totalSteps) * 100) : 0

  return (
    <div className={`bg-white rounded-2xl border shadow-sm overflow-hidden transition-all
      ${action ? 'border-amber-200' : 'border-gray-200'}`}
    >
      {/* Action gold bar */}
      {action && <div className="h-[3px] bg-gradient-to-r from-wits-gold via-amber-400 to-wits-gold" />}

      {/* Collapsed row — always visible */}
      <div
        className="flex items-center gap-4 px-5 py-3.5 cursor-pointer hover:bg-gray-50/60 transition-colors select-none"
        onClick={() => setExpanded(e => !e)}
      >
        {/* Date */}
        <span className="text-sm text-gray-400 font-medium w-24 flex-shrink-0 tabular-nums">
          {formatDate(order.createdAt)}
        </span>

        {/* PO number */}
        <span className="text-sm font-bold text-wits-blue w-28 flex-shrink-0 truncate">
          {order.poNumber || '—'}
        </span>

        {/* Title */}
        <span className="text-sm font-semibold text-gray-900 flex-1 min-w-0 truncate">
          {order.title}
        </span>

        {/* Est. delivery */}
        {order.estimatedDelivery && (
          <span className="text-xs font-bold text-danger flex-shrink-0 hidden sm:block whitespace-nowrap">
            Est. delivery: {formatDate(order.estimatedDelivery)}
          </span>
        )}

        {/* Status badge */}
        <Badge label={STATUS_LABELS[order.status] || order.status} variant={order.status} />

        {/* Progress pill */}
        {totalSteps > 0 && (
          <span className="text-xs font-bold text-gray-400 tabular-nums hidden sm:block">
            {completedCount}/{totalSteps}
          </span>
        )}

        {/* Expand chevron */}
        <ChevronDown
          size={16}
          className={`text-gray-400 flex-shrink-0 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
        />
      </div>

      {/* Expanded content */}
      {expanded && (
        <div className="border-t border-gray-100">
          <div className="p-5">
            {/* Sub-header */}
            <p className="text-xs text-gray-400 font-medium mb-4">
              {order.universityName} · {order.facultyName}
              {order.estimatedDelivery && (
                <span className="ml-3 inline-flex items-center gap-1">
                  <Clock size={11} />
                  {formatDate(order.estimatedDelivery)}
                </span>
              )}
            </p>

            {/* Item chips */}
            {order.orderItems?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {order.orderItems.slice(0, 4).map((item, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 text-xs bg-gray-50 text-gray-600 rounded-lg px-2.5 py-1 border border-gray-100">
                    <Package size={10} className="text-gray-400" />
                    {item.quantity}× {item.description}
                    {item.size && ` · ${item.size}`}
                  </span>
                ))}
                {order.orderItems.length > 4 && (
                  <span className="text-xs text-gray-400 self-center">+{order.orderItems.length - 4} more</span>
                )}
              </div>
            )}

            {/* Step progress */}
            {order.steps?.length > 0 && (
              <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 mb-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Progress</span>
                  <div className="flex items-center gap-2">
                    {currentStep && (
                      <span className="text-xs font-semibold text-gray-700">{currentStep.title}</span>
                    )}
                    <span className="text-[11px] font-semibold text-gray-400 tabular-nums">{completedCount}/{totalSteps}</span>
                  </div>
                </div>
                <StepTracker steps={order.steps} currentStepIndex={order.currentStepIndex} compact />
                <div className="mt-3 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-wits-blue rounded-full transition-all duration-500"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                {currentStep && (
                  <div className="mt-2.5 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-wits-gold flex-shrink-0" />
                    <span className="text-xs text-gray-500 font-medium">
                      Currently: <span className="text-gray-800">{currentStep.title}</span>
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* View full order */}
            <div className="flex justify-end">
              <button
                onClick={() => navigate(`/orders/${order.id}`)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-bold text-wits-blue bg-wits-blue-light rounded-lg hover:bg-wits-blue hover:text-white transition-colors"
              >
                View full order <ArrowRight size={14} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
