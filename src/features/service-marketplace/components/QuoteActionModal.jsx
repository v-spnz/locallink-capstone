import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

// Confirmation modal shown before a quote is accepted or declined.
export default function QuoteActionModal({
  action,
  businessName,
  onCancel,
  onConfirm,
  isSaving,
}) {
  const isDecline = action === 'decline'

  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-md">
      <div style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 10px' }}>
          {isDecline ? 'Decline this quote?' : 'Accept this quote?'}
        </h3>
        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
          {isDecline
            ? `${businessName} will be notified that you've gone with another provider. This can't be undone.`
            : `${businessName} will receive your full address and can start the job. Your other quotes will be declined.`}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Cancel
          </Button>
          <Button
            className={isDecline ? 'sm-decline-confirm-btn' : undefined}
            onClick={onConfirm}
            disabled={isSaving}
          >
            {isSaving ? 'Saving…' : isDecline ? 'Decline quote' : 'Accept quote'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}