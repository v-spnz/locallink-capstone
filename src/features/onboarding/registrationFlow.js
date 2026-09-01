import { toSuburbLocation } from '../location/suburb.js'

const REGISTRATION_FLOW_KEY = 'locallink.registration-flow.v2'

const EMPTY_FLOW = Object.freeze({
  location: null,
  intent: 'personal',
  fullName: '',
  destination: '',
  resumeAfterAuth: false,
})

function storageAvailable() {
  return typeof window !== 'undefined' && Boolean(window.localStorage)
}

export function normaliseDestination(destination) {
  if (!destination) return ''

  if (typeof destination === 'string') {
    return destination.startsWith('/') && !destination.startsWith('//')
      ? destination
      : ''
  }

  const pathname = destination.pathname || ''
  if (!pathname.startsWith('/') || pathname.startsWith('//')) return ''

  return `${pathname}${destination.search || ''}${destination.hash || ''}`
}

export function readRegistrationFlow() {
  if (!storageAvailable()) return { ...EMPTY_FLOW }

  try {
    const stored = JSON.parse(
      window.localStorage.getItem(REGISTRATION_FLOW_KEY) || '{}',
    )

    return {
      ...EMPTY_FLOW,
      ...stored,
      location: toSuburbLocation(stored.location),
      intent: stored.intent === 'business' ? 'business' : 'personal',
      destination: normaliseDestination(stored.destination),
      resumeAfterAuth: Boolean(stored.resumeAfterAuth),
    }
  } catch {
    return { ...EMPTY_FLOW }
  }
}

export function updateRegistrationFlow(changes) {
  const nextFlow = {
    ...readRegistrationFlow(),
    ...changes,
  }

  nextFlow.intent = nextFlow.intent === 'business' ? 'business' : 'personal'
  nextFlow.location = toSuburbLocation(nextFlow.location)
  nextFlow.destination = normaliseDestination(nextFlow.destination)
  nextFlow.resumeAfterAuth = Boolean(nextFlow.resumeAfterAuth)

  if (storageAvailable()) {
    window.localStorage.setItem(REGISTRATION_FLOW_KEY, JSON.stringify(nextFlow))
  }

  return nextFlow
}

export function clearRegistrationFlow() {
  if (storageAvailable()) {
    window.localStorage.removeItem(REGISTRATION_FLOW_KEY)
  }
}

export function getRegistrationResumePath() {
  const flow = readRegistrationFlow()
  if (!flow.resumeAfterAuth) return ''

  return flow.intent === 'business'
    ? '/business/onboarding'
    : '/register?resume=personal'
}

export function getStoredGuestLocation() {
  return readRegistrationFlow().location || null
}

export function storeGuestLocation(location) {
  return updateRegistrationFlow({ location: toSuburbLocation(location) })
    .location
}
