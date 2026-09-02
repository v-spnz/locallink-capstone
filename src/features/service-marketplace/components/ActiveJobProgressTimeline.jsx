import { Check } from 'lucide-react'
import {
  JOB_PROGRESS_STAGES,
  JOB_PROGRESS_TIMELINE_STAGES,
  formatJobStatusTimestamp,
} from '../jobTracking'

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
  const currentTimelinePosition =
    currentStatus === 'accepted' ? 0.5 : currentIndex

  if (currentIndex === -1 && !isPendingCompletion) return null

  return (
    <ol className="service-job-progress-timeline" aria-label="Job progress">
      {JOB_PROGRESS_TIMELINE_STAGES.map((stage, index) => {
        const isFinalStage = stage.value === 'completed'
        const stagePosition = stage.timelineOnly
          ? 0.5
          : JOB_PROGRESS_STAGES.findIndex(
              (progressStage) => progressStage.value === stage.value,
            )
        const isComplete = isFinalStage
          ? isPendingCompletion || currentStatus === 'completed'
          : stagePosition < currentTimelinePosition || isPendingCompletion
        const isCurrent =
          stage.value === currentStatus ||
          (stage.timelineOnly && currentStatus === 'accepted') ||
          (isFinalStage && isPendingCompletion)
        const updatedAt =
          (stage.timelineOnly
            ? (job.contact_details?.shared_at ??
              timestampByStatus.accepted ??
              job.accepted_at)
            : timestampByStatus[stage.value]) ??
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
