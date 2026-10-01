import { BadgePercent, BriefcaseBusiness, Gift } from 'lucide-react'

export const CAPABILITY_OPTIONS = [
  {
    key: 'deals',
    label: 'Promote deals',
    description: 'Publish useful local offers for nearby customers.',
    icon: BadgePercent,
  },
  {
    key: 'loyalty',
    label: 'Run loyalty programmes',
    description: 'Create repeat-visit rewards and loyalty cards.',
    icon: Gift,
  },
  {
    key: 'serviceMarketplace',
    label: 'Receive service requests',
    description: 'Find local job leads and send quotes.',
    icon: BriefcaseBusiness,
  },
]

export const SETUP_STEPS = [
  { key: 'basics', label: 'Business basics' },
  { key: 'capabilities', label: 'Select tools' },
  { key: 'setup', label: 'Conditional setup' },
  { key: 'review', label: 'Review and finish' },
]

export function listFromInput(value) {
  return [
    ...new Set(
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    ),
  ]
}

export function validateStep(stepToValidate, form, selectedCapabilityCount) {
  if (stepToValidate === 'basics' && form.businessName.trim().length < 2) {
    return 'Enter your business name.'
  }

  if (stepToValidate === 'capabilities' && selectedCapabilityCount === 0) {
    return 'Select at least one way to use LocalLink.'
  }

  if (stepToValidate === 'setup') {
    if (form.deals && form.locations.length === 0) {
      return 'Enter at least one location that can participate in deals.'
    }

    if (
      form.serviceMarketplace &&
      (form.serviceDescription.trim().length < 10 ||
        !form.availability.trim() ||
        listFromInput(form.categories).length === 0 ||
        listFromInput(form.areas).length === 0)
    ) {
      return 'Complete all Service Marketplace details.'
    }
  }

  return ''
}

export function getInvalidFields(stepToValidate, form) {
  if (stepToValidate === 'basics') {
    return form.businessName.trim().length < 2 ? ['businessName'] : []
  }

  if (stepToValidate !== 'setup') return []

  if (form.deals && form.locations.length === 0) return ['location']

  return [
    form.serviceMarketplace && form.serviceDescription.trim().length < 10
      ? 'serviceDescription'
      : '',
    form.serviceMarketplace && !form.availability.trim() ? 'availability' : '',
    form.serviceMarketplace && listFromInput(form.categories).length === 0
      ? 'categories'
      : '',
    form.serviceMarketplace && listFromInput(form.areas).length === 0
      ? 'areas'
      : '',
  ].filter(Boolean)
}
