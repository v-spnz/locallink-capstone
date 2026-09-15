export const LOYALTY_TEMPLATES = [
  {
    value: 'stamp_card',
    label: 'Stamp card',
    description: 'Complete purchases or visits and get the next one free.',
  },
  {
    value: 'spend_and_save',
    label: 'Spend and save',
    description: 'Spend a set amount to receive money off.',
  },
  {
    value: 'spend_and_reward',
    label: 'Spend and reward',
    description: 'Spend a set amount to receive a free item.',
  },
]

export function getProgrammeTypeLabel(type) {
  return (
    LOYALTY_TEMPLATES.find((template) => template.value === type)?.label ||
    'Programme type not set'
  )
}

function formatNumber(value) {
  return Number(value).toString()
}

export function getRewardTarget(programme) {
  if (!programme.rewardThreshold) return 'Set a reward target'
  return programme.programmeType === 'stamp_card'
    ? `${formatNumber(programme.rewardThreshold)} purchases or visits`
    : `$${formatNumber(programme.rewardThreshold)} spend`
}

export function getCustomerReward(programme) {
  if (programme.programmeType === 'stamp_card')
    return 'Next purchase or visit free'
  if (programme.programmeType === 'spend_and_save')
    return programme.rewardValue
      ? `$${formatNumber(programme.rewardValue)} off`
      : ''
  return programme.rewardDescription || ''
}

export function getEarningRules(programme) {
  if (!programme.rewardThreshold) return ''
  if (programme.programmeType === 'stamp_card')
    return `Complete ${formatNumber(programme.rewardThreshold)} purchases or visits to receive the next one free.`
  if (programme.programmeType === 'spend_and_save' && programme.rewardValue)
    return `Spend $${formatNumber(programme.rewardThreshold)} to receive $${formatNumber(programme.rewardValue)} off.`
  if (
    programme.programmeType === 'spend_and_reward' &&
    programme.rewardDescription
  )
    return `Spend $${formatNumber(programme.rewardThreshold)} to receive a free ${programme.rewardDescription.trim()}.`
  return ''
}
