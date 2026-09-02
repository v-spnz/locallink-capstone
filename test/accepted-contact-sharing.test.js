import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  JOB_PROGRESS_STAGES,
  JOB_PROGRESS_TIMELINE_STAGES,
} from '../src/features/service-marketplace/jobTracking.js'
import { isAcceptedJobContactsRpcMissing } from '../src/features/service-marketplace/api/acceptedJobContactErrors.js'

const migrationUrl = new URL(
  '../supabase/migrations/20260902010000_share_accepted_job_contacts.sql',
  import.meta.url,
)

test('accepted contact details are a timeline event, not a job status', () => {
  assert.deepEqual(
    JOB_PROGRESS_TIMELINE_STAGES.map(({ label }) => label),
    [
      'Accepted',
      'Contact details shared',
      'Scheduled',
      'On the way',
      'In progress',
      'Completed',
    ],
  )
  assert.equal(
    JOB_PROGRESS_STAGES.some(({ value }) => value === 'contact_details_shared'),
    false,
  )
})

test('the database exchange is accepted-only and scoped to either party', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  assert.match(migration, /quote\.status = 'accepted'/)
  assert.match(migration, /job\.customer_id = v_user_id/)
  assert.match(migration, /public\.business_has_capability/)
  assert.match(migration, /quote\.business_id = p_business_id/)
  assert.match(migration, /left join auth\.users as consumer_account/)
  assert.match(migration, /left join auth\.users as provider_account/)
  assert.doesNotMatch(migration, /grant select.*auth\.users/i)
})

test('both job views render the accepted contact component and shared timeline', async () => {
  const [customerDetail, providerCard, timeline] = await Promise.all([
    readFile(
      new URL(
        '../src/features/service-marketplace/components/JobDetailPanel.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/ActiveJobCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/components/ActiveJobProgressTimeline.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(customerDetail, /viewer="consumer"/)
  assert.match(providerCard, /viewer="provider"/)
  assert.match(customerDetail, /ActiveJobProgressTimeline/)
  assert.match(providerCard, /ActiveJobProgressTimeline/)
  assert.match(timeline, /contact_details\?\.shared_at/)
})

test('acceptance confirmation explains the two-way contact exchange', async () => {
  const modal = await readFile(
    new URL(
      '../src/features/service-marketplace/components/QuoteActionModal.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(modal, /see each other’s account/)
  assert.match(modal, /contact details and saved address/)
})

test('a database awaiting the contact migration does not break the jobs page', () => {
  assert.equal(
    isAcceptedJobContactsRpcMissing({
      code: 'PGRST202',
      message:
        'Could not find the function public.get_accepted_job_contacts in the schema cache',
    }),
    true,
  )
  assert.equal(
    isAcceptedJobContactsRpcMissing({
      code: '42501',
      message: 'Service Marketplace access required',
    }),
    false,
  )
})
