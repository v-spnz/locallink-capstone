import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getProgrammeAvailability,
  LOYALTY_STATUS_FILTERS,
  matchesLoyaltyStatusFilter,
} from '../src/features/loyalty/businessLoyaltyTemplates.js'
import { validateLoyaltyProgramme } from '../src/features/loyalty/businessLoyaltyValidation.js'

const COMPLETE_PROGRAMME = {
  name: 'Morning coffee rewards',
  programmeType: 'purchase_card',
  rewardDescription: '',
  rewardThreshold: '8',
  rewardValue: '',
  terms: 'One reward per customer.',
  startDate: '2099-01-01',
  endDate: '',
}

test('US0107 AC1-2: a complete programme can be reviewed and missing publication details are identified', () => {
  assert.deepEqual(
    validateLoyaltyProgramme(COMPLETE_PROGRAMME, { forPublication: true }),
    {},
  )

  const errors = validateLoyaltyProgramme(
    {
      name: '',
      programmeType: '',
      rewardDescription: '',
      rewardThreshold: '',
      rewardValue: '',
      terms: '',
      startDate: '',
      endDate: '',
    },
    { forPublication: true },
  )

  assert.ok(errors.name)
  assert.ok(errors.programmeType)
  assert.ok(errors.rewardThreshold)
  assert.ok(errors.startDate)
})

test('structured templates require only their own reward fields', () => {
  assert.deepEqual(
    validateLoyaltyProgramme(
      {
        ...COMPLETE_PROGRAMME,
        programmeType: 'spend_and_save',
        rewardThreshold: '50',
        rewardValue: '5',
      },
      { forPublication: true },
    ),
    {},
  )
  assert.ok(
    validateLoyaltyProgramme(
      {
        ...COMPLETE_PROGRAMME,
        programmeType: 'spend_and_save',
        rewardThreshold: '5',
        rewardValue: '12',
      },
      { forPublication: true },
    ).rewardValue,
  )
  assert.deepEqual(
    validateLoyaltyProgramme(
      {
        ...COMPLETE_PROGRAMME,
        programmeType: 'spend_and_reward',
        rewardThreshold: '25',
        rewardDescription: 'sandwich',
      },
      { forPublication: true },
    ),
    {},
  )
  assert.ok(
    validateLoyaltyProgramme(
      {
        ...COMPLETE_PROGRAMME,
        programmeType: 'spend_and_reward',
        rewardDescription: '',
      },
      { forPublication: true },
    ).rewardDescription,
  )
})

test('loyalty lifecycle filters match the Deals management menu', () => {
  assert.deepEqual(
    LOYALTY_STATUS_FILTERS.map(({ value, label }) => ({ value, label })),
    [
      { value: 'draft', label: 'Draft' },
      { value: 'active', label: 'Active' },
      { value: 'scheduled', label: 'Scheduled' },
      { value: 'history', label: 'History' },
      { value: 'all', label: 'All' },
    ],
  )

  const today = new Date('2026-09-30T12:00:00+13:00')
  const availabilityValues = [
    { status: 'draft', startDate: '', endDate: '' },
    { status: 'active', startDate: '2026-09-01', endDate: '2026-10-31' },
    { status: 'scheduled', startDate: '2026-10-01', endDate: '' },
    { status: 'expired', startDate: '2026-08-01', endDate: '2026-09-29' },
  ].map((programme) => getProgrammeAvailability(programme, today).value)

  const counts = Object.fromEntries(
    LOYALTY_STATUS_FILTERS.map(({ value }) => [
      value,
      availabilityValues.filter((availability) =>
        matchesLoyaltyStatusFilter(availability, value),
      ).length,
    ]),
  )

  assert.deepEqual(counts, {
    draft: 1,
    active: 1,
    scheduled: 1,
    history: 1,
    all: 4,
  })
})

test('consumer loyalty discovery does not require business membership', async () => {
  const migration = await readFile(
    new URL(
      '../supabase/migrations/20260929010000_fix_loyalty_discovery_for_consumers.sql',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(migration, /from public\.business_capabilities as capability/)
  assert.match(
    migration,
    /capability\.business_id = nearest\.business_id[\s\S]*capability\.loyalty_enabled/,
  )
  assert.doesNotMatch(
    migration,
    /business_has_capability\(nearest\.business_id, 'loyalty'\)/,
  )
})

test('US0107 AC3-5: review, correction, persisted publication, and status tabs are wired together', async () => {
  const [page, form, review, list, hook, api, migration] = await Promise.all([
    readFile(
      new URL('../src/pages/business/CreateLoyalty.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftForm.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyProgrammeReview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftList.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/hooks/useBusinessLoyaltyProgrammes.js',
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
    readFile(
      new URL(
        '../supabase/migrations/20260912010000_publish_loyalty_programmes_safely.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(form, /Review and publish/)
  assert.match(form, /Redemption method/)
  assert.match(form, /Programme image/)
  assert.match(form, /LoyaltyTicket/)
  assert.match(form, /getLoyaltyProgressPresentation/)
  assert.match(form, /loyalty-preview-details/)
  assert.doesNotMatch(form, /Once published:/)
  assert.doesNotMatch(
    form,
    /Customers cannot see or use this programme while it is a draft/,
  )
  assert.match(page, /businessName={loyalty\.businessName}/)
  assert.match(page, /LoyaltyProgrammeReview/)
  assert.match(review, /How customers earn/)
  assert.match(review, /Programme period/)
  assert.match(review, /Redemption method/)
  assert.match(review, /Back to edit/)
  assert.match(review, /Confirm and publish/)
  assert.match(list, /Filter loyalty programmes/)
  assert.match(list, /deal-filters-overflow-trigger/)
  assert.match(list, /PRIMARY_FILTER_VALUES/)
  assert.match(list, /OVERFLOW_FILTER_VALUES/)
  assert.match(list, /deal-management-card loyalty-programme-row/)
  assert.match(list, /className="deal-list-row"/)
  assert.match(list, /programme\.imageUrl/)
  assert.match(list, /loyalty-programme-background/)
  assert.match(list, /has-background-image/)
  assert.doesNotMatch(list, /QRCodeSVG/)
  const cardMarkup = list.slice(
    list.indexOf('<article'),
    list.indexOf('</article>'),
  )
  assert.doesNotMatch(
    cardMarkup,
    /<(?:Award|CalendarDays|ChevronRight|Copy|Gift|LockKeyhole|QRCodeSVG|Users)\b/,
  )
  assert.match(hook, /setStep\('review'\)/)
  assert.match(hook, /persist\('published'\)/)
  assert.match(hook, /matchesLoyaltyStatusFilter/)
  assert.match(api, /save_business_loyalty_programme/)
  assert.match(api, /loyalty-programme-images/)
  assert.match(api, /p_image_url/)
  assert.match(migration, /validate_loyalty_programme_before_publish/)
  assert.match(migration, /set status = 'published'/)
  assert.match(migration, /then 'scheduled'/)
  assert.match(migration, /else 'active'/)
  assert.match(
    migration,
    /Complete every required loyalty programme field before publishing/,
  )
})
