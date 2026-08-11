import { Check } from 'lucide-react'
import { JOB_PROGRESS_STAGES, formatJobStatusTimestamp } from '../jobTracking'

export default function ActiveJobProgressTimeline({ job }) {
  const history = Array.isArray(job.status_history) ? job.status_history : []
  const timestampByStatus = Object.fromEntries(
    history.map((entry) => [entry.status, entry.updated_at]),
  )
  const isPendingCompletion = job.job_status === 'pending_completion'
  const currentIndex = JOB_PROGRESS_STAGES.findIndex(
    (stage) => stage.value === job.job_status,
  )

  return (
    <ol className="service-job-progress-timeline" aria-label="Job progress">
      {JOB_PROGRESS_STAGES.map((stage, index) => {
        const isFinalStage = stage.value === 'completed'
        const isComplete = isFinalStage
          ? isPendingCompletion || job.job_status === 'completed'
          : index < currentIndex || isPendingCompletion
        const isCurrent =
          stage.value === job.job_status ||
          (isFinalStage && isPendingCompletion)
        const updatedAt =
          timestampByStatus[stage.value] ??
          (isFinalStage ? timestampByStatus.pending_completion : undefined)

        return (
          <li
            className={`service-job-progress-step is-${
              isComplete ? 'complete' : isCurrent ? 'current' : 'upcoming'
            }`}
            key={stage.value}
            aria-current={isCurrent ? 'step' : undefined}
          >
            <span className="service-job-progress-marker" aria-hidden="true">
              {isComplete ? <Check /> : index + 1}
            </span>
            <span className="service-job-progress-copy">
              <span className="service-job-progress-label">
                {isFinalStage && isPendingCompletion
                  ? 'Completed – awaiting confirmation'
                  : stage.label}
              </span>
              {updatedAt && (
                <span className="service-job-progress-time">
                  {formatJobStatusTimestamp(updatedAt)}
                </span>
              )}
            </span>
          </li>
        )
      })}
    </ol>
  )
}
