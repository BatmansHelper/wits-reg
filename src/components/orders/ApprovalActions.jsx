import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function ApprovalActions({ onApprove, onReject, loading, stepTitle }) {
  const [approveOpen, setApproveOpen] = useState(false)
  const [approveNote, setApproveNote] = useState('')
  const [rejectOpen, setRejectOpen] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  function handleApproveConfirm() {
    if (!approveNote.trim()) return
    onApprove(approveNote.trim())
    setApproveOpen(false)
    setApproveNote('')
  }

  function handleRejectConfirm() {
    if (!rejectReason.trim()) return
    onReject(rejectReason.trim())
    setRejectOpen(false)
    setRejectReason('')
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button onClick={() => setApproveOpen(true)} loading={loading}>
          <CheckCircle size={16} />
          Approve
        </Button>
        <Button variant="danger" onClick={() => setRejectOpen(true)} disabled={loading}>
          <XCircle size={16} />
          Reject
        </Button>
      </div>

      {/* Approval confirmation modal */}
      <Modal
        open={approveOpen}
        onClose={() => { setApproveOpen(false); setApproveNote('') }}
        title={stepTitle ? `Approve — ${stepTitle}` : 'Confirm Approval'}
        footer={
          <>
            <Button variant="ghost" onClick={() => { setApproveOpen(false); setApproveNote('') }}>
              Cancel
            </Button>
            <Button onClick={handleApproveConfirm} disabled={!approveNote.trim()}>
              <CheckCircle size={15} />
              Confirm Approval
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Add a note confirming your approval. This will be logged in the activity trail.
        </p>
        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
          Approval note <span className="text-danger">*</span>
        </label>
        <textarea
          value={approveNote}
          onChange={e => setApproveNote(e.target.value)}
          rows={4}
          placeholder="e.g. Samples reviewed and approved — colours match Pantone specification."
          className="w-full border border-border-default rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue resize-none"
          autoFocus
        />
        <p className="text-xs text-gray-400 mt-1.5">Required — logged in audit trail.</p>
      </Modal>

      {/* Rejection modal */}
      <Modal
        open={rejectOpen}
        onClose={() => { setRejectOpen(false); setRejectReason('') }}
        title="Reject this step"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setRejectOpen(false); setRejectReason('') }}>Cancel</Button>
            <Button variant="danger" onClick={handleRejectConfirm} disabled={!rejectReason.trim()}>
              Confirm rejection
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-500 mb-4">
          Please provide a reason for rejecting this step.
        </p>
        <textarea
          value={rejectReason}
          onChange={e => setRejectReason(e.target.value)}
          rows={4}
          placeholder="e.g. The colour samples do not match the approved Pantone — please revise and resubmit."
          className="w-full border border-border-default rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue resize-none"
        />
      </Modal>
    </>
  )
}
