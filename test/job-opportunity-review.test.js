import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getLeadMedia,
  MAX_JOB_VIDEO_DURATION_SECONDS,
  validateJobMediaFiles,
} from '../src/features/service-marketplace/media.js'

const migrationUrl = new URL(
  '../supabase/migrations/20260812000000_review_job_opportunities.sql',
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

test('AC1 and AC3: review displays required job details, quote count, and deadline', async () => {
  const card = await readFile(leadCardUrl, 'utf8')

  for (const label of [
    'Description',
    'Category',
    'Suburb',
    'Requested timing',
    'quotes',
    'Quotes close',
  ]) {
    assert.match(card, new RegExp(label, 'i'))
  }
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

test('AC2: videos longer than 30 seconds are rejected before upload', async () => {
  assert.equal(MAX_JOB_VIDEO_DURATION_SECONDS, 30)
  await assert.rejects(
    validateJobMediaFiles(
      [{ name: 'long.mp4', type: 'video/mp4' }],
      async () => 30.1,
    ),
    /30 seconds or shorter/i,
  )
  await assert.doesNotReject(
    validateJobMediaFiles(
      [{ name: 'valid.mp4', type: 'video/mp4' }],
      async () => 30,
    ),
  )
})

test('AC4: lead RPC exposes review fields without consumer identity or contact fields', async () => {
  const migration = await readFile(migrationUrl, 'utf8')
  const returnShape = migration.match(
    /create function public\.get_business_job_leads[\s\S]+?returns table \(([\s\S]+?)\)\nlanguage/,
  )?.[1]

  assert.ok(returnShape)
  assert.match(returnShape, /suburb text/)
  assert.match(returnShape, /image_urls text\[\]/)
  assert.match(returnShape, /measurements text/)
  assert.doesNotMatch(returnShape, /customer_id|address|email|phone|contact/i)
})

test('AC5-7: review supports quoting and confirmed provider-specific decline', async () => {
  const [card, migration] = await Promise.all([
    readFile(leadCardUrl, 'utf8'),
    readFile(migrationUrl, 'utf8'),
  ])

  assert.match(card, /Create quote/)
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
