import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  BUSINESS_QUOTE_STATUS_OPTIONS,
  filterBusinessQuotes,
  formatBusinessQuoteStatus,
  formatConsumerResponseCountdown,
  formatResponseTimeRemaining,
  getBusinessQuoteResponseDeadline,
  getBusinessQuoteResponseReminderThreshold,
  getBusinessQuoteTimeline,
  isBusinessQuoteResponseDeadlineUrgent,
} from '../src/features/service-marketplace/quoteTracking.js'

const migrationUrl = new URL(
  '../supabase/migrations/20260814005000_track_provider_quote_outcomes.sql',
  import.meta.url,
)
const quoteJobDetailsMigrationUrl = new URL(
  '../supabase/migrations/20260818020000_expose_job_details_with_business_quotes.sql',
  import.meta.url,
)

test('AC1: every provider quote outcome has the required display status', () => {
  assert.equal(BUSINESS_QUOTE_STATUS_OPTIONS[0].label, 'All')
  assert.deepEqual(
    BUSINESS_QUOTE_STATUS_OPTIONS.slice(1).map(({ label }) => label),
    [
      'Awaiting response',
      'Declined',
      'Expired',
      'Withdrawn',
      'Request withdrawn',
    ],
  )
  assert.equal(formatBusinessQuoteStatus('declined'), 'Declined')
  assert.equal(
    formatBusinessQuoteStatus('request_withdrawn'),
    'Request withdrawn',
  )
})

test('AC1: database derives declined, expired, and request-withdrawn outcomes', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  assert.match(migration, /quote\.status = 'rejected' then 'declined'/)
  assert.match(migration, /then 'expired'/)
  assert.match(migration, /then 'request_withdrawn'/)
})

test('AC2: quotes can be filtered by their current status', () => {
  const quotes = [
    { quote_id: '1', quote_status: 'accepted' },
    { quote_id: '2', quote_status: 'expired' },
    { quote_id: '3', quote_status: 'accepted' },
  ]
  assert.deepEqual(filterBusinessQuotes(quotes, { status: 'accepted' }), [
    quotes[0],
    quotes[2],
  ])
  assert.deepEqual(filterBusinessQuotes(quotes, { status: 'all' }), quotes)
})

test('quotes can be searched and ordered', () => {
  const quotes = [
    {
      quote_id: '1',
      title: 'Kitchen tap',
      created_at: '2026-08-10T00:00:00Z',
    },
    {
      quote_id: '2',
      title: 'Bathroom sink',
      created_at: '2026-08-11T00:00:00Z',
    },
  ]

  assert.deepEqual(filterBusinessQuotes(quotes, { search: 'kitchen' }), [
    quotes[0],
  ])
  assert.deepEqual(filterBusinessQuotes(quotes, { order: 'oldest' }), quotes)
})

test('AC3: awaiting quotes show the remaining consumer response period', () => {
  const now = new Date('2026-08-10T00:00:00Z')
  assert.equal(
    formatResponseTimeRemaining('2026-08-12T03:00:00Z', now),
    '2 days 3 hours remaining',
  )
  assert.equal(
    formatResponseTimeRemaining('2026-08-09T00:00:00Z', now),
    'Response period ended',
  )
})

test('AC3: missing database deadline falls back to five working days after submission', () => {
  const deadline = getBusinessQuoteResponseDeadline({
    created_at: '2026-08-07T10:30:00Z',
  })
  assert.equal(deadline.toISOString(), '2026-08-14T10:30:00.000Z')
  assert.equal(getBusinessQuoteResponseDeadline({ created_at: null }), null)
})

test('awaiting quotes become urgent when three working days remain', () => {
  const quote = {
    quote_status: 'awaiting_response',
    response_deadline: '2026-08-17T09:00:00Z',
  }

  assert.equal(
    getBusinessQuoteResponseReminderThreshold(quote).toISOString(),
    '2026-08-12T09:00:00.000Z',
  )
  assert.equal(
    isBusinessQuoteResponseDeadlineUrgent(quote, '2026-08-12T08:59:59Z'),
    false,
  )
  assert.equal(
    isBusinessQuoteResponseDeadlineUrgent(quote, '2026-08-12T09:00:00Z'),
    true,
  )
  assert.equal(
    isBusinessQuoteResponseDeadlineUrgent(quote, '2026-08-17T09:00:01Z'),
    false,
  )
})

test('the three-working-day urgency threshold skips weekends', () => {
  const quote = {
    quote_status: 'awaiting_response',
    response_deadline: '2026-08-20T09:00:00Z',
  }

  assert.equal(
    getBusinessQuoteResponseReminderThreshold(quote).toISOString(),
    '2026-08-17T09:00:00.000Z',
  )
})

test('consumer response countdowns count working days then switch to hours', () => {
  const deadline = '2026-08-17T09:00:00Z'

  assert.equal(
    formatConsumerResponseCountdown(deadline, '2026-08-12T09:00:00Z'),
    '3 days',
  )
  assert.equal(
    formatConsumerResponseCountdown(deadline, '2026-08-16T09:00:00Z'),
    '24 hours',
  )
  assert.equal(
    formatConsumerResponseCountdown(deadline, '2026-08-16T08:30:00Z'),
    '1 day',
  )
  assert.equal(
    formatConsumerResponseCountdown(deadline, '2026-08-17T08:15:00Z'),
    '1 hour',
  )
})

test('quote timeline shows progress and ends at terminal outcomes', () => {
  assert.deepEqual(
    getBusinessQuoteTimeline({ quote_status: 'awaiting_response' }),
    [
      { label: 'Submitted', state: 'complete' },
      { label: 'Awaiting response', state: 'current' },
    ],
  )
  assert.deepEqual(getBusinessQuoteTimeline({ quote_status: 'withdrawn' }), [
    { label: 'Submitted', state: 'complete' },
    { label: 'Withdrawn', state: 'current' },
  ])
  assert.deepEqual(getBusinessQuoteTimeline({ quote_status: 'declined' }), [
    { label: 'Submitted', state: 'complete' },
    { label: 'Declined', state: 'current' },
  ])
  assert.deepEqual(getBusinessQuoteTimeline({ quote_status: 'accepted' }), [
    { label: 'Submitted', state: 'complete' },
    { label: 'Awaiting response', state: 'complete' },
  ])
})

test('awaiting timeline owns the consumer deadline instead of a separate card', async () => {
  const [timeline, card] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/BusinessQuoteTimeline.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/BusinessQuoteCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])
  assert.match(timeline, /Consumer deadline:/)
  assert.doesNotMatch(timeline, /formatResponseTimeRemaining/)
  assert.match(timeline, /formatConsumerResponseCountdown/)
  assert.match(timeline, /service-quote-timeline-deadline.*is-urgent/)
  assert.match(timeline, /is-deadline-urgent/)
  assert.match(timeline, /month: 'short'/)
  assert.doesNotMatch(card, /service-response-period/)
})

test('quote details reveal the timeline and withdrawal controls on demand', async () => {
  const [card, page, hook] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/BusinessQuoteCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/pages/business/ServiceMarketplacePage.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/hooks/useBusinessMarketplace.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(card, /isDetailsOpen \? 'Hide details' : 'View details'/)
  const collapsedSummary = card.slice(
    card.indexOf('<div className="service-quote-card-summary">'),
    card.indexOf('{isDetailsOpen &&'),
  )
  assert.doesNotMatch(collapsedSummary, /formatMoney/)
  assert.doesNotMatch(collapsedSummary, /formatBusinessQuoteStatus/)
  assert.match(
    card,
    /\{isDetailsOpen && \([\s\S]+<BusinessQuoteTimeline quote=\{item\} \/>[\s\S]+Withdraw quote/,
  )
  assert.match(page, /marketplace\.reviewedQuote === item\.quote_id/)
  assert.match(page, /marketplace\.toggleQuoteReview\(item\.quote_id\)/)
  assert.match(
    hook,
    /const \[reviewedQuote, setReviewedQuote\] = useState\(null\)/,
  )
  assert.match(
    hook,
    /setReviewedQuote\(\(current\) => \(current === quoteId \? null : quoteId\)\)/,
  )
})

test('expanded quotes include the original lead details and attachments', async () => {
  const [card, migration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/BusinessQuoteCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(quoteJobDetailsMigrationUrl, 'utf8'),
  ])

  assert.match(card, /Original job request/)
  assert.match(card, /Your submitted quote/)
  assert.match(card, /item\.category/)
  assert.match(card, /item\.urgency/)
  assert.match(card, /item\.quote_deadline/)
  assert.match(card, /getLeadMedia\(item\.image_urls\)/)
  assert.match(card, /Photos and videos/)
  assert.match(card, /exact address and contact details stay private/)
  assert.match(migration, /urgency text/)
  assert.match(migration, /image_urls text\[\]/)
  assert.match(migration, /quote_deadline timestamptz/)
  assert.match(migration, /job\.urgency::text/)
  assert.match(migration, /job\.image_urls::text\[\]/)
})

test('timeline colours distinguish active and terminal outcomes', async () => {
  const [timeline, styles] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/BusinessQuoteTimeline.jsx',
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
  assert.match(timeline, /quote\.quote_status === 'accepted'/)
  assert.match(
    timeline,
    /quote\.quote_status === 'awaiting_response' &&[\s\S]+step\.label === 'Awaiting response'/,
  )
  assert.match(styles, /service-quote-timeline\.is-success/)
  assert.match(styles, /service-quote-timeline\.is-terminal/)
  assert.match(styles, /service-quote-timeline\.is-deadline-urgent/)
  assert.match(styles, /var\(--emerald\)/)
  assert.match(styles, /#c92a2a/)
  assert.match(styles, /#f59f00/)
  assert.match(styles, /#c2410c/)
  assert.match(styles, /#facc15/)
  assert.match(styles, /#a16207/)
  assert.match(styles, /@keyframes service-quote-timeline-pulse/)
  assert.match(styles, /animation: service-quote-timeline-pulse/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.match(
    styles,
    /linear-gradient\([\s\S]+var\(--emerald\) 0 50%[\s\S]+#c92a2a 50% 100%/,
  )
})

test('AC4: consumer response is enforced for five working days', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  assert.match(migration, /while v_days_added < 5/)
  assert.match(
    migration,
    /now\(\) > public\.five_working_days_after\(v_quote_created_at\)/,
  )
  assert.match(migration, /response period has expired/)
})

test('AC5: an accepted quote links to the business active job', async () => {
  const component = await readFile(
    new URL(
      '../src/features/service-marketplace/components/BusinessQuoteCard.jsx',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(component, /item\.quote_status === 'accepted'/)
  assert.match(component, /to="\/business\/services\?tab=jobs"/)
})

test('accepted quotes leave quote tracking and completed jobs leave active jobs', async () => {
  const [migration, api] = await Promise.all([
    readFile(
      new URL(
        '../supabase/migrations/20260816000000_separate_job_history_and_add_business_notifications.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/api/businessJobs.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /quote\.status <> 'accepted'/)
  assert.match(
    migration,
    /create function public\.get_business_job_history[\s\S]+job\.status = 'completed'/,
  )
  assert.match(api, /item\.quote_status !== 'accepted'/)
  assert.match(api, /item\.job_status !== 'completed'/)
  assert.match(api, /item\.job_status === 'completed'/)
})

test('AC6: awaiting quote withdrawal requires explicit confirmation', async () => {
  const component = await readFile(
    new URL(
      '../src/features/service-marketplace/components/BusinessQuoteCard.jsx',
      import.meta.url,
    ),
    'utf8',
  )
  assert.match(component, /Withdraw this quote\?/)
  assert.match(component, /Confirm withdrawal/)
  assert.match(component, /Keep quote/)
})

test('AC7: withdrawn quotes cannot be accepted, edited, or resubmitted', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  assert.match(migration, /if old\.status = 'withdrawn' then/)
  assert.match(migration, /withdrawn quote can no longer be edited/i)
  assert.match(
    migration,
    /v_quote_status <> 'awaiting_response' or v_job_status <> 'open'/,
  )
})

test('submitted quotes are removed from job leads and remain in quote tracking', async () => {
  const [migration, api] = await Promise.all([
    readFile(
      new URL(
        '../supabase/migrations/20260814020000_hide_submitted_quotes_from_leads.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/api/businessJobs.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])
  assert.match(
    migration,
    /not exists \([\s\S]+public\.job_quotes as own_quote[\s\S]+own_quote\.business_id = p_business_id/,
  )
  assert.match(api, /type === 'leads'[\s\S]+!item\.has_quote/)
})
