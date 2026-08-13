import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('consumer navigation uses the business navbar design and icon links', async () => {
  const navigation = await readFile(
    new URL(
      '../src/components/navigation/CustomerNavigation.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(navigation, /business-portal-header customer-portal-header/)
  assert.match(navigation, /business-nav customer-nav/)
  assert.match(navigation, /variant="business"/)
  for (const icon of ['House', 'BadgePercent', 'Gift', 'BriefcaseBusiness']) {
    assert.match(navigation, new RegExp(`icon: <${icon}`))
  }
})

test('consumer notification bell is present without notification behaviour', async () => {
  const navigation = await readFile(
    new URL(
      '../src/components/navigation/CustomerNavigation.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(navigation, /className="business-notification-button"/)
  assert.match(navigation, /aria-label="Notifications coming soon"/)
  assert.match(navigation, /aria-disabled="true"/)
  assert.doesNotMatch(navigation, /onClick=/)
  assert.doesNotMatch(navigation, /useBusinessNotifications/)
  assert.doesNotMatch(navigation, /notification-dropdown/)
})
