import { useState } from 'react'
import { FileText, Image, File, Download, SkipForward, CheckCircle2, ChevronDown, ChevronUp, Paperclip } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canApproveStep, canUploadToStep, canSkipStep, isAdmin } from '../../utils/roleChecks'
import { updateOrder, addActivity, Timestamp } from '../../lib/firestore'
import DocumentUploader from './DocumentUploader'
import ApprovalActions from './ApprovalActions'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { formatDateTime, formatFileSize, STEP_STATUS_LABELS } from '../../utils/formatters'
import toast from 'react-hot-toast'

function AttachmentRow({ file }) {
  const Icon = file.fileType === 'image' ? Image : file.fileType === 'pdf' ? FileText : File
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border-default last:border-0">
      <Icon size={16} className="text-gray-400 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">{formatFileSize(file.sizeBytes)} · {file.uploadedByName} · {formatDateTime(file.uploadedAt)}</p>
      </div>
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-wits-blue hover:opacity-70">
        <Download size={16} />
      </a>
    </div>
  )
}

export default function StepPanel({ order, stepIndex }) {
  const { userDoc } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)
  const [docsOpen, setDocsOpen] = useState(false)
  const step = order?.steps?.[stepIndex]

  if (!step) return null

  const canUpload = canUploadToStep(userDoc, step) && ['in_progress', 'awaiting_approval'].includes(step.status)
  const canApprove = canApproveStep(userDoc, step) && step.status === 'awaiting_approval'
  const canSkip = canSkipStep(userDoc, step) && step.status !== 'skipped' && step.status !== 'approved'
  const isCurrentStep = stepIndex === order.currentStepIndex
  const canComplete = isAdmin(userDoc) && !step.requiresApproval && step.status === 'in_progress' && isCurrentStep

  async function handleFileUploaded(fileResult, file) {
    const updatedSteps = [...order.steps]
    const attachment = {
      name: file.name,
      url: fileResult.url,
      fileType: fileResult.fileType,
      uploadedBy: userDoc.id,
      uploadedByName: userDoc.displayName,
      uploadedAt: Timestamp.now(),
      sizeBytes: file.size,
    }
    updatedSteps[stepIndex] = {
      ...updatedSteps[stepIndex],
      attachments: [...(updatedSteps[stepIndex].attachments || []), attachment],
      status: step.requiresApproval ? 'awaiting_approval' : 'in_progress',
    }

    await updateOrder(order.id, { steps: updatedSteps })
    await addActivity(order.id, {
      type: 'document_uploaded',
      stepIndex,
      stepTitle: step.title,
      message: `${userDoc.displayName} uploaded "${file.name}"`,
      performedBy: userDoc.id,
      performedByName: userDoc.displayName,
      performedByRole: userDoc.role,
      metadata: { fileName: file.name },
    })
  }

  async function handleComplete() {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status: 'approved', completedAt: Timestamp.now() }
      const nextIndex = stepIndex + 1
      const hasNext = nextIndex < order.steps.length
      if (hasNext) {
        updatedSteps[nextIndex] = { ...updatedSteps[nextIndex], status: 'in_progress', startedAt: Timestamp.now() }
      }
      await updateOrder(order.id, {
        steps: updatedSteps,
        currentStepIndex: hasNext ? nextIndex : stepIndex,
        status: hasNext ? 'active' : 'completed',
      })
      await addActivity(order.id, {
        type: 'step_completed',
        stepIndex,
        stepTitle: step.title,
        message: `${userDoc.displayName} completed "${step.title}"`,
        performedBy: userDoc.id,
        performedByName: userDoc.displayName,
        performedByRole: userDoc.role,
        metadata: {},
      })
      toast.success('Step completed')
    } catch {
      toast.error('Failed to complete step')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleApprove() {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status: 'approved',
        approvedBy: userDoc.id,
        approvedAt: Timestamp.now(),
        completedAt: Timestamp.now(),
      }

      const nextIndex = stepIndex + 1
      const hasNext = nextIndex < order.steps.length
      if (hasNext) {
        updatedSteps[nextIndex] = { ...updatedSteps[nextIndex], status: 'in_progress', startedAt: Timestamp.now() }
      }

      await updateOrder(order.id, {
        steps: updatedSteps,
        currentStepIndex: hasNext ? nextIndex : stepIndex,
        status: hasNext ? 'active' : 'completed',
      })

      await addActivity(order.id, {
        type: 'step_approved',
        stepIndex,
        stepTitle: step.title,
        message: `${userDoc.displayName} approved "${step.title}"`,
        performedBy: userDoc.id,
        performedByName: userDoc.displayName,
        performedByRole: userDoc.role,
        metadata: {},
      })
      toast.success('Step approved')
    } catch {
      toast.error('Failed to approve — please try again')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleReject(reason) {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status: 'rejected',
        rejectionReason: reason,
      }

      await updateOrder(order.id, { steps: updatedSteps })
      await addActivity(order.id, {
        type: 'step_rejected',
        stepIndex,
        stepTitle: step.title,
        message: `${userDoc.displayName} rejected "${step.title}": ${reason}`,
        performedBy: userDoc.id,
        performedByName: userDoc.displayName,
        performedByRole: userDoc.role,
        metadata: { rejectionReason: reason },
      })
      toast.success('Step rejected')
    } catch {
      toast.error('Failed to reject — please try again')
    } finally {
      setActionLoading(false)
    }
  }

  async function handleSkip() {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex],
        status: 'skipped',
        skippedBy: userDoc.id,
        skippedAt: Timestamp.now(),
      }
      const nextIndex = stepIndex + 1
      if (nextIndex < order.steps.length) {
        updatedSteps[nextIndex] = { ...updatedSteps[nextIndex], status: 'in_progress', startedAt: Timestamp.now() }
      }

      await updateOrder(order.id, {
        steps: updatedSteps,
        currentStepIndex: nextIndex < order.steps.length ? nextIndex : stepIndex,
      })
      await addActivity(order.id, {
        type: 'step_skipped',
        stepIndex,
        stepTitle: step.title,
        message: `${userDoc.displayName} skipped "${step.title}"`,
        performedBy: userDoc.id,
        performedByName: userDoc.displayName,
        performedByRole: userDoc.role,
        metadata: {},
      })
      toast.success('Step skipped')
    } catch {
      toast.error('Failed to skip step')
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="bg-white rounded-lg border border-border-default overflow-hidden">
      {/* Step header */}
      <div
        className="h-1 w-full"
        style={{ backgroundColor: step.colour || '#003DA5' }}
      />
      <div className="px-6 py-4 border-b border-border-default">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Step {step.stepNumber}</span>
              <Badge label={STEP_STATUS_LABELS[step.status] || step.status} variant={step.status} />
            </div>
            <h3 className="mt-1 text-base font-medium text-gray-900">{step.title}</h3>
            <p className="mt-1 text-sm text-gray-500">{step.description}</p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            {canComplete && (
              <Button
                size="sm"
                onClick={handleComplete}
                loading={actionLoading}
              >
                <CheckCircle2 size={14} />
                Mark Complete
              </Button>
            )}
            {canSkip && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSkip}
                loading={actionLoading}
              >
                <SkipForward size={14} />
                Skip
              </Button>
            )}
          </div>
        </div>

        {step.rejectionReason && (
          <div className="mt-3 bg-danger-bg border border-danger/20 rounded-lg p-3">
            <p className="text-xs font-medium text-danger">Rejection reason</p>
            <p className="text-sm text-gray-700 mt-1">{step.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Documents */}
      {(step.attachments?.length > 0 || canUpload) && (
        <div className="px-6 py-4">
          <div className="w-full sm:w-1/2">
            {/* Header toggle */}
            <button
              type="button"
              onClick={() => setDocsOpen(o => !o)}
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors mb-3"
            >
              <Paperclip size={14} className="text-gray-400" />
              Documents
              {step.attachments?.length > 0 && (
                <span className="ml-1 text-xs font-bold text-wits-blue bg-wits-blue-light rounded-full px-2 py-0.5">
                  {step.attachments.length}
                </span>
              )}
              {docsOpen ? <ChevronUp size={14} className="text-gray-400 ml-auto" /> : <ChevronDown size={14} className="text-gray-400 ml-auto" />}
            </button>

            {/* Expected types */}
            {step.uploadTypes?.length > 0 && (
              <p className="text-xs text-gray-400 mb-2">
                Expected: {step.uploadTypes.join(', ')}
              </p>
            )}

            {/* Collapsible file list */}
            {docsOpen && (
              <div className="mb-3">
                {step.attachments?.length > 0 ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {step.attachments.map((f, i) => (
                      <AttachmentRow key={i} file={f} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 mb-3">No documents uploaded yet.</p>
                )}
              </div>
            )}

            {/* Upload area */}
            {canUpload && isCurrentStep && (
              <DocumentUploader
                orderId={order.id}
                stepIndex={stepIndex}
                onUploaded={(result, file) => { handleFileUploaded(result, file); setDocsOpen(true) }}
              />
            )}
          </div>
        </div>
      )}

      {/* Approval actions */}
      {canApprove && isCurrentStep && (
        <div className="px-6 py-4 border-t border-border-default bg-wits-gold-light">
          <p className="text-sm font-medium text-warning mb-3">Your approval is required</p>
          <ApprovalActions
            onApprove={handleApprove}
            onReject={handleReject}
            loading={actionLoading}
          />
        </div>
      )}
    </div>
  )
}
