import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { validateJobWizardStep } from '../src/features/service-marketplace/validation.js'

test('job wizard accepts a valid decimal service distance', () => {
  const draft = {
    city: 'Auckland',
    suburb: 'Ponsonby',
    postedDistance: 4.5,
  }

  assert.deepEqual(validateJobWizardStep(4, draft, ['Ponsonby']), {})
})

test('job posting migration provides every field selected by the consumer API', async () => {
  const migration = await readFile(
    new URL(
      '../supabase/migrations/20260811000000_add_job_request_posting_details.sql',
      import.meta.url,
    ),
    'utf8',
  )

  for (const column of ['image_urls', 'job_date', 'budget', 'urgency']) {
    assert.match(migration, new RegExp(`add column if not exists ${column}`))
  }
})

test('seeded jobs use only supported urgency values', async () => {
  const seed = await readFile(
    new URL('../supabase/seed.sql', import.meta.url),
    'utf8',
  )

  for (const outdatedUrgency of [
    'Within a week',
    'As soon as possible',
    'Within three days',
    'Next week',
    'Within two weeks',
    'This weekend',
    'Within a month',
    'Within two days',
    'Work already arranged',
    'No longer required',
  ]) {
    assert.doesNotMatch(seed, new RegExp(`'${outdatedUrgency}'`))
  }
})
