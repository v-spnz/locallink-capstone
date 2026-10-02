import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  BUSINESS_JOB_STATUS_OPTIONS,
  filterBusinessJobs,
} from '../src/features/service-marketplace/jobTracking.js'

test('business services separates leads, quotes, active jobs, and job history', async () => {
  const [page, navigation, routes, content, toolbar, select] =
    await Promise.all([
      readFile(
        new URL('../src/pages/business/Services.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/components/navigation/BusinessNavigation.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/BusinessPortal.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/service-marketplace/components/business/BusinessMarketplaceContent.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/service-marketplace/components/business/MarketplaceToolbar.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/service-marketplace/components/business/MarketplaceSelect.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
    ])

  for (const label of ['Leads', 'Quotes', 'Jobs']) {
    assert.match(page, new RegExp(label))
  }
  assert.match(toolbar, /type === 'jobs'[\s\S]+View Job History/)
  assert.match(page, /value: quotes\.allItems\.length/)
  assert.match(page, /value: jobs\.allItems\.length/)
  assert.match(page, /Accepted and active jobs/)
  assert.match(page, /useBusinessMarketplace\('leads'\)/)
  assert.match(page, /useBusinessMarketplace\('quotes'\)/)
  assert.match(page, /useBusinessMarketplace\('jobs'\)/)
  assert.match(page, /useBusinessMarketplace\('history'\)/)
  assert.match(page, /<article[\s\S]+service-overview-card/)
  assert.match(page, /business-services-hero/)
  assert.doesNotMatch(page, /ChevronRight/)
  assert.match(page, /onClick=\{\(\) => selectTab\(summary\.type\)\}/)
  assert.match(page, /<BusinessMarketplaceContent/)
  assert.match(content, /<MarketplaceToolbar/)
  assert.match(page, /value: 'history', label: 'History'/)
  assert.match(page, /aria-controls=\{`marketplace-panel-/)
  assert.match(page, /event\.key === 'ArrowRight'/)
  assert.match(navigation, /to: '\/business\/services'/)
  assert.match(navigation, /label: 'Services'/)
  assert.match(navigation, /Profile &amp; business details/)
  assert.match(navigation, /Notification preferences/)
  assert.match(navigation, /aria-haspopup="menu"/)
  assert.doesNotMatch(navigation, /\/business\/job-leads/)
  assert.match(routes, /path="services"/)
  assert.match(routes, /services\?tab=quotes/)
  assert.match(routes, /services\?tab=jobs/)
  assert.match(select, /role="listbox"/)
  assert.match(select, /role="option"/)
  assert.match(select, /aria-haspopup="listbox"/)
  assert.match(select, /aria-expanded=\{isOpen\}/)
  assert.match(select, /aria-selected=\{option\.value === value\}/)
  assert.match(select, /selected \?\? options\?\.\[0\]/)
  assert.match(select, /event\.key === 'Escape'/)
  assert.match(select, /triggerRef\.current\?\.focus\(\)/)
  for (const key of ['ArrowUp', 'ArrowDown', 'Home', 'End']) {
    assert.match(select, new RegExp(key))
  }
  assert.doesNotMatch(select, /<select/)
})

test('active-job filters no longer offer completed work', () => {
  assert.deepEqual(
    BUSINESS_JOB_STATUS_OPTIONS.map(({ label }) => label),
    ['All', 'Active'],
  )

  const jobs = [
    {
      job_request_id: '1',
      job_status: 'in_progress',
      status_updated_at: '2026-08-12T00:00:00Z',
    },
    {
      job_request_id: '2',
      job_status: 'completed',
      status_updated_at: '2026-08-11T00:00:00Z',
    },
  ]
  assert.deepEqual(filterBusinessJobs(jobs, { status: 'in_progress' }), [
    jobs[0],
  ])
  assert.deepEqual(filterBusinessJobs(jobs, { status: 'completed' }), [jobs[1]])
  assert.deepEqual(filterBusinessJobs(jobs, { status: 'all' }), jobs)
  assert.deepEqual(filterBusinessJobs(jobs, { order: 'completed_first' }), [
    jobs[1],
    jobs[0],
  ])
})

test('submitting a quote refreshes every mounted services tab', async () => {
  const marketplaceHook = await readFile(
    new URL(
      '../src/features/service-marketplace/hooks/useBusinessMarketplace.js',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(marketplaceHook, /subscribeToBusinessMarketplaceChanges/)
  assert.match(
    marketplaceHook,
    /notifyBusinessMarketplaceChanged\(business\.id\)/,
  )
  assert.match(
    marketplaceHook,
    /current\.filter\(\(item\) => item\.job_request_id !== selectedLead\)/,
  )
})
