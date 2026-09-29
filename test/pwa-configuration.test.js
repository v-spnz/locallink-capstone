import assert from 'node:assert/strict'
import { access, readFile } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('PWA configuration keeps LocalLink installable without caching API data', async () => {
  const [viteConfig, html, redirects, packageJson] = await Promise.all([
    read('../vite.config.js'),
    read('../index.html'),
    read('../public/_redirects'),
    read('../package.json'),
  ])

  assert.match(viteConfig, /VitePWA/)
  assert.match(viteConfig, /registerType: 'autoUpdate'/)
  assert.match(viteConfig, /display: 'standalone'/)
  assert.match(viteConfig, /start_url: '\/'/)
  assert.match(viteConfig, /scope: '\/'/)
  assert.match(viteConfig, /pwa-192x192\.png/)
  assert.match(viteConfig, /pwa-512x512\.png/)
  assert.match(viteConfig, /pwa-maskable-512x512\.png/)
  assert.doesNotMatch(viteConfig, /runtimeCaching|supabase/)

  assert.match(html, /name="theme-color" content="#3b5bdb"/)
  assert.match(html, /name="apple-mobile-web-app-capable" content="yes"/)
  assert.match(html, /name="mobile-web-app-capable" content="yes"/)
  assert.match(html, /rel="apple-touch-icon"/)
  assert.equal(redirects.trim(), '/* /index.html 200')

  const dependencies = JSON.parse(packageJson).devDependencies
  assert.ok(dependencies['vite-plugin-pwa'])
  assert.ok(dependencies['@vite-pwa/assets-generator'])

  await Promise.all([
    access(new URL('../public/pwa-192x192.png', import.meta.url)),
    access(new URL('../public/pwa-512x512.png', import.meta.url)),
    access(new URL('../public/pwa-maskable-512x512.png', import.meta.url)),
    access(new URL('../public/apple-touch-icon.png', import.meta.url)),
  ])
})
