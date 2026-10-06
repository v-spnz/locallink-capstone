export function formatUpdatedAt(value) {
  if (!value) return 'Not saved yet'

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export function getAvailabilityLabel(programme) {
  if (!programme.startDate) return 'Not set'
  if (programme.endDate) {
    return `${formatProgrammeDate(programme.startDate)} – ${formatProgrammeDate(programme.endDate)}`
  }
  return `From ${formatProgrammeDate(programme.startDate)}`
}

export function formatProgrammeDate(value) {
  const [year, month, day] = String(value).split('-').map(Number)
  if (!year || !month || !day) return value

  return new Intl.DateTimeFormat('en-NZ', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Pacific/Auckland',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function getProgrammeTheme(programme) {
  const name = programme.name?.toLowerCase() || ''

  if (/flower|floral|garden|botanical|bloom|plant/.test(name)) {
    return 'loyalty-theme-emerald'
  }
  if (/coffee|cafe|café|bakery|brunch|roast/.test(name)) {
    return 'loyalty-theme-coffee'
  }
  if (
    ['spend_and_save', 'spend_and_reward'].includes(programme.programmeType)
  ) {
    return 'loyalty-theme-emerald'
  }
  if (programme.programmeType === 'purchase_card') {
    return 'loyalty-theme-coffee'
  }
  return 'loyalty-theme-blue'
}

export function formatMetric(value, singular, plural) {
  return `${value} ${Number(value) === 1 ? singular : plural}`
}
