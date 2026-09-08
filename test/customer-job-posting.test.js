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

test('job wizard limits a posting to 20 attachments', async () => {
  const draft = {
    imgs: Array.from({ length: 21 }, (_, index) => `photo-${index}.jpg`),
    description: 'Replace the damaged fence beside the driveway.',
    jobDate: new Date(Date.now() + 86_400_000),
    minBudget: 100,
    maxBudget: 500,
    urgency: 'Normal',
  }

  const errors = validateJobWizardStep(3, draft, [])
  assert.match(errors.imgs, /maximum of 20/i)

  const modal = await readFile(
    new URL(
      '../src/features/service-marketplace/components/PostJobModal.jsx',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(modal, /Maximum 20 photos or videos/)
  assert.match(modal, /GstIncluded/)
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

test('the current database rule permits up to 20 job attachments', async () => {
  const migration = await readFile(
    new URL(
      '../supabase/migrations/20260902000000_standardise_gst_and_job_attachment_limit.sql',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(migration, /cardinality\(image_urls\) <= 20/)
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
