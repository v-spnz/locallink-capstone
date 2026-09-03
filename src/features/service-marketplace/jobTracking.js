export const BUSINESS_JOB_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'Active' },
]

export const BUSINESS_JOB_ORDER_OPTIONS = [
  { value: 'active_first', label: 'Recently updated' },
  { value: 'completed_first', label: 'Oldest updated' },
]

export const JOB_PROGRESS_STAGES = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'on_the_way', label: 'On the way' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
]

export const JOB_PROGRESS_TIMELINE_STAGES = [
  JOB_PROGRESS_STAGES[0],
  {
    value: 'contact_details_shared',
    label: 'Contact details shared',
    timelineOnly: true,
  },
  ...JOB_PROGRESS_STAGES.slice(1),
]

const JOB_PROGRESS_ORDER = JOB_PROGRESS_STAGES.map((stage) => stage.value)

export const JOB_COMPLETION_PENDING_STATUS = 'pending_completion'

export function formatJobProgressStage(status) {
  if (status === JOB_COMPLETION_PENDING_STATUS) {
    return 'Completed - awaiting customer confirmation'
  }
  const stage = JOB_PROGRESS_STAGES.find((item) => item.value === status)
  return stage?.label ?? String(status ?? '').replaceAll('_', ' ')
}

export function isJobFullyCompleted(status) {
  return status === 'completed'
}

export function getNextJobProgressStage(currentStatus) {
  if (currentStatus === JOB_COMPLETION_PENDING_STATUS) return null

  const currentIndex = JOB_PROGRESS_ORDER.indexOf(currentStatus)
  if (currentIndex === -1 || currentIndex === JOB_PROGRESS_ORDER.length - 1) {
    return null
  }

  const nextStatus = JOB_PROGRESS_ORDER[currentIndex + 1]
  return nextStatus === 'completed' ? JOB_COMPLETION_PENDING_STATUS : nextStatus
}

export function isValidJobProgressTransition(currentStatus, newStatus) {
  return (
    Boolean(newStatus) && getNextJobProgressStage(currentStatus) === newStatus
  )
}

export function getLatestJobStatusUpdate(job) {
  if (!job) return null
  const history = Array.isArray(job.status_history) ? job.status_history : []
  const latest = history[history.length - 1]

  return {
    status: latest?.status ?? job.job_status,
    updatedAt:
      latest?.updated_at ?? job.status_updated_at ?? job.accepted_at ?? null,
  }
}

export function formatJobStatusTimestamp(isoString) {
  if (!isoString) return ''
  const date = new Date(isoString)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleString('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function filterBusinessJobs(
  jobs,
  { status = 'all', search = '', order = 'active_first' } = {},
) {
  const normalizedSearch = search.trim().toLocaleLowerCase('en-NZ')
  const matchingJobs = jobs.filter((job) => {
    const searchableText = [
      job.title,
      job.description,
      job.suburb,
      job.city,
      job.category,
    ]
      .map((value) => String(value ?? '').toLocaleLowerCase('en-NZ'))
      .join(' ')

    const isCompleted = isJobFullyCompleted(job.job_status)
    const matchesStatus =
      status === 'all' || (status === 'completed' ? isCompleted : !isCompleted)

    return (
      matchesStatus &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    )
  })

  return matchingJobs.toSorted((first, second) => {
    const firstUpdatedAt = new Date(
      first.status_updated_at ?? first.accepted_at ?? 0,
    ).getTime()
    const secondUpdatedAt = new Date(
      second.status_updated_at ?? second.accepted_at ?? 0,
    ).getTime()
    const direction = order === 'completed_first' ? 1 : -1
    return (firstUpdatedAt - secondUpdatedAt) * direction
  })
}
