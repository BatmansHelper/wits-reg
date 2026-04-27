import { Check } from 'lucide-react'

export default function StepTracker({ steps, currentStepIndex, onStepClick, compact, showLabels }) {
  if (!steps?.length) return null

  if (compact) {
    return (
      <div className="flex items-center gap-1">
        {steps.map((step, i) => {
          const isCompleted = step.status === 'approved' || step.status === 'skipped' || i < currentStepIndex
          const isCurrent = i === currentStepIndex
          const isSkipped = step.status === 'skipped'
          return (
            <div key={i} className="flex items-center">
              <div className={`
                w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0
                ${isCompleted && !isSkipped ? 'bg-wits-blue' : ''}
                ${isCurrent ? 'bg-wits-gold' : ''}
                ${!isCompleted && !isCurrent ? 'bg-gray-200' : ''}
              `}>
                {isCompleted && !isSkipped
                  ? <Check size={8} className="text-white" strokeWidth={3} />
                  : <span className="text-[8px] font-medium text-white">{i + 1}</span>
                }
              </div>
              {i < steps.length - 1 && (
                <div className={`w-3 h-0.5 ${isCompleted ? 'bg-wits-blue' : 'bg-gray-200'}`} />
              )}
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex items-start w-full">
      {steps.map((step, i) => {
        const isCompleted = step.status === 'approved' || step.status === 'skipped' || i < currentStepIndex
        const isCurrent = i === currentStepIndex
        const isSkipped = step.status === 'skipped'

        return (
          <div key={i} className="flex items-start flex-1 min-w-0">
            {/* Dot + label column */}
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onStepClick?.(i)}
                title={step.title}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0
                  ${isCompleted && !isSkipped ? 'bg-wits-blue' : ''}
                  ${isCurrent ? 'bg-wits-gold' : ''}
                  ${isSkipped ? 'bg-gray-200' : ''}
                  ${!isCompleted && !isCurrent && !isSkipped ? 'bg-gray-200' : ''}
                  ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                `}
              >
                {isCompleted && !isSkipped
                  ? <Check size={14} className="text-white" strokeWidth={3} />
                  : <span className="text-xs font-medium text-white">{i + 1}</span>
                }
              </button>
              {showLabels && (
                <button
                  onClick={() => onStepClick?.(i)}
                  className={`mt-2 text-xs text-center leading-tight w-16 transition-colors
                    ${isCurrent ? 'text-gray-900 font-medium' : 'text-gray-400 hover:text-gray-700'}
                    ${onStepClick ? 'cursor-pointer' : 'cursor-default'}
                  `}
                >
                  {step.title}
                </button>
              )}
            </div>

            {/* Connector line — only between dots */}
            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 mx-1 ${isCompleted ? 'bg-wits-blue' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
