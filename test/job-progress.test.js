import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  JOB_PROGRESS_STAGES,
  formatJobStatusTimestamp,
  getNextJobProgressStage,
  isValidJobProgressTransition,
} from '../src/features/service-marketplace/jobTracking.js'

const migrationUrl = new URL(
  '../supabase/migrations/20260815000000_track_job_progress.sql',
  import.meta.url,
)
const quoteAcceptanceRepairMigrationUrl = new URL(
  '../supabase/migrations/20260818050000_fix_quote_acceptance_start_stage.sql',
  import.meta.url,
)
const skippedStageRepairMigrationUrl = new URL(
  '../supabase/migrations/20260818060000_repair_skipped_quote_acceptance_stages.sql',
  import.meta.url,
)

test('AC1: the five visible stages are defined in order', () => {
  assert.deepEqual(
    JOB_PROGRESS_STAGES.map(({ label }) => label),
    ['Accepted', 'Scheduled', 'On the way', 'In progress', 'Completed'],
  )
})

test('AC2 and AC4: only the next ordered provider transition is valid', () => {
  assert.equal(getNextJobProgressStage('accepted'), 'scheduled')
  assert.equal(getNextJobProgressStage('scheduled'), 'on_the_way')
  assert.equal(getNextJobProgressStage('on_the_way'), 'in_progress')
  assert.equal(getNextJobProgressStage('in_progress'), 'pending_completion')
  assert.equal(getNextJobProgressStage('pending_completion'), null)

  assert.equal(isValidJobProgressTransition('accepted', 'scheduled'), true)
  assert.equal(isValidJobProgressTransition('accepted', 'in_progress'), false)
  assert.equal(isValidJobProgressTransition('scheduled', 'accepted'), false)
  assert.equal(isValidJobProgressTransition('unknown', 'scheduled'), false)
})

test('AC2 and AC4: the database locks the job and enforces the same order', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  assert.match(migration, /from public\.job_requests as job[\s\S]+for update;/)
  assert.match(migration, /when 'accepted' then 'scheduled'/)
  assert.match(migration, /when 'scheduled' then 'on_the_way'/)
  assert.match(migration, /when 'on_the_way' then 'in_progress'/)
  assert.match(migration, /when 'in_progress' then 'pending_completion'/)
  assert.match(migration, /Invalid job status transition/)
})

test('accepting a quote starts at Accepted instead of skipping to In progress', async () => {
  const migration = await readFile(quoteAcceptanceRepairMigrationUrl, 'utf8')

  assert.match(
    migration,
    /update public\.job_requests[\s\S]+set status = 'accepted'/,
  )
  assert.doesNotMatch(
    migration,
    /update public\.job_requests[\s\S]+set status = 'in_progress'/,
  )
})

test('existing auto-skipped jobs are rewound without changing valid progress', async () => {
  const migration = await readFile(skippedStageRepairMigrationUrl, 'utf8')

  assert.match(migration, /job\.status = 'in_progress'/)
  assert.match(migration, /history\.status = 'in_progress'/)
  assert.match(
    migration,
    /history\.status in \('accepted', 'scheduled', 'on_the_way'\)/,
  )
  assert.match(migration, /set status = 'accepted'/)
})

test('AC3: every change is timestamped and returned to both parties', async () => {
  const [migration, providerTimeline, customerDetail] = await Promise.all([
    readFile(migrationUrl, 'utf8'),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/ActiveJobProgressTimeline.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/JobDetailPanel.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /create table public\.job_status_history/)
  assert.match(migration, /create trigger job_requests_record_status_change/)
  assert.match(migration, /status_history jsonb/g)
  assert.match(providerTimeline, /formatJobStatusTimestamp\(updatedAt\)/)
  assert.match(customerDetail, /<ActiveJobProgressTimeline job=\{job\} \/>/)
  assert.notEqual(formatJobStatusTimestamp('2026-08-11T03:00:00Z'), '')
})

test('AC5: On the way is a manual status with no location tracking', async () => {
  const [migration, component] = await Promise.all([
    readFile(migrationUrl, 'utf8'),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/ActiveJobCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /when 'scheduled' then 'on_the_way'/)
  assert.doesNotMatch(migration, /latitude|longitude|geolocation/i)
  assert.doesNotMatch(component, /navigator\.geolocation|watchPosition/)
})

test('AC6: provider completion starts customer confirmation', async () => {
  const [migration, customerDetail] = await Promise.all([
    readFile(migrationUrl, 'utf8'),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/JobDetailPanel.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(migration, /when 'in_progress' then 'pending_completion'/)
  assert.match(migration, /confirm_job_completion/)
  assert.match(migration, /set status = 'completed'/)
  assert.match(customerDetail, /Confirm work completed/)
})
