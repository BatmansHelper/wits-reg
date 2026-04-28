import { useState, useRef } from 'react'
import { FileText, Image, File, Upload, X, SkipForward, CheckCircle2, ChevronDown, ChevronUp, Paperclip } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { canApproveStep, canUploadToStep, canSkipStep, isAdmin } from '../../utils/roleChecks'
import { updateOrder, addActivity, Timestamp } from '../../lib/firestore'
import { uploadOrderFile } from '../../lib/storage'
import ApprovalActions from './ApprovalActions'
import Badge from '../ui/Badge'
import Button from '../ui/Button'
import { formatDateTime, formatFileSize, STEP_STATUS_LABELS } from '../../utils/formatters'
import toast from 'react-hot-toast'

function FileIcon({ type }) {
  if (type === 'image') return <Image size={15} className="text-wits-blue flex-shrink-0" />
  if (type === 'pdf') return <FileText size={15} className="text-danger flex-shrink-0" />
  return <File size={15} className="text-gray-400 flex-shrink-0" />
}

function FileViewerModal({ file, onClose }) {
  return (
    <div
      className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-4xl h-[88vh] flex flex-col shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <FileIcon type={file.fileType} />
            <span className="text-sm font-semibold text-gray-900 truncate">{file.name}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition-colors flex-shrink-0 ml-3"
          >
            <X size={16} />
          </button>
        </div>
        <div className="flex-1 overflow-hidden rounded-b-2xl bg-gray-50">
          {file.fileType === 'image' ? (
            <img src={file.url} alt={file.name} className="w-full h-full object-contain" />
          ) : file.fileType === 'pdf' ? (
            <iframe
              src={file.url}
              title={file.name}
              className="w-full h-full border-0"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full gap-3">
              <File size={40} className="text-gray-300" />
              <p className="text-sm text-gray-500">Preview not available for this file type.</p>
              <a
                href={file.url}
                download
                className="text-sm text-wits-blue font-semibold hover:underline"
              >
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function AttachmentRow({ file, onOpen }) {
  return (
    <div
      className="flex items-center gap-3 py-2.5 px-3 hover:bg-gray-50 cursor-pointer transition-colors rounded-lg"
      onClick={() => onOpen(file)}
    >
      <FileIcon type={file.fileType} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{file.name}</p>
        <p className="text-xs text-gray-400">
          {formatFileSize(file.sizeBytes)} · {file.uploadedByName} · {formatDateTime(file.uploadedAt)}
        </p>
      </div>
    </div>
  )
}

export default function StepPanel({ order, stepIndex }) {
  const { userDoc } = useAuth()
  const [actionLoading, setActionLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [docsOpen, setDocsOpen] = useState(false)
  const [viewingFile, setViewingFile] = useState(null)
  const fileInputRef = useRef()
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

  async function handleSimpleUpload(e) {
    const files = Array.from(e.target.files || [])
    if (!files.length || uploading) return
    setUploading(true)
    setUploadProgress(0)
    try {
      for (const file of files) {
        if (file.size > 20 * 1024 * 1024) { toast.error(`${file.name} exceeds 20 MB`); continue }
        const result = await uploadOrderFile(order.id, stepIndex, file, setUploadProgress)
        await handleFileUploaded(result, file)
      }
      toast.success('File uploaded')
      setDocsOpen(true)
    } catch {
      toast.error('Upload failed — please try again')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
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
        type: 'step_completed', stepIndex, stepTitle: step.title,
        message: `${userDoc.displayName} completed "${step.title}"`,
        performedBy: userDoc.id, performedByName: userDoc.displayName,
        performedByRole: userDoc.role, metadata: {},
      })
      toast.success('Step completed')
    } catch { toast.error('Failed to complete step') }
    finally { setActionLoading(false) }
  }

  async function handleApprove() {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex], status: 'approved',
        approvedBy: userDoc.id, approvedAt: Timestamp.now(), completedAt: Timestamp.now(),
      }
      const nextIndex = stepIndex + 1
      const hasNext = nextIndex < order.steps.length
      if (hasNext) updatedSteps[nextIndex] = { ...updatedSteps[nextIndex], status: 'in_progress', startedAt: Timestamp.now() }
      await updateOrder(order.id, {
        steps: updatedSteps,
        currentStepIndex: hasNext ? nextIndex : stepIndex,
        status: hasNext ? 'active' : 'completed',
      })
      await addActivity(order.id, {
        type: 'step_approved', stepIndex, stepTitle: step.title,
        message: `${userDoc.displayName} approved "${step.title}"`,
        performedBy: userDoc.id, performedByName: userDoc.displayName,
        performedByRole: userDoc.role, metadata: {},
      })
      toast.success('Step approved')
    } catch { toast.error('Failed to approve — please try again') }
    finally { setActionLoading(false) }
  }

  async function handleReject(reason) {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = { ...updatedSteps[stepIndex], status: 'rejected', rejectionReason: reason }
      await updateOrder(order.id, { steps: updatedSteps })
      await addActivity(order.id, {
        type: 'step_rejected', stepIndex, stepTitle: step.title,
        message: `${userDoc.displayName} rejected "${step.title}": ${reason}`,
        performedBy: userDoc.id, performedByName: userDoc.displayName,
        performedByRole: userDoc.role, metadata: { rejectionReason: reason },
      })
      toast.success('Step rejected')
    } catch { toast.error('Failed to reject — please try again') }
    finally { setActionLoading(false) }
  }

  async function handleSkip() {
    setActionLoading(true)
    try {
      const updatedSteps = [...order.steps]
      updatedSteps[stepIndex] = {
        ...updatedSteps[stepIndex], status: 'skipped',
        skippedBy: userDoc.id, skippedAt: Timestamp.now(),
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
        type: 'step_skipped', stepIndex, stepTitle: step.title,
        message: `${userDoc.displayName} skipped "${step.title}"`,
        performedBy: userDoc.id, performedByName: userDoc.displayName,
        performedByRole: userDoc.role, metadata: {},
      })
      toast.success('Step skipped')
    } catch { toast.error('Failed to skip step') }
    finally { setActionLoading(false) }
  }

  return (
    <>
      {viewingFile && (
        <FileViewerModal file={viewingFile} onClose={() => setViewingFile(null)} />
      )}

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Colour stripe */}
        <div className="h-1 w-full" style={{ backgroundColor: step.colour || '#003DA5' }} />

        {/* Step header */}
        <div className="px-6 py-5 border-b border-gray-100">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 font-medium">Step {step.stepNumber}</span>
                <Badge label={STEP_STATUS_LABELS[step.status] || step.status} variant={step.status} />
              </div>
              <h3 className="mt-1.5 text-base font-bold text-gray-900">{step.title}</h3>
              <p className="mt-1 text-sm text-gray-500">{step.description}</p>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {canComplete && (
                <Button size="sm" onClick={handleComplete} loading={actionLoading}>
                  <CheckCircle2 size={14} />
                  Mark Complete
                </Button>
              )}
              {canSkip && (
                <Button variant="ghost" size="sm" onClick={handleSkip} loading={actionLoading}>
                  <SkipForward size={14} />
                  Skip
                </Button>
              )}
            </div>
          </div>

          {step.rejectionReason && (
            <div className="mt-3 bg-danger-bg border border-danger/20 rounded-xl p-3">
              <p className="text-xs font-bold text-danger">Rejection reason</p>
              <p className="text-sm text-gray-700 mt-1">{step.rejectionReason}</p>
            </div>
          )}
        </div>

        {/* Documents section */}
        {(step.attachments?.length > 0 || (canUpload && isCurrentStep)) && (
          <div className="px-6 py-4 border-b border-gray-100">
            {/* Row: icon + label + count + toggle + upload button */}
            <div className="flex items-center gap-2">
              <Paperclip size={14} className="text-gray-400" />
              <button
                type="button"
                onClick={() => setDocsOpen(o => !o)}
                className="flex items-center gap-1.5 text-sm font-semibold text-gray-700 hover:text-gray-900 transition-colors"
              >
                Documents
                {step.attachments?.length > 0 && (
                  <span className="text-xs font-bold text-wits-blue bg-wits-blue-light rounded-full px-2 py-0.5">
                    {step.attachments.length}
                  </span>
                )}
                {docsOpen
                  ? <ChevronUp size={13} className="text-gray-400" />
                  : <ChevronDown size={13} className="text-gray-400" />
                }
              </button>

              {/* Simple upload button, right-aligned */}
              {canUpload && isCurrentStep && (
                <label className={`ml-auto flex items-center gap-1.5 text-xs font-semibold cursor-pointer transition-colors
                  ${uploading ? 'text-gray-400 cursor-not-allowed' : 'text-wits-blue hover:text-wits-blue/70'}`}>
                  <Upload size={13} />
                  {uploading ? `Uploading ${uploadProgress}%` : 'Upload file'}
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    multiple
                    accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx"
                    onChange={handleSimpleUpload}
                    disabled={uploading}
                  />
                </label>
              )}
            </div>

            {/* Collapsible file list */}
            {docsOpen && (
              <div className="mt-3 w-full sm:w-1/2">
                {step.attachments?.length > 0 ? (
                  <div className="border border-gray-100 rounded-xl overflow-hidden">
                    {step.attachments.map((f, i) => (
                      <AttachmentRow key={i} file={f} onOpen={setViewingFile} />
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-400 py-1">No documents uploaded yet.</p>
                )}
              </div>
            )}

            {step.uploadTypes?.length > 0 && !docsOpen && (
              <p className="text-xs text-gray-400 mt-1.5">
                Expected: {step.uploadTypes.join(', ')}
              </p>
            )}
          </div>
        )}

        {/* Approval actions */}
        {canApprove && isCurrentStep && (
          <div className="px-6 py-4 bg-wits-gold-light border-t border-wits-gold/20">
            <p className="text-sm font-bold text-warning mb-3">Your approval is required</p>
            <ApprovalActions onApprove={handleApprove} onReject={handleReject} loading={actionLoading} />
          </div>
        )}
      </div>
    </>
  )
}
