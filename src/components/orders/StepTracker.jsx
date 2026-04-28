import { Check } from 'lucide-react'

export default function StepTracker({ steps, currentStepIndex, onStepClick, compact, showLabels }) {
  if (!steps?.length) return null

  if (compact) {
    return (
      <div className="flex items-center w-full">
        {steps.map((step, i) => {
          const isCompleted = step.status === 'approved' || step.status === 'skipped' || i < currentStepIndex
          const isCurrent = i === currentStepIndex
          const isSkipped = step.status === 'skipped'
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none min-w-0">
              <div className={`
                w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                ${isCompleted && !isSkipped ? 'bg-wits-blue' : ''}
                ${isCurrent ? 'bg-wits-gold ring-[3px] ring-wits-gold/25' : ''}
                ${isSkipped ? 'bg-gray-200' : ''}
                ${!isCompleted && !isCurrent && !isSkipped ? 'bg-gray-200' : ''}
              `}>
                {isCompleted && !isSkipped
                  ? <Check size={9} className="text-white" strokeWidth={3} />
                  : <span className="text-[8px] font-bold text-white">{i + 1}</span>
                }
              </div>
              {i < steps.length - 1 && (
                <div className={`flex-1 h-0.5 mx-1 rounded-full ${isCompleted ? 'bg-wits-blue' : 'bg-gray-200'}`} />
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
            <div className="flex flex-col items-center flex-shrink-0">
              <button
                onClick={() => onStepClick?.(i)}
                title={step.title}
                className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-all flex-shrink-0
                  ${isCompleted && !isSkipped ? 'bg-wits-blue' : ''}
                  ${isCurrent ? 'bg-wits-gold ring-4 ring-wits-gold/20' : ''}
                  ${isSkipped ? 'bg-gray-200' : ''}
                  ${!isCompleted && !isCurrent && !isSkipped ? 'bg-gray-200' : ''}
                  ${onStepClick ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                `}
              >
                {isCompleted && !isSkipped
                  ? <Check size={14} className="text-white" strokeWidth={3} />
                  : <span className="text-xs font-bold text-white">{i + 1}</span>
                }
              </button>
              {showLabels && (
                <span
                  className={`mt-2 text-[11px] text-center leading-tight w-24 block break-words hyphens-auto
                    ${isCurrent ? 'text-gray-900 font-semibold' : isCompleted ? 'text-wits-blue font-medium' : 'text-gray-400'}
                  `}
                >
                  {step.title}
                </span>
              )}
            </div>

            {i < steps.length - 1 && (
              <div className={`flex-1 h-0.5 mt-4 mx-1 rounded-full ${isCompleted ? 'bg-wits-blue' : 'bg-gray-200'}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}
