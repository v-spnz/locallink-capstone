import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { formatStatus } from '../src/features/service-marketplace/formatters.js'
import {
  sanitizeQuoteAmount,
  validateQuote,
} from '../src/features/service-marketplace/validation.js'

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

test('quote price accepts currency digits only', () => {
  assert.equal(sanitizeQuoteAmount('1e3'), '13')
  assert.equal(sanitizeQuoteAmount('$1,285.459'), '1285.45')
  assert.equal(sanitizeQuoteAmount('abc'), '')
  assert.match(
    validateQuote({ ...VALID_QUOTE, amount: '1e3' }, TODAY).amount,
    /valid quote price/i,
  )
})

test('quote price, date, and arrival controls use consistent interactions and spacing', async () => {
  const [form, styles] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/QuoteForm.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/ServiceMarketplace.css',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(
    form,
    /className="service-quote-field service-quote-availability-field"/,
  )
  assert.match(form, /event\.currentTarget\.showPicker\(\)/)
  assert.match(form, /onClick=\{openAvailabilityPicker\}/)
  assert.match(
    styles,
    /\.service-quote-field,[\s\S]*\.service-arrival-window-field \{[\s\S]*align-content: start/,
  )
  assert.match(styles, /\.service-quote-form-grid \{[\s\S]*align-items: start/)
  assert.match(
    styles,
    /\.service-price-prefix \{[\s\S]*pointer-events: none;[\s\S]*user-select: none/,
  )
})

test('quote field titles do not activate controls outside their boxes', async () => {
  const form = await readFile(
    new URL(
      '../src/features/service-marketplace/components/QuoteForm.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.doesNotMatch(form, /<label/)
  assert.match(form, /id="quote-price-type-label"/)
  assert.match(form, /aria-labelledby="quote-price-type-label"/)
  assert.match(form, /id="quote-availability-label"/)
  assert.match(form, /aria-labelledby="quote-availability-label"/)
  assert.match(
    form,
    /aria-labelledby="quote-arrival-window-label quote-arrival-start-label"/,
  )
  assert.match(form, /aria-labelledby="quote-included-work-label"/)
})

test('interactive and typing controls use the expected cursor', async () => {
  const styles = await readFile(
    new URL('../src/styles/base.css', import.meta.url),
    'utf8',
  )

  assert.match(styles, /button:not\(:disabled\)/)
  assert.match(styles, /select:not\(:disabled\)/)
  assert.match(styles, /input\[type='date'\]:not\(:disabled\)/)
  assert.match(styles, /cursor: pointer/)
  assert.match(styles, /input\[type='text'\]/)
  assert.match(styles, /textarea/)
  assert.match(styles, /cursor: text/)
  assert.match(styles, /cursor: not-allowed/)
})

test('business form field containers do not enlarge their control hit areas', async () => {
  const [onboarding, marketplace] = await Promise.all([
    readFile(
      new URL('../src/pages/business/BusinessOnboarding.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/pages/business/ServiceMarketplacePage.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.doesNotMatch(
    onboarding,
    /<label className="business-onboarding-field"/,
  )
  assert.match(onboarding, /aria-labelledby="business-name-label"/)
  assert.match(onboarding, /aria-labelledby="business-availability-label"/)
  assert.doesNotMatch(
    marketplace,
    /<label className="service-marketplace-search"/,
  )
  assert.match(marketplace, /aria-labelledby="service-leads-search-label"/)
  assert.match(marketplace, /aria-labelledby="service-history-search-label"/)
})

test('returning to the browser tab does not reload and unmount the business portal', async () => {
  const [authProvider, businessProvider] = await Promise.all([
    readFile(new URL('../src/auth/AuthProvider.jsx', import.meta.url), 'utf8'),
    readFile(
      new URL('../src/business/BusinessProvider.jsx', import.meta.url),
      'utf8',
    ),
  ])

  assert.match(authProvider, /const isSameSession/)
  assert.match(authProvider, /isSameSession \? currentSession : nextSession/)
  assert.match(businessProvider, /const userId = user\?\.id \?\? null/)
  assert.match(businessProvider, /\[isAuthLoading, userId\]/)
  assert.match(businessProvider, /isLoading: !current\.business/)
  assert.doesNotMatch(businessProvider, /\[isAuthLoading, user\]/)
})

test('arrival window requires an end time after its start time', () => {
  const errors = validateQuote(
    {
      ...VALID_QUOTE,
      arrivalStart: '14:00',
      arrivalEnd: '09:00',
    },
    TODAY,
  )
  assert.match(errors.arrivalWindow, /after the start time/i)
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
  assert.match(form, /QUOTE_ARRIVAL_TIMES/)
  assert.match(form, /onChange\('arrivalStart'/)
  assert.match(form, /onChange\('arrivalEnd'/)
  assert.match(form, /QUOTE_DURATION_OPTIONS/)
  assert.match(form, /service-required-mark/)
  assert.match(form, /Price type[\s\S]+service-required-mark/)
  assert.match(form, /className="service-price-prefix"/)
  assert.match(form, /inputMode="decimal"/)
  assert.match(form, /sanitizeQuoteAmount/)
  assert.match(form, /GstIncluded/)
  assert.doesNotMatch(
    form,
    /Message to customer \(optional\)[\s\S]{0,80}service-required-mark/,
  )
  assert.doesNotMatch(form, /Confirm and send/)
  assert.match(review, /Review your quote/)
  assert.match(review, /GstIncluded/)
  assert.match(review, /Confirm and send/)
})

test('quote submission opens in a modal instead of expanding inside job details', async () => {
  const card = await readFile(
    new URL(
      '../src/features/service-marketplace/components/LeadCard.jsx',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(card, /<Modal onClose=\{onQuote\}/)
  assert.match(card, /className="service-quote-modal"/)
  assert.match(card, /className="service-quote-workspace"/)
  assert.match(card, /className="service-quote-job-context"/)
  assert.match(card, /<LeadMediaGrid media=\{media\}/)
  assert.match(card, /aria-label="Close quote form"/)
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
