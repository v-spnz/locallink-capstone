import assert from 'node:assert/strict'
import test from 'node:test'
import {
  getInvalidFields,
  listFromInput,
  validateStep,
} from '../src/features/business-onboarding/businessOnboarding.js'

const form = {
  businessName: '',
  deals: true,
  serviceMarketplace: true,
  locations: [],
  serviceDescription: '',
  availability: '',
  categories: '',
  areas: '',
}

test('onboarding keeps its step errors and location-first setup priority', () => {
  assert.equal(validateStep('basics', form, 0), 'Enter your business name.')
  assert.deepEqual(getInvalidFields('basics', form), ['businessName'])
  assert.equal(
    validateStep('capabilities', form, 0),
    'Select at least one way to use LocalLink.',
  )
  assert.deepEqual(getInvalidFields('capabilities', form), [])
  assert.equal(
    validateStep('setup', form, 2),
    'Enter at least one location that can participate in deals.',
  )
  assert.deepEqual(getInvalidFields('setup', form), ['location'])
})

test('service setup marks every missing field after the deal location is present', () => {
  const withLocation = { ...form, locations: [{ formattedAddress: 'Example' }] }
  assert.equal(
    validateStep('setup', withLocation, 2),
    'Complete all Service Marketplace details.',
  )
  assert.deepEqual(getInvalidFields('setup', withLocation), [
    'serviceDescription',
    'availability',
    'categories',
    'areas',
  ])
  assert.equal(
    validateStep(
      'setup',
      {
        ...withLocation,
        serviceDescription: 'Plumbing services',
        availability: 'Weekdays',
        categories: 'Plumbing, Roofing',
        areas: 'Takapuna, Albany',
      },
      2,
    ),
    '',
  )
})

test('comma-separated setup inputs retain order while trimming and deduplicating', () => {
  assert.deepEqual(listFromInput(' Plumbing, Roofing, Plumbing, , Albany '), [
    'Plumbing',
    'Roofing',
    'Albany',
  ])
})
