import { AlertTriangle } from 'lucide-react'
import Button from './Button'
import Modal from './Modal'
import './UnsavedChangesDialog.css'

export default function UnsavedChangesDialog({
  itemName,
  isSaving,
  onCancel,
  onDiscard,
  onSave,
}) {
  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-lg">
      <section
        className="unsaved-changes-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="unsaved-changes-title"
        aria-describedby="unsaved-changes-description"
      >
        <span className="unsaved-changes-icon" aria-hidden="true">
          <AlertTriangle />
        </span>
        <h2 id="unsaved-changes-title">Save your draft?</h2>
        <p id="unsaved-changes-description">
          You have unsaved changes to this {itemName}. Save them before leaving,
          or leave without keeping the latest changes.
        </p>
        <div className="unsaved-changes-actions">
          <Button variant="secondary" onClick={onCancel} disabled={isSaving}>
            Continue editing
          </Button>
          <Button
            className="unsaved-changes-discard"
            variant="secondary"
            onClick={onDiscard}
            disabled={isSaving}
          >
            Leave without saving
          </Button>
          <Button onClick={onSave} disabled={isSaving}>
            {isSaving ? 'Saving…' : 'Save draft'}
          </Button>
        </div>
      </section>
    </Modal>
  )
}
