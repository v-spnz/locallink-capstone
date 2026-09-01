import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  clearRegistrationFlow,
  getRegistrationResumePath,
  normaliseDestination,
  readRegistrationFlow,
  updateRegistrationFlow,
} from '../src/features/onboarding/registrationFlow.js'
import { toSuburbLocation } from '../src/features/location/suburb.js'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

function withLocalStorage(run) {
  const values = new Map()
  globalThis.window = {
    localStorage: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  }

  try {
    run()
  } finally {
    delete globalThis.window
  }
}

test('registration destinations stay local and preserve route context', () => {
  assert.equal(
    normaliseDestination({
      pathname: '/jobs',
      search: '?tab=requests',
      hash: '#new',
    }),
    '/jobs?tab=requests#new',
  )
  assert.equal(normaliseDestination('https://example.com'), '')
  assert.equal(normaliseDestination('//example.com'), '')
})

test('registration context resumes the correct personal or business branch', () => {
  withLocalStorage(() => {
    updateRegistrationFlow({
      intent: 'personal',
      destination: '/jobs',
      resumeAfterAuth: true,
    })
    assert.equal(getRegistrationResumePath(), '/register?resume=personal')
    assert.equal(readRegistrationFlow().destination, '/jobs')

    updateRegistrationFlow({ intent: 'business' })
    assert.equal(getRegistrationResumePath(), '/business/onboarding')

    clearRegistrationFlow()
    assert.equal(readRegistrationFlow().resumeAfterAuth, false)
  })
})

test('registration stores a suburb without retaining a street address', () => {
  withLocalStorage(() => {
    updateRegistrationFlow({
      location: {
        name: '24 Mount Eden Road',
        formattedAddress: '24 Mount Eden Road, Mount Eden, Auckland 1024',
        addressLine1: '24 Mount Eden Road',
        suburb: 'Mount Eden',
        city: 'Auckland',
        postcode: '1024',
        countryCode: 'nz',
        latitude: -36.875,
        longitude: 174.761,
      },
    })

    assert.deepEqual(readRegistrationFlow().location, {
      name: 'Mount Eden',
      formattedAddress: 'Mount Eden, Auckland',
      addressLine1: 'Mount Eden',
      suburb: 'Mount Eden',
      city: 'Auckland',
      postcode: '',
      countryCode: 'nz',
      latitude: -36.875,
      longitude: 174.761,
      placeId: '',
      resultType: '',
    })
  })
})

test('suburb names take priority over broader local board districts', () => {
  const location = toSuburbLocation({
    name: 'Mount Wellington',
    district: 'Maungakiekie-Tamaki',
    city: 'Auckland',
    resultType: 'suburb',
    countryCode: 'nz',
    latitude: -36.9,
    longitude: 174.84,
  })

  assert.equal(location.suburb, 'Mount Wellington')
  assert.equal(location.formattedAddress, 'Mount Wellington, Auckland')
})

test('registration progressively introduces value before identity creation', async () => {
  const [register, protectedRoute] = await Promise.all([
    read('../src/pages/auth/RegisterPage.jsx'),
    read('../src/auth/ProtectedRoute.jsx'),
  ])

  for (const stage of [
    'WelcomeStep',
    'LocationStep',
    'HowItWorksStep',
    'ChoiceStep',
    'AccountStep',
    'ConfirmLocationStep',
  ]) {
    assert.match(register, new RegExp(stage))
  }

  assert.match(register, /signInWithOAuth/)
  assert.match(register, /provider: 'google'/)
  assert.match(register, /saveCustomerLocation/)
  assert.equal(register.match(/searchType="suburb"/g)?.length, 2)
  assert.match(register, /flow\.destination \|\| '\/home'/)
  assert.match(protectedRoute, /to="\/register"/)
  assert.match(protectedRoute, /startAt: 'choice'/)
})

test('business onboarding separates basics, tools, conditional setup, and review', async () => {
  const onboarding = await read('../src/pages/business/BusinessOnboarding.jsx')

  for (const stage of [
    'BusinessBasicsStep',
    'CapabilitiesStep',
    'ConditionalSetupStep',
    'ReviewStep',
  ]) {
    assert.match(onboarding, new RegExp(stage))
  }

  assert.match(onboarding, /p_locations/)
  assert.match(onboarding, /locations: \[\]/)
  assert.match(onboarding, /clearRegistrationFlow/)
})
