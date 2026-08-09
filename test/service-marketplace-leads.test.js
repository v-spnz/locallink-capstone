import assert from 'node:assert/strict'
import test from 'node:test'
import {
  filterAndSortLeads,
  getLeadDisplayDetails,
  isAvailableLead,
  matchesBusinessProfile,
} from '../src/features/service-marketplace/leadFilters.js'

const NOW = new Date('2026-08-09T00:00:00Z')

function lead(overrides = {}) {
  return {
    job_request_id: crypto.randomUUID(),
    title: 'Repair leaking kitchen tap',
    category: 'Plumbing',
    suburb: 'Mount Eden',
    city: 'Auckland',
    requested_timing: 'Within a week',
    job_status: 'open',
    quote_count: 1,
    max_quotes: 5,
    quote_deadline: '2026-08-12T00:00:00Z',
    created_at: '2026-08-08T00:00:00Z',
    ...overrides,
  }
}

test('only jobs matching the business service and area are eligible', () => {
  const services = ['Plumbing']
  const areas = ['Mount Eden']

  assert.equal(matchesBusinessProfile(lead(), services, areas), true)
  assert.equal(
    matchesBusinessProfile(lead({ category: 'Electrical' }), services, areas),
    false,
  )
  assert.equal(
    matchesBusinessProfile(lead({ suburb: 'Takapuna' }), services, areas),
    false,
  )
})

test('open jobs before their deadline and below their quote limit are available', () => {
  assert.equal(isAvailableLead(lead(), NOW), true)
})

test('lead details include every field required by the job card', () => {
  assert.deepEqual(getLeadDisplayDetails(lead()), {
    title: 'Repair leaking kitchen tap',
    category: 'Plumbing',
    suburb: 'Mount Eden',
    requestedTiming: 'Within a week',
    quoteCount: 1,
    maxQuotes: 5,
    quoteDeadline: '2026-08-12T00:00:00Z',
  })
})

test('closed, expired, withdrawn, and fully quoted jobs are unavailable', () => {
  for (const unavailableLead of [
    lead({ job_status: 'closed' }),
    lead({ quote_deadline: '2026-08-08T23:59:59Z' }),
    lead({ job_status: 'withdrawn' }),
    lead({ quote_count: 5, max_quotes: 5 }),
  ]) {
    assert.equal(isAvailableLead(unavailableLead, NOW), false)
  }
})

test('jobs can be searched by service or suburb and filtered by category', () => {
  const jobs = [
    lead(),
    lead({
      title: 'Replace a switch',
      category: 'Electrical',
      suburb: 'Ponsonby',
    }),
  ]

  assert.deepEqual(
    filterAndSortLeads(jobs, { search: 'plumb', now: NOW }).map(
      (item) => item.category,
    ),
    ['Plumbing'],
  )
  assert.deepEqual(
    filterAndSortLeads(jobs, { search: 'ponsonby', now: NOW }).map(
      (item) => item.category,
    ),
    ['Electrical'],
  )
  assert.deepEqual(
    filterAndSortLeads(jobs, { category: 'Electrical', now: NOW }).map(
      (item) => item.category,
    ),
    ['Electrical'],
  )
})

test('urgency orders jobs by the soonest quote deadline', () => {
  const jobs = [
    lead({ title: 'Later', quote_deadline: '2026-08-15T00:00:00Z' }),
    lead({ title: 'Sooner', quote_deadline: '2026-08-10T00:00:00Z' }),
  ]

  assert.deepEqual(
    filterAndSortLeads(jobs, { sort: 'urgency', now: NOW }).map(
      (item) => item.title,
    ),
    ['Sooner', 'Later'],
  )
})
