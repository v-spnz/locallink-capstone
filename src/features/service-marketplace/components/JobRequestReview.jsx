import Button from '../../../components/ui/Button'

function ReviewRow({ label, value }) {
  return (
    <div className="review-row">
      <div className="review-row-label">{label}</div>
      <div>{value || '-'}</div>
    </div>
  )
}

export default function JobRequestReview({ job, isSaving, onBack, onConfirm }) {
  return (
    <div className="placeholder-section">
      <div className="placeholder-section-title is-complete">Review Job</div>
      <p className="review-introduction">
        Please review the job details before posting.
      </p>
      <ReviewRow label="Job Title" value={job.title} />
      <ReviewRow label="Description" value={job.description} />
      <ReviewRow label="Trade Category" value={job.category} />
      <ReviewRow label="City" value={job.city} />
      <ReviewRow label="Suburb" value={job.suburb} />
      <ReviewRow label="Posted Distance" value={job.postedDistance} />
      <div className="review-actions">
        <Button variant="secondary" onClick={onBack}>
          Back to Edit
        </Button>
        <Button onClick={onConfirm} disabled={isSaving}>
          {isSaving ? 'Saving…' : 'Confirm & Post Job Request'}
        </Button>
      </div>
    </div>
  )
}
