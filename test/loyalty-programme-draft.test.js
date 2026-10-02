import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'
import {
  sanitizeRewardThreshold,
  validateLoyaltyDraft,
} from '../src/features/loyalty/businessLoyaltyValidation.js'

const EMPTY_DRAFT = {
  name: '',
  programmeType: '',
  rewardDescription: '',
  rewardThreshold: '',
  rewardValue: '',
  terms: '',
}

test('AC1-2: a business can start and save an incomplete loyalty programme draft', async () => {
  const [page, form, hook] = await Promise.all([
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
        '../src/features/loyalty/hooks/useBusinessLoyaltyProgrammes.js',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.deepEqual(validateLoyaltyDraft(EMPTY_DRAFT), {})
  assert.match(page, /Create a loyalty programme/)
  assert.match(form, /Save draft/)
  assert.match(form, /Private draft/)
  assert.match(hook, /status: 'draft'/)
  assert.match(hook, /saveBusinessLoyaltyProgramme/)
})

test('optional programme images keep their file, preview, removal, and accessibility contracts', async () => {
  const [form, fields, preview] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftForm.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyFormFields.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyProgrammePreview.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(form, /URL\.createObjectURL\(programme\.imageFile\)/)
  assert.match(form, /URL\.revokeObjectURL\(imagePreviewUrl\)/)
  assert.match(
    fields,
    /Programme image <span className="loyalty-optional">Optional/,
  )
  assert.match(fields, /accept="image\/jpeg,image\/png,image\/webp"/)
  assert.match(fields, /JPG, PNG or WebP, up to 5 MB/)
  assert.match(fields, /onChange\(event\.target\.files\?\.\[0\] \|\| null\)/)
  assert.match(fields, /event\.target\.value = ''/)
  assert.match(fields, /onClick=\{onRemove\}/)
  assert.match(fields, /loyalty-programme-image-error/)
  assert.match(preview, /<LoyaltyTicket/)
})

test('AC3: loyalty programme saves are scoped to the current business', async () => {
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
        '../supabase/migrations/20260910010000_create_loyalty_programme_drafts.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  ])

  assert.match(api, /business_id: businessId/)
  assert.match(api, /\.eq\('business_id', businessId\)/)
  assert.match(
    migration,
    /public\.business_has_capability\(business_id, 'loyalty'\)/,
  )
  assert.match(migration, /public\.is_business_member\(business_id\)/)
})

test('AC4: a saved loyalty draft can be reopened without losing its information', async () => {
  const [row, hook] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyProgrammeRow.jsx',
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

  assert.match(row, /Continue draft/)
  assert.match(hook, /handleEditProgramme/)
  assert.match(hook, /setForm\(\{ \.\.\.programme \}\)/)
  assert.match(hook, /filter\(\(programme\) => programme\.id !== saved\.id\)/)
})

test('AC5: draft loyalty programmes are not visible or usable by consumers', async () => {
  const [form, migration, publicationMigration] = await Promise.all([
    readFile(
      new URL(
        '../src/features/loyalty/components/LoyaltyDraftForm.jsx',
        import.meta.url,
      ),
      'utf8',
    ),
    readFile(
      new URL(
        '../supabase/migrations/20260910010000_create_loyalty_programme_drafts.sql',
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

  assert.match(form, /Private draft/)
  assert.match(migration, /status = 'draft'/)
  assert.match(
    publicationMigration,
    /Consumers can view active loyalty programmes/,
  )
  assert.match(publicationMigration, /using \(status = 'active'\)/)
})

test('draft validation identifies invalid values without requiring completion', () => {
  assert.equal(sanitizeRewardThreshold('8 stamps'), '8')
  assert.deepEqual(validateLoyaltyDraft(EMPTY_DRAFT), {})

  const errors = validateLoyaltyDraft({
    ...EMPTY_DRAFT,
    name: 'A',
    programmeType: 'visits',
    rewardThreshold: '0',
  })
  assert.match(errors.name, /between 3 and 120/i)
  assert.match(errors.programmeType, /valid programme type/i)
  assert.match(errors.rewardThreshold, /between \$1 and \$1,000,000/i)
})
