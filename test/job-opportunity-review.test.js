import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { getLeadMedia } from '../src/features/service-marketplace/media.js'

const migrationUrl = new URL(
  '../supabase/migrations/20260813000000_use_job_urgency_for_business_leads.sql',
  import.meta.url,
)
const leadCardUrl = new URL(
  '../src/features/service-marketplace/components/LeadCard.jsx',
  import.meta.url,
)
const modalUrl = new URL('../src/components/ui/Modal.jsx', import.meta.url)
const marketplaceCssUrl = new URL(
  '../src/features/service-marketplace/ServiceMarketplace.css',
  import.meta.url,
)

test('AC1 and AC3: lead summary displays location, closing date, and urgency', async () => {
  const card = await readFile(leadCardUrl, 'utf8')

  for (const label of [
    'Description',
    'Category',
    'Suburb',
    'Urgency',
    'Quotes close',
  ]) {
    assert.match(card, new RegExp(label, 'i'))
  }
  assert.match(card, /toLocaleDateString/)
  assert.doesNotMatch(card, /details\.quoteCount/)
  assert.match(card, /details\.urgency === 'Urgent'/)
  assert.match(card, /service-lead-urgency-dot/)
  assert.match(card, /service-lead-divider/)
  assert.match(card, /photoCount/)
  assert.match(card, /videoCount/)
  assert.match(card, /service-lead-attachment-count/)
  assert.match(card, /image.*video/)
})

test('AC2: supplied photos and supported videos are classified for viewing', () => {
  assert.deepEqual(
    getLeadMedia([
      'https://example.test/job/photo.webp',
      'https://example.test/job/walkthrough.mp4?download=1',
    ]),
    [
      { url: 'https://example.test/job/photo.webp', type: 'image' },
      {
        url: 'https://example.test/job/walkthrough.mp4?download=1',
        type: 'video',
      },
    ],
  )
})

test('AC4: lead RPC exposes review fields without consumer identity or contact fields', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  const returnShape = migration.match(
    /create function public\.get_business_job_leads[\s\S]+?returns table \(([\s\S]+?)\)\r?\nlanguage/,
  )?.[1]

  assert.ok(returnShape)
  assert.match(returnShape, /suburb text/)
  assert.match(returnShape, /image_urls text\[\]/)
  assert.match(returnShape, /urgency text/)
  assert.doesNotMatch(returnShape, /requested_timing|measurements/)
  assert.doesNotMatch(returnShape, /customer_id|address|email|phone|contact/i)
})

test('AC5-7: review supports quoting and confirmed provider-specific decline', async () => {
  const [card, migration] = await Promise.all([
    readFile(leadCardUrl, 'utf8'),
    readFile(migrationUrl, 'utf8'),
  ])

  assert.match(card, /Submit quote/)
  assert.match(card, /View details/)
  assert.match(card, /Decline this opportunity\?/)
  assert.match(card, /Confirm decline/)
  assert.match(migration, /business_job_opportunity_declines/)
  assert.match(
    migration,
    /declined\.business_id = p_business_id[\s\S]+declined\.job_request_id = job\.id/,
  )
})

test('AC8: clicking an image or video opens a viewport-fitted in-app preview', async () => {
  const [card, modal, styles] = await Promise.all([
    readFile(leadCardUrl, 'utf8'),
    readFile(modalUrl, 'utf8'),
    readFile(marketplaceCssUrl, 'utf8'),
  ])

  assert.match(card, /setSelectedMedia/)
  assert.match(card, /Job \{selectedMedia\.type\} preview/)
  assert.match(card, /aria-modal="true"/)
  assert.match(card, /selectedMedia\.type === 'video'/)
  assert.match(card, /<video controls preload="metadata">/)
  assert.doesNotMatch(card, /target="_blank"/)
  assert.match(modal, /createPortal/)
  assert.match(modal, /z-\[1000\]/)
  assert.match(modal, /document\.body\.style\.overflow = 'hidden'/)
  assert.match(modal, /100dvh/)
  assert.match(styles, /width: fit-content/)
  assert.match(styles, /max-height: calc\(100dvh - 2rem\)/)
  assert.match(styles, /\.service-media-preview-close[\s\S]+position: absolute/)
  assert.match(
    styles,
    /\.service-image-lightbox > div video[\s\S]+width: auto[\s\S]+height: auto[\s\S]+object-fit: contain/,
  )
})

test('only one business lead review can be expanded at a time', async () => {
  const [page, hook] = await Promise.all([
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
  assert.match(page, /marketplace\.reviewedLead === item\.job_request_id/)
  assert.match(hook, /setReviewedLead\(\(current\) =>/)
  assert.match(hook, /current === jobRequestId \? null : jobRequestId/)
})
