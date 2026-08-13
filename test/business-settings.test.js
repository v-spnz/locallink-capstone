import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('business settings provides a complete logout flow', async () => {
  const settings = await readFile(
    new URL('../src/pages/business/Settings.jsx', import.meta.url),
    'utf8',
  )

  assert.match(settings, /supabase\.auth\.signOut\(\)/)
  assert.match(settings, /navigate\('\/login', \{ replace: true \}\)/)
  assert.match(settings, /Unable to log out\. Please try again\./)
  assert.match(settings, /isLoggingOut \? 'Logging out…' : 'Log Out'/)
  assert.match(settings, /disabled=\{isLoggingOut\}/)
})

test('business settings can return to the consumer portal without logging out', async () => {
  const settings = await readFile(
    new URL('../src/pages/business/Settings.jsx', import.meta.url),
    'utf8',
  )

  assert.match(settings, /<Link className="btn-secondary" to="\/home">/)
  assert.match(settings, /Go to consumer portal/)
})
