import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

// Shown from Delete Job. 'warn' is used when quotes are still attached, so
// the customer knows those go too.
export default function DeleteJobModal({ mode, onCancel, onConfirm }) {
  const isWarn = mode === 'warn'

  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-md">
      <div style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 10px' }}>Delete this job?</h3>
        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
          {isWarn
            ? "This job has quotes attached. Deleting it removes those quotes too, and this can't be undone."
            : "This can't be undone."}
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button className="sm-delete-confirm-btn" onClick={onConfirm}>
            Delete Job
          </Button>
        </div>
      </div>
    </Modal>
  )
}