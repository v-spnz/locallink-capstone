const currencyFormatter = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
})

export function formatMoney(amountCents) {
  return currencyFormatter.format(amountCents / 100)
}

export function formatStatus(status = '') {
  return status.replaceAll('_', ' ')
}

export function getOverallJobStatus(jobs) {
  if (jobs.some((job) => job.status === 'in_progress')) return 'In Progress'
  if (jobs.some((job) => job.status === 'open')) return 'Job Posted'
  if (jobs.some((job) => job.status === 'completed')) return 'Completed'
  return 'Not Posted'
}

export function formatRequestError(fallbackMessage, error) {
  if (!import.meta.env.DEV || !error?.message) return fallbackMessage

  const errorCode = error.code ? `${error.code}: ` : ''
  return `${fallbackMessage} (${errorCode}${error.message})`
}

export function getJobBadge(job, quoteCount) {
  if (job.status === 'in_progress') {
    return { label: 'In Progress', tone: 'in-progress' }
  }
  if (job.status === 'completed') {
    return { label: 'Completed', tone: 'completed' }
  }
  if (job.status === 'closed' || job.status === 'cancelled') {
    return { label: formatStatus(job.status), tone: 'completed' }
  }
  return quoteCount > 0
    ? { label: 'Quotes Received', tone: 'quotes-received' }
    : { label: 'Awaiting Quotes', tone: 'awaiting' }
}