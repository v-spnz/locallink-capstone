import { Check } from 'lucide-react'
import { JOB_PROGRESS_STAGES, formatJobStatusTimestamp } from '../jobTracking'

export default function ActiveJobProgressTimeline({ job }) {
  const currentStatus = job.job_status ?? job.status
  const history = Array.isArray(job.status_history)
    ? job.status_history.toSorted(
        (first, second) =>
          new Date(first.updated_at).getTime() -
          new Date(second.updated_at).getTime(),
      )
    : []
  const timestampByStatus = Object.fromEntries(
    history.map((entry) => [entry.status, entry.updated_at]),
  )
  const isPendingCompletion = currentStatus === 'pending_completion'
  const currentIndex = JOB_PROGRESS_STAGES.findIndex(
    (stage) => stage.value === currentStatus,
  )

  if (currentIndex === -1 && !isPendingCompletion) return null

  return (
    <ol className="service-job-progress-timeline" aria-label="Job progress">
      {JOB_PROGRESS_STAGES.map((stage, index) => {
        const isFinalStage = stage.value === 'completed'
        const isComplete = isFinalStage
          ? isPendingCompletion || currentStatus === 'completed'
          : index < currentIndex || isPendingCompletion
        const isCurrent =
          stage.value === currentStatus || (isFinalStage && isPendingCompletion)
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
