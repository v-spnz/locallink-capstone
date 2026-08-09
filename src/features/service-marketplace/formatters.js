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
