import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../supabase/migrations/20260816000000_separate_job_history_and_add_business_notifications.sql',
  import.meta.url,
)

test('business notification bell replaces the personal home shortcut', async () => {
  const navigation = await readFile(
    new URL(
      '../src/components/navigation/BusinessNavigation.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(navigation, /business-notification-button/)
  assert.match(navigation, /aria-label={`Notifications/)
  assert.match(navigation, /business-notification-dropdown/)
  assert.doesNotMatch(navigation, /Open personal LocalLink pages/)
  assert.doesNotMatch(navigation, /<House/)
})

test('notifications cover new leads, quote updates, approvals, and job history moves', async () => {
  const migration = await readFile(migrationUrl, 'utf8')

  for (const notificationType of [
    'new_lead',
    'quote_approved',
    'quote_updated',
    'job_completed',
  ]) {
    assert.match(migration, new RegExp(`'${notificationType}'`))
  }

  assert.match(migration, /moved from Quotes to Jobs/)
  assert.match(migration, /moved from Jobs to Job History/)
  assert.match(migration, /get_business_notifications/)
  assert.match(migration, /mark_business_notifications_read/)
})
