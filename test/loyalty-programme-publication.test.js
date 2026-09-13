import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { validateLoyaltyProgramme } from '../src/features/loyalty/businessLoyaltyValidation.js'

const COMPLETE_PROGRAMME = {
  name: 'Morning coffee rewards',
  programmeType: 'stamp',
  rewardDescription: 'One regular coffee',
  rewardThreshold: '8',
  earningRules: 'Earn one stamp with every hot drink purchased.',
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
      earningRules: '',
      terms: '',
      startDate: '',
      endDate: '',
    },
    { forPublication: true },
  )

  assert.ok(errors.name)
  assert.ok(errors.programmeType)
  assert.ok(errors.rewardDescription)
  assert.ok(errors.rewardThreshold)
  assert.ok(errors.earningRules)
  assert.ok(errors.startDate)
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
  assert.match(page, /LoyaltyProgrammeReview/)
  assert.match(review, /How customers earn/)
  assert.match(review, /Programme period/)
  assert.match(review, /Back to edit/)
  assert.match(review, /Confirm and publish/)
  assert.match(list, /role="tablist"/)
  assert.match(list, /Published/)
  assert.match(hook, /setStep\('review'\)/)
  assert.match(hook, /persist\('published'\)/)
  assert.match(hook, /setActiveStatus\(status === 'draft'/)
  assert.match(api, /save_business_loyalty_programme/)
  assert.match(migration, /validate_loyalty_programme_before_publish/)
  assert.match(migration, /set status = 'published'/)
  assert.match(migration, /then 'scheduled'/)
  assert.match(migration, /else 'active'/)
  assert.match(
    migration,
    /Complete every required loyalty programme field before publishing/,
  )
})
