import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const migrationUrl = new URL(
  '../supabase/migrations/20260930010000_manage_loyalty_programme_lifecycle.sql',
  import.meta.url,
)

test('draft and scheduled loyalty programmes have guarded lifecycle actions', async () => {
  const [list, row, api, migration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftList.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyProgrammeRow.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/api/businessLoyalty.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(migrationUrl, 'utf8'),
  ])

  assert.match(row, /Delete draft/)
  assert.match(row, /Cancel schedule/)
  assert.match(row, /Edit programme/)
  assert.match(list, /<LoyaltyProgrammeRow/)
  assert.match(list, /openActionConfirmation=\{openActionConfirmation\}/)
  assert.match(list, /openEndConfirmation=\{openEndConfirmation\}/)
  assert.match(row, /onEdit\(programme\.id\)/)
  assert.match(row, /openEndConfirmation\(programme\)/)
  assert.match(list, /Delete this draft\?/)
  assert.match(list, /Cancel this scheduled programme\?/)
  assert.match(list, /actionInProgressRef/)
  assert.match(list, /className="loyalty-confirm-danger"/)
  assert.match(list, /Keep programme active/)
  assert.ok(
    row.indexOf("openActionConfirmation('cancel', programme)") <
      row.indexOf("{isDraft ? 'Continue draft' : 'Edit programme'}"),
    'cancel schedule is rendered before the right-side edit action',
  )
  assert.ok(
    list.indexOf("? 'Delete draft'") < list.indexOf("? 'Keep draft'"),
    'the destructive delete action is rendered on the left of the safe action',
  )
  assert.ok(
    list.indexOf(": 'Confirm cancellation'") <
      list.indexOf(": 'Keep scheduled'"),
    'the cancellation confirmation is rendered on the left of the safe action',
  )
  assert.ok(
    list.indexOf("'End programme now'") < list.indexOf('Keep programme active'),
    'ending early is rendered on the left of the safe action',
  )
  assert.match(api, /delete_business_loyalty_programme_draft/)
  assert.match(api, /cancel_business_loyalty_programme_schedule/)
  assert.match(migration, /and status = 'draft'/)
  assert.match(migration, /and status = 'scheduled'/)
})

test('ending an active loyalty programme protects existing customers', async () => {
  const [list, customerPage, customerCard, migration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftList.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/customer/Loyalty.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/ProgramCard.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(migrationUrl, 'utf8'),
  ])

  assert.match(list, /End this programme early\?/)
  assert.match(list, /15 business days/)
  assert.match(customerPage, /isEarlyEndGracePeriodActive/)
  assert.match(customerCard, /Programme ended early/)
  assert.match(migration, /fifteen_business_days_after/)
  assert.match(migration, /status = 'ended_early'/)
  assert.match(migration, /loyalty_programme_ended_early/)
  assert.match(migration, /loyalty_programme_accepts_existing_activity/)
})
