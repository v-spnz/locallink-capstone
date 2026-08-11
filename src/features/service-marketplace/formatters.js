const currencyFormatter = new Intl.NumberFormat('en-NZ', {
  style: 'currency',
  currency: 'NZD',
})

export function formatMoney(amountCents) {
  return currencyFormatter.format(amountCents / 100)
}

export function formatStatus(status = '') {
  if (status === 'awaiting_response' || status === 'submitted')
    return 'Awaiting response'
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
export function formatBudgetRange(minBudget, maxBudget) {
  if (minBudget == null && maxBudget == null) return null
  if (minBudget != null && maxBudget != null)
    return `$${minBudget} - $${maxBudget}`
  if (minBudget != null) return `$${minBudget}+`
  return `Up to $${maxBudget}`
}

export function parseBudgetRange(budget) {
  if (!budget) return { minBudget: null, maxBudget: null }

  const rangeMatch = budget.match(/^\$(\d+) - \$(\d+)$/)
  if (rangeMatch)
    return {
      minBudget: Number(rangeMatch[1]),
      maxBudget: Number(rangeMatch[2]),
    }

  const minOnlyMatch = budget.match(/^\$(\d+)\+$/)
  if (minOnlyMatch)
    return { minBudget: Number(minOnlyMatch[1]), maxBudget: null }

  const maxOnlyMatch = budget.match(/^Up to \$(\d+)$/)
  if (maxOnlyMatch)
    return { minBudget: null, maxBudget: Number(maxOnlyMatch[1]) }

  return { minBudget: null, maxBudget: null }
}
