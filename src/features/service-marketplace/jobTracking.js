export const BUSINESS_JOB_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export const BUSINESS_JOB_ORDER_OPTIONS = [
  { value: 'active_first', label: 'Active first' },
  { value: 'completed_first', label: 'Completed first' },
]

export const JOB_PROGRESS_STAGES = [
  { value: 'accepted', label: 'Accepted' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'on_the_way', label: 'On the way' },
  { value: 'in_progress', label: 'In progress' },
  { value: 'completed', label: 'Completed' },
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
    const firstIsActive = !isJobFullyCompleted(first.job_status)
    const secondIsActive = !isJobFullyCompleted(second.job_status)
    const wantsActiveFirst = order !== 'completed_first'

    const statusDifference = wantsActiveFirst
      ? Number(secondIsActive) - Number(firstIsActive)
      : Number(firstIsActive) - Number(secondIsActive)
    if (statusDifference !== 0) return statusDifference

    return (
      new Date(second.accepted_at).getTime() -
      new Date(first.accepted_at).getTime()
    )
  })
}
