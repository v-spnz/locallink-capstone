import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('consumer and business logout clear registration state and open login', async () => {
  const [consumerProfile, businessSettings] = await Promise.all([
    readFile(
      new URL('../src/pages/customer/Profile.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/pages/business/Settings.jsx', import.meta.url),
      'utf8',
    ),
  ])

  for (const logoutPage of [consumerProfile, businessSettings]) {
    assert.match(
      logoutPage,
      /clearRegistrationFlow\(\)[\s\S]*supabase\.auth\.signOut\(\)/,
    )
    assert.match(logoutPage, /navigate\('\/login', \{ replace: true \}\)/)
  }
})
