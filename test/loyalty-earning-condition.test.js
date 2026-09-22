import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import { validateLoyaltyProgramme } from '../src/features/loyalty/businessLoyaltyValidation.js'
import {
  getCustomerReward,
  getEarningRules,
  LOYALTY_TEMPLATES,
} from '../src/features/loyalty/businessLoyaltyTemplates.js'

const BASE_PROGRAMME = {
  name: 'Local rewards',
  rewardDescription: '',
  rewardThreshold: '',
  rewardValue: '',
  terms: '',
  startDate: '2099-01-01',
  endDate: '',
}

const TEMPLATE_CASES = [
  {
    programme: {
      ...BASE_PROGRAMME,
      programmeType: 'stamp_card',
      rewardThreshold: '5',
    },
    earningRules:
      'Complete 5 purchases or visits to receive the next one free.',
    customerReward: 'Next purchase or visit free',
  },
  {
    programme: {
      ...BASE_PROGRAMME,
      programmeType: 'spend_and_save',
      rewardThreshold: '100',
      rewardValue: '10',
    },
    earningRules: 'Spend $100 to receive $10 off.',
    customerReward: '$10 off',
  },
  {
    programme: {
      ...BASE_PROGRAMME,
      programmeType: 'spend_and_reward',
      rewardThreshold: '50',
      rewardDescription: 'coffee or service',
    },
    earningRules: 'Spend $50 to receive a free coffee or service.',
    customerReward: 'coffee or service',
  },
]

test('US0104 AC1: earning conditions use only the three structured MVP templates', () => {
  assert.deepEqual(
    LOYALTY_TEMPLATES.map(({ value }) => value),
    ['stamp_card', 'spend_and_save', 'spend_and_reward'],
  )
  assert.equal(
    LOYALTY_TEMPLATES.some(({ value }) => value === 'custom'),
    false,
  )
})

test('US0104 AC2: every template produces a complete customer-facing earning condition', () => {
  for (const { programme, earningRules, customerReward } of TEMPLATE_CASES) {
    assert.deepEqual(
      validateLoyaltyProgramme(programme, { forPublication: true }),
      {},
    )
    assert.equal(getEarningRules(programme), earningRules)
    assert.equal(getCustomerReward(programme), customerReward)
  }
})

test('US0104 AC3: incomplete or invalid earning conditions cannot be confirmed', () => {
  const invalidProgrammes = [
    { ...BASE_PROGRAMME, programmeType: '', rewardThreshold: '5' },
    { ...BASE_PROGRAMME, programmeType: 'custom', rewardThreshold: '5' },
    { ...BASE_PROGRAMME, programmeType: 'stamp_card', rewardThreshold: '2.5' },
    {
      ...BASE_PROGRAMME,
      programmeType: 'spend_and_save',
      rewardThreshold: '80',
      rewardValue: '',
    },
    {
      ...BASE_PROGRAMME,
      programmeType: 'spend_and_save',
      rewardThreshold: '80',
      rewardValue: '100',
    },
    {
      ...BASE_PROGRAMME,
      programmeType: 'spend_and_reward',
      rewardThreshold: '50',
      rewardDescription: '',
    },
  ]

  for (const programme of invalidProgrammes) {
    assert.notDeepEqual(
      validateLoyaltyProgramme(programme, { forPublication: true }),
      {},
    )
  }
})

test('US0104 AC4: the earning condition is saved against the selected loyalty programme', async () => {
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
  assert.match(api, /p_business_id: payload\.business_id/)
  assert.match(api, /p_programme_type: payload\.programme_type/)
  assert.match(api, /p_reward_threshold: payload\.reward_threshold/)
  assert.match(api, /p_reward_value: payload\.reward_value/)
  assert.match(migration, /where id = p_programme_id/)
  assert.match(migration, /and business_id = p_business_id/)
  assert.match(migration, /new\.earning_rules := case/)
})

test('US0104 AC5: the generated earning condition is reviewed before publication', async () => {
  const [form, review, hook] = await Promise.all([
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
        '../src/features/loyalty/hooks/useBusinessLoyaltyProgrammes.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.doesNotMatch(form, /Customer-facing earning rules:/)
  assert.match(form, /getEarningRules\(programme\)/)
  assert.match(form, /Review and publish/)
  assert.match(review, /label="How customers earn"/)
  assert.match(review, /value=\{getEarningRules\(programme\)\}/)
  assert.match(hook, /setStep\('review'\)/)
  assert.match(hook, /handleConfirmPublish: \(\) => persist\('published'\)/)
})
