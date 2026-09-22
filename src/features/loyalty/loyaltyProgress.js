function formatNumber(value) {
  const number = Number(value)
  if (!Number.isFinite(number)) return '0'
  return new Intl.NumberFormat('en-NZ', {
    maximumFractionDigits: 2,
  }).format(number)
}

function formatCurrency(value) {
  return `$${formatNumber(value)}`
}

export function getLoyaltyProgressPresentation(record) {
  const progress = Math.max(0, Number(record.currentProgress) || 0)
  const target = Math.max(0, Number(record.rewardThreshold) || 0)
  const remaining = Math.max(0, target - progress)
  const isStampCard = record.programmeType === 'stamp_card'

  return {
    progress,
    target,
    percentage: target > 0 ? Math.min(100, (progress / target) * 100) : 0,
    progressLabel: isStampCard
      ? `${formatNumber(progress)} of ${formatNumber(target)} visits`
      : `${formatCurrency(progress)} of ${formatCurrency(target)} spent`,
    remainingLabel: isStampCard
      ? `${formatNumber(remaining)} ${remaining === 1 ? 'visit' : 'visits'} to go`
      : `${formatCurrency(remaining)} to go`,
  }
}

export function getLoyaltyEligibilityLabel(record) {
  if (record.programmeStatus !== 'active') return 'Programme not active'
  return record.rewardEligible ? 'Reward ready' : 'In progress'
}
