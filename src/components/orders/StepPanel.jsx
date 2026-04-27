import { useState } from 'react'
import { FileText, Image, File, Download, SkipForward, ChevronRight } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canApproveStep, canUploadToStep, canSkipStep } from '../../utils/roleChecks'
import { updateOrder, addActivity, serverTimestamp, Timestamp } from '../../lib/firestore'
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
  const step = order?.steps?.[stepIndex]

  if (!step) return null

  const canUpload = canUploadToStep(userDoc, step) && ['in_progress', 'awaiting_approval'].includes(step.status)
  const canApprove = canApproveStep(userDoc, step) && step.status === 'awaiting_approval'
  const canSkip = canSkipStep(userDoc, step) && step.status !== 'skipped' && step.status !== 'approved'
  const isCurrentStep = stepIndex === order.currentStepIndex

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
          {canSkip && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSkip}
              loading={actionLoading}
              className="flex-shrink-0"
            >
              <SkipForward size={14} />
              Skip
            </Button>
          )}
        </div>

        {step.rejectionReason && (
          <div className="mt-3 bg-danger-bg border border-danger/20 rounded-lg p-3">
            <p className="text-xs font-medium text-danger">Rejection reason</p>
            <p className="text-sm text-gray-700 mt-1">{step.rejectionReason}</p>
          </div>
        )}
      </div>

      {/* Documents */}
      <div className="px-6 py-4">
        {step.uploadTypes?.length > 0 && (
          <p className="text-xs text-gray-500 mb-3">
            Expected documents: {step.uploadTypes.join(', ')}
          </p>
        )}

        {step.attachments?.length > 0 ? (
          <div className="mb-4">
            {step.attachments.map((f, i) => (
              <AttachmentRow key={i} file={f} />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 mb-4">No documents uploaded yet.</p>
        )}

        {canUpload && isCurrentStep && (
          <DocumentUploader
            orderId={order.id}
            stepIndex={stepIndex}
            onUploaded={handleFileUploaded}
          />
        )}
      </div>

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
