import Modal from '../../../components/ui/Modal'
import Button from '../../../components/ui/Button'

// Shown from Repost Job. Three modes: blocked-date and blocked-quotes are
// informational only; confirm asks before actually reposting.
export default function RepostJobModal({ mode, job, onCancel, onConfirm }) {
  if (mode === 'blocked-date') {
    const preferredDate = job.job_date
      ? new Date(job.job_date).toLocaleDateString('en-NZ')
      : null

    return (
      <Modal onClose={onCancel} maxWidthClassName="max-w-md">
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 10px' }}>Can't repost yet</h3>
          <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
            {preferredDate
              ? `You can repost this job once its preferred date (${preferredDate}) has passed.`
              : 'You can repost this job once its preferred date has passed.'}
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Got it</Button>
          </div>
        </div>
      </Modal>
    )
  }

  if (mode === 'blocked-quotes') {
    return (
      <Modal onClose={onCancel} maxWidthClassName="max-w-md">
        <div style={{ padding: 24 }}>
          <h3 style={{ margin: '0 0 10px' }}>
            Can't repost with quotes waiting
          </h3>
          <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
            This job still has quotes waiting for a response. Decline them, or
            wait until it's resolved, before reposting.
          </p>
          <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button onClick={onCancel}>Got it</Button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={onCancel} maxWidthClassName="max-w-md">
      <div style={{ padding: 24 }}>
        <h3 style={{ margin: '0 0 10px' }}>Repost this job?</h3>
        <p style={{ margin: '0 0 22px', color: 'var(--text-muted)' }}>
          This posts a new job using the same details, so nearby providers can
          send fresh quotes.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button onClick={onConfirm}>Repost Job</Button>
        </div>
      </div>
    </Modal>
  )
}
