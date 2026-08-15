import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../supabase/migrations/20260816000000_separate_job_history_and_add_business_notifications.sql',
  import.meta.url,
)
const deadlineMigrationUrl = new URL(
  '../supabase/migrations/20260818000000_add_quote_deadline_reminders.sql',
  import.meta.url,
)
const dismissMigrationUrl = new URL(
  '../supabase/migrations/20260818010000_add_dismiss_business_notifications.sql',
  import.meta.url,
)
const deepLinkMigrationUrl = new URL(
  '../supabase/migrations/20260818030000_make_business_notifications_deep_linkable.sql',
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
  assert.match(navigation, /has-unread/)
  assert.match(navigation, /fill=\{unreadCount > 0 \? 'currentColor' : 'none'\}/)
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

test('development builds can generate a real seeded deadline reminder from the bell', async () => {
  const [navigation, hook, api, seed, deadlineMigration] = await Promise.all([
    readFile(
      new URL(
        '../src/components/navigation/BusinessNavigation.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/hooks/useBusinessNotifications.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/api/businessNotifications.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(new URL('../supabase/seed.sql', import.meta.url), 'utf8'),
    readFile(deadlineMigrationUrl, 'utf8'),
  ])

  assert.match(navigation, /import\.meta\.env\.DEV/)
  assert.match(navigation, /Generate deadline reminder/)
  assert.match(navigation, /quote_deadline_reminder: BellRing/)
  assert.match(hook, /createDeadlineReminderTest/)
  assert.match(api, /create_seed_quote_deadline_reminder/)
  assert.match(
    seed,
    /create or replace function public\.create_seed_quote_deadline_reminder/,
  )
  assert.match(seed, /perform public\.create_due_quote_deadline_notifications\(now\(\)\)/)
  assert.match(deadlineMigration, /quote_deadline_reminder/)
})

test('business members can dismiss all notifications from the dropdown', async () => {
  const [navigation, hook, api, migration] = await Promise.all([
    readFile(
      new URL(
        '../src/components/navigation/BusinessNavigation.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/hooks/useBusinessNotifications.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/service-marketplace/api/businessNotifications.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(dismissMigrationUrl, 'utf8'),
  ])

  assert.match(navigation, /Dismiss all/)
  assert.match(navigation, /isDismissing/)
  assert.match(hook, /dismissAll/)
  assert.match(api, /dismiss_business_notifications/)
  assert.match(migration, /public\.is_business_member\(p_business_id\)/)
  assert.match(migration, /delete from public\.business_notifications/)
})

test('notification clicks open and highlight their related marketplace item', async () => {
  const [navigation, services, leadCard, quoteCard, jobCard, styles, migration] =
    await Promise.all([
      readFile(
        new URL(
          '../src/components/navigation/BusinessNavigation.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/Services.jsx', import.meta.url),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/service-marketplace/components/LeadCard.jsx',
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
      readFile(
        new URL(
          '../src/features/service-marketplace/components/ActiveJobCard.jsx',
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
      readFile(deepLinkMigrationUrl, 'utf8'),
    ])

  assert.match(navigation, /getBusinessNotificationDestination/)
  assert.match(navigation, /case 'new_lead'/)
  assert.match(navigation, /case 'quote_deadline_reminder'/)
  assert.match(navigation, /case 'quote_approved'/)
  assert.match(navigation, /case 'job_completed'/)
  assert.match(navigation, /focus: focusId/)
  assert.match(services, /showLeadReview\(focusedItemId\)/)
  assert.match(services, /showQuoteReview\(focusedItemId\)/)
  assert.match(services, /scrollIntoView/)
  assert.match(services, /is-notification-arrival/)
  assert.match(leadCard, /service-item-leads-/)
  assert.match(quoteCard, /service-item-quotes-/)
  assert.match(jobCard, /service-item-\$\{isHistory \? 'history' : 'jobs'\}/)
  assert.match(styles, /@keyframes service-notification-arrival/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.match(migration, /related_job_request_id uuid/)
  assert.match(migration, /related_quote_id uuid/)
})
