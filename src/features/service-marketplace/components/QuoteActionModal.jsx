import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

// Confirmation step before a quote is accepted (US0055). Only wired
// up to Accept this commit -- Decline gets the same treatment next
// commit (US0056).
export default function QuoteActionModal({
  businessName,
  onCancel,
  onConfirm,
  isSaving,
}) {
  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-md">
      <div style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 10px' }}>Accept this quote?</h3>
        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
          {businessName} will receive your full address and can start the job.
          Your other quotes will be declined.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button onClick={onConfirm} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Accept quote'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
