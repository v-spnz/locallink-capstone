import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  getCustomerReward,
  getEarningRules,
  LOYALTY_DISCOUNT_PERCENTAGES,
} from '../src/features/loyalty/businessLoyaltyTemplates.js'
import {
  sanitizeDiscountPercentage,
  validateLoyaltyProgramme,
} from '../src/features/loyalty/businessLoyaltyValidation.js'

const BASE_PROGRAMME = {
  id: '47000000-0000-0000-0000-000000000105',
  name: 'Local rewards',
  programmeType: 'spend_and_reward',
  rewardDescription: 'coffee of your choice',
  rewardThreshold: '50',
  rewardValue: '',
  terms: '',
  startDate: '2099-01-01',
  endDate: '',
}

test('US0105 AC1: the business can provide a clear reward description', () => {
  assert.equal(getCustomerReward(BASE_PROGRAMME), 'coffee of your choice')
  assert.equal(
    getEarningRules(BASE_PROGRAMME),
    'Spend $50 to receive a free coffee of your choice.',
  )
})

test('US0105 AC2: reward values are saved against the selected programme', async () => {
  const [api, migration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/api/businessLoyalty.js',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/migrations/20260913050000_add_structured_loyalty_templates.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(api, /p_programme_id: payload\.id/)
  assert.match(api, /p_reward_description: payload\.reward_description/)
  assert.match(api, /p_reward_value: payload\.reward_value/)
  assert.match(migration, /where id = p_programme_id/)
  assert.match(migration, /and business_id = p_business_id/)
})

test('US0105 AC3: a programme cannot be published without its defined reward', () => {
  const errors = validateLoyaltyProgramme(
    { ...BASE_PROGRAMME, rewardDescription: '' },
    { forPublication: true },
  )

  assert.match(errors.rewardDescription, /required/i)

  const discountErrors = validateLoyaltyProgramme(
    {
      ...BASE_PROGRAMME,
      programmeType: 'spend_and_save',
      rewardDescription: '',
      rewardValue: '',
    },
    { forPublication: true },
  )
  assert.match(discountErrors.rewardValue, /discount percentage/i)
})

test('US0105 AC4: review presents reward and earning requirements together', async () => {
  const review = await readFile(
    new URL(
      '../src/features/loyalty/components/LoyaltyProgrammeReview.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(review, /label="How customers earn"/)
  assert.match(review, /value=\{getEarningRules\(programme\)\}/)
  assert.match(review, /label="Customer reward"/)
  assert.match(review, /value=\{getCustomerReward\(programme\)\}/)
})

test('US0105 AC5: saved reward information is mapped back into the draft', async () => {
  const [api, hook] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/api/businessLoyalty.js',
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
  ])

  assert.match(api, /rewardDescription: record\.reward_description/)
  assert.match(api, /rewardValue: record\.reward_value/)
  assert.match(hook, /setForm\(\{ \.\.\.programme \}\)/)
})

test('US0105: spend rewards use a filtered percentage picker and the Deals calendar', async () => {
  const [form, sections, percentagePicker, page, hook, loyaltyStyles] =
    await Promise.all([
      readFile(
        new URL(
          '../src/features/loyalty/components/LoyaltyDraftForm.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/loyalty/components/LoyaltyFormSections.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL(
          '../src/features/loyalty/components/DiscountPercentageCombobox.jsx',
          import.meta.url,
        ),
        'utf8',
      ),
      readFile(
        new URL('../src/pages/business/CreateLoyalty.jsx', import.meta.url),
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
        new URL('../src/features/loyalty/BusinessLoyalty.css', import.meta.url),
        'utf8',
      ),
    ])

  assert.match(sections, /DiscountPercentageCombobox/)
  assert.doesNotMatch(sections, /Discount amount \(\$\)/)
  assert.match(percentagePicker, /LOYALTY_DISCOUNT_PERCENTAGES\.filter/)
  assert.match(percentagePicker, /role="combobox"/)
  assert.match(percentagePicker, /role="listbox"/)
  assert.deepEqual(
    LOYALTY_DISCOUNT_PERCENTAGES,
    [
      5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
      100,
    ],
  )
  assert.equal(sanitizeDiscountPercentage('$1x05%'), '105')
  assert.deepEqual(
    validateLoyaltyProgramme(
      {
        ...BASE_PROGRAMME,
        programmeType: 'spend_and_save',
        rewardValue: '25',
      },
      { forPublication: true },
    ),
    {},
  )
  assert.match(form, /LoyaltyAvailabilitySection/)
  assert.match(sections, /<DateRangeCalendar/)
  assert.match(sections, /endOptional/)
  assert.doesNotMatch(form, /Customer-facing earning rules:/)
  assert.match(
    loyaltyStyles,
    /body\.business-surface \.loyalty-input-with-prefix \.form-input\s*\{[\s\S]*?padding-left:\s*40px/,
  )
  assert.match(page, /UnsavedChangesDialog/)
  assert.match(hook, /isLeaveConfirmationOpen/)
  assert.doesNotMatch(hook, /window\.confirm/)
})
