import { Check } from 'lucide-react'

export default function StepTracker({ steps, currentStepIndex, onStepClick, compact }) {
  if (!steps?.length) return null

  return (
    <div className={`flex items-center ${compact ? 'gap-1' : 'gap-0'} w-full`}>
      {steps.map((step, i) => {
        const isCompleted = step.status === 'approved' || step.status === 'skipped' || i < currentStepIndex
        const isCurrent = i === currentStepIndex
        const isSkipped = step.status === 'skipped'

        return (
          <div key={i} className={`flex items-center ${compact ? '' : 'flex-1'}`}>
            {/* Circle */}
            <button
              onClick={() => onStepClick?.(i)}
              title={step.title}
              className={`
                flex-shrink-0 rounded-full flex items-center justify-center transition-all
                ${compact ? 'w-4 h-4' : 'w-8 h-8'}
                ${isCompleted && !isSkipped ? 'bg-wits-blue' : ''}
                ${isCurrent ? 'bg-wits-gold' : ''}
                ${isSkipped ? 'bg-gray-200' : ''}
                ${!isCompleted && !isCurrent && !isSkipped ? 'bg-gray-200' : ''}
                ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
              `}
            >
              {isCompleted && !isSkipped ? (
                <Check size={compact ? 8 : 14} className="text-white" strokeWidth={3} />
              ) : (
                <span className={`font-medium text-white ${compact ? 'text-[8px]' : 'text-xs'}`}>
                  {i + 1}
                </span>
              )}
            </button>

            {/* Connector line */}
            {!compact && i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mx-1 ${isCompleted ? 'bg-wits-blue' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
