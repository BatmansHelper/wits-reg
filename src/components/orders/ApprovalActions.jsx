import { useState } from 'react'
import { CheckCircle, XCircle } from 'lucide-react'
import Button from '../ui/Button'
import Modal from '../ui/Modal'

export default function ApprovalActions({ onApprove, onReject, loading }) {
  const [rejectOpen, setRejectOpen] = useState(false)
  const [reason, setReason] = useState('')

  function handleReject() {
    if (!reason.trim()) return
    onReject(reason.trim())
    setRejectOpen(false)
    setReason('')
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <Button
          onClick={onApprove}
          loading={loading}
          className="gap-2"
        >
          <CheckCircle size={16} />
          Approve
        </Button>
        <Button
          variant="danger"
          onClick={() => setRejectOpen(true)}
          disabled={loading}
          className="gap-2"
        >
          <XCircle size={16} />
          Reject
        </Button>
      </div>

      <Modal
        open={rejectOpen}
        onClose={() => setRejectOpen(false)}
        title="Reject this step"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleReject} disabled={!reason.trim()}>
              Confirm rejection
            </Button>
          </>
        }
      >
        <p className="text-sm text-gray-600 mb-4">
          Please provide a reason for rejecting this step.
        </p>
        <textarea
          value={reason}
          onChange={e => setReason(e.target.value)}
          rows={4}
          placeholder="e.g. The colour samples do not match the approved Pantone — please revise and resubmit."
          className="w-full border border-border-default rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-wits-blue resize-none"
        />
      </Modal>
    </>
  )
}
