import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getMarketplaceEmptyMessage } from '../src/features/service-marketplace/constants.js'
import {
  filterAndSortLeads,
  getLeadDisplayDetails,
  isAvailableLead,
  isUrgentLead,
  matchesBusinessProfile,
} from '../src/features/service-marketplace/leadFilters.js'

const NOW = new Date('2026-08-09T00:00:00Z')

function lead(overrides = {}) {
  return {
    job_request_id: crypto.randomUUID(),
    title: 'Repair leaking kitchen tap',
    description: 'The kitchen tap leaks whenever it is turned on.',
    category: 'Plumbing',
    suburb: 'Mount Eden',
    city: 'Auckland',
    urgency: 'Normal',
    budget: '$100 - $250',
    job_status: 'open',
    quote_count: 1,
    max_quotes: 3,
    quote_deadline: '2026-08-12T00:00:00Z',
    created_at: '2026-08-08T00:00:00Z',
    ...overrides,
  }
}

test('AC1-2: only jobs matching a registered service and service area are eligible', () => {
  const services = [' plumbing ']
  const areas = [' mount eden ']

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

test('AC1: open jobs before their deadline and below their quote limit are available', () => {
  assert.equal(isAvailableLead(lead(), NOW), true)
})

test('lead details include every field required by the job card', () => {
  assert.deepEqual(getLeadDisplayDetails(lead()), {
    title: 'Repair leaking kitchen tap',
    category: 'Plumbing',
    suburb: 'Mount Eden',
    urgency: 'Normal',
    quoteCount: 1,
    maxQuotes: 3,
    quoteDeadline: '2026-08-12T00:00:00Z',
  })
})

test('AC5: expired, withdrawn, accepted, cancelled, and fully quoted jobs are unavailable', () => {
  for (const unavailableLead of [
    lead({ job_status: 'closed' }),
    lead({ quote_deadline: '2026-08-08T23:59:59Z' }),
    lead({ job_status: 'withdrawn' }),
    lead({ job_status: 'accepted' }),
    lead({ job_status: 'in_progress' }),
    lead({ job_status: 'cancelled' }),
    lead({ quote_count: 3, max_quotes: 3 }),
  ]) {
    assert.equal(isAvailableLead(unavailableLead, NOW), false)
  }
})

test('AC3 and AC7: search finds title, description, and suburb without case sensitivity', () => {
  const jobs = [
    lead(),
    lead({
      title: 'Replace a switch',
      description: 'The hallway light flickers every evening.',
      category: 'Electrical',
      suburb: 'Ponsonby',
    }),
  ]

  assert.deepEqual(
    filterAndSortLeads(jobs, { search: 'REPLACE', now: NOW }).map(
      (item) => item.category,
    ),
    ['Electrical'],
  )
  assert.deepEqual(
    filterAndSortLeads(jobs, { search: 'FLICKERS', now: NOW }).map(
      (item) => item.category,
    ),
    ['Electrical'],
  )
  assert.deepEqual(
    filterAndSortLeads(jobs, { search: 'PONSONBY', now: NOW }).map(
      (item) => item.category,
    ),
    ['Electrical'],
  )
})

test('AC8: clearing the search displays all matched available jobs again', () => {
  const jobs = [lead(), lead({ title: 'Install a shower mixer' })]

  assert.equal(filterAndSortLeads(jobs, { search: '', now: NOW }).length, 2)
})

test('AC4: jobs closing within 48 hours are identified as urgent', () => {
  assert.equal(
    isUrgentLead(lead({ quote_deadline: '2026-08-10T23:59:59Z' }), NOW),
    true,
  )
  assert.equal(
    isUrgentLead(lead({ quote_deadline: '2026-08-11T00:00:01Z' }), NOW),
    false,
  )
})

test('AC6: an appropriate message is returned when no matched jobs exist', () => {
  assert.equal(
    getMarketplaceEmptyMessage('leads', 0),
    'No matching job leads are available right now.',
  )
  assert.equal(
    getMarketplaceEmptyMessage('leads', 3),
    'No matched job leads match your search or filters.',
  )
})

test('AC9: urgency filters use the value stored with each job', () => {
  const jobs = [
    lead({ title: 'Urgent job', urgency: 'Urgent' }),
    lead({ title: 'Normal job', urgency: 'Normal' }),
    lead({ title: 'Flexible job', urgency: 'Flexible' }),
  ]

  assert.deepEqual(
    filterAndSortLeads(jobs, { urgency: 'Urgent', now: NOW }).map(
      (item) => item.title,
    ),
    ['Urgent job'],
  )
})

test('leads can be ordered by age and budget without displaying budget', () => {
  const jobs = [
    lead({
      title: 'Middle budget',
      budget: '$250 - $500',
      created_at: '2026-08-07T00:00:00Z',
    }),
    lead({
      title: 'Highest budget',
      budget: '$1000+',
      created_at: '2026-08-06T00:00:00Z',
    }),
    lead({
      title: 'Newest and lowest budget',
      budget: 'Up to $100',
      created_at: '2026-08-08T00:00:00Z',
    }),
  ]

  assert.equal(
    filterAndSortLeads(jobs, { order: 'newest', now: NOW })[0].title,
    'Newest and lowest budget',
  )
  assert.equal(
    filterAndSortLeads(jobs, { order: 'oldest', now: NOW })[0].title,
    'Highest budget',
  )
  assert.equal(
    filterAndSortLeads(jobs, { order: 'highest_budget', now: NOW })[0].title,
    'Highest budget',
  )
  assert.equal(
    filterAndSortLeads(jobs, { order: 'lowest_budget', now: NOW })[0].title,
    'Newest and lowest budget',
  )
})

test('budget sorting keeps leads without a budget at the end', () => {
  const jobs = [
    lead({ title: 'No budget', budget: null }),
    lead({ title: 'Has budget', budget: '$100 - $250' }),
  ]

  assert.equal(
    filterAndSortLeads(jobs, { order: 'highest_budget', now: NOW })[0].title,
    'Has budget',
  )
  assert.equal(
    filterAndSortLeads(jobs, { order: 'lowest_budget', now: NOW })[0].title,
    'Has budget',
  )
})

test('lead budget is available for sorting but is not rendered on cards', async () => {
  const [migration, leadCard] = await Promise.all([
    readFile(
      new URL(
        '../supabase/migrations/20260817000000_expose_lead_budget_for_sorting.sql',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/LeadCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /budget text/)
  assert.match(migration, /job\.budget::text/)
  assert.doesNotMatch(leadCard, /item\.budget|details\.budget/i)
})
