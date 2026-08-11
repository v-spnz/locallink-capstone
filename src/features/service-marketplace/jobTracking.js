export const BUSINESS_JOB_STATUS_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'in_progress', label: 'Active' },
  { value: 'completed', label: 'Completed' },
]

export const BUSINESS_JOB_ORDER_OPTIONS = [
  { value: 'active_first', label: 'Active first' },
  { value: 'completed_first', label: 'Completed first' },
]

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

    return (
      (status === 'all' || job.job_status === status) &&
      (!normalizedSearch || searchableText.includes(normalizedSearch))
    )
  })

  const firstStatus = order === 'completed_first' ? 'completed' : 'in_progress'
  return matchingJobs.toSorted((first, second) => {
    const statusDifference =
      Number(second.job_status === firstStatus) -
      Number(first.job_status === firstStatus)
    if (statusDifference !== 0) return statusDifference

    return (
      new Date(second.accepted_at).getTime() -
      new Date(first.accepted_at).getTime()
    )
  })
}
