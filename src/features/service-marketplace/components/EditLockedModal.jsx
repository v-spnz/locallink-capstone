import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

// Shown when Edit Job is clicked while the job still has quotes awaiting a response.
export default function EditLockedModal({ onCancel }) {
  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-md">
      <div style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 10px' }}>Can't edit right now</h3>
        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
          This job has quotes waiting for a response, so it can't be edited.
          Decline the quotes you don't want, or wait for the job to be
          resolved, before making changes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={onCancel}>Got it</Button>
        </div>
      </div>
    </Modal>
  )
}