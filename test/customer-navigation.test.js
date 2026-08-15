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

test('customer notifications include a dismiss action button', async () => {
  const navigation = await readFile(
    new URL(
      '../src/components/navigation/CustomerNavigation.jsx',
      import.meta.url,
    ),
    'utf8',
  )

  assert.match(navigation, /business-notification-button/)
  assert.match(navigation, /business-notification-button.*has-unread/)
  assert.match(
    navigation,
    /fill=\{unreadCount > 0 \? 'currentColor' : 'none'\}/,
  )
  assert.match(
    navigation,
    /aria-label="Dismiss notification"|title="Dismiss notification"/,
  )
  assert.match(navigation, /event\.preventDefault\(\)/)
  assert.match(navigation, /deleteNotification\(/)
})
