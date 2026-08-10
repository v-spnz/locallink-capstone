import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { formatStatus } from '../src/features/service-marketplace/formatters.js'
import { validateQuote } from '../src/features/service-marketplace/validation.js'

const VALID_QUOTE = {
  priceType: 'fixed',
  amount: '185.50',
  availability: '2026-08-12',
  arrivalWindow: '8:00–10:00 AM',
  includedWork: 'Labour and replacement tap washer',
  conditions: 'Price assumes the existing fitting is reusable',
  expectedDuration: 'Around 2 hours',
  message: '',
}

const TODAY = new Date(2026, 7, 10)

test('AC1: all required quote details are accepted when complete', () => {
  assert.deepEqual(validateQuote(VALID_QUOTE, TODAY), {})
})

test('AC2: a consumer message is optional', () => {
  assert.deepEqual(validateQuote({ ...VALID_QUOTE, message: '' }, TODAY), {})
})

test('AC3: every missing required quote field is identified', () => {
  const errors = validateQuote(
    {
      priceType: '',
      amount: '',
      availability: '',
      arrivalWindow: '',
      includedWork: '',
      conditions: '',
      expectedDuration: '',
      message: '',
    },
    TODAY,
  )

  assert.deepEqual(Object.keys(errors).sort(), [
    'amount',
    'arrivalWindow',
    'availability',
    'conditions',
    'expectedDuration',
    'includedWork',
    'priceType',
  ])
})

test('AC3: invalid price and past availability are identified', () => {
  const errors = validateQuote(
    { ...VALID_QUOTE, amount: '0', availability: '2026-08-09' },
    TODAY,
  )
  assert.match(errors.amount, /valid quote price/i)
  assert.match(errors.availability, /past/i)
})

test('AC4: quote entry leads to review and only review confirms submission', async () => {
  const [form, review] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/QuoteForm.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/QuoteReview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(form, /Review quote/)
  assert.doesNotMatch(form, /Confirm and submit/)
  assert.match(review, /Review your quote/)
  assert.match(review, /Confirm and submit/)
})

test('AC7: submitted quotes display Awaiting response', () => {
  assert.equal(formatStatus('awaiting_response'), 'Awaiting response')
})

test('AC5-6: database submission enforces the working-day window and three-quote/open limits', async () => {
  const migration = await readFile(
    new URL(
      '../supabase/migrations/20260810000000_complete_provider_quote_submission.sql',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(
    migration,
    /now\(\) <= public\.three_working_days_after\(job\.created_at\)/,
  )
  assert.match(migration, /job\.status = 'open'/)
  assert.match(migration, /\) < 3/)
  assert.match(migration, /for update/)
})
