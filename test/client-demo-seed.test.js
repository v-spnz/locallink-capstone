import assert from 'node:assert/strict'
import { readFile, stat } from 'node:fs/promises'
import test from 'node:test'

const read = (path) => readFile(new URL(path, import.meta.url), 'utf8')

test('client demo seed keeps accounts and lifecycle content in Mount Wellington', async () => {
  const [config, seed] = await Promise.all([
    read('../supabase/config.toml'),
    read('../supabase/seeds/mount-wellington-client-demo.sql'),
  ])

  assert.match(config, /\.\/seeds\/mount-wellington-client-demo\.sql/)
  assert.match(seed, /update public\.profiles[\s\S]+Mount Wellington/)
  assert.match(seed, /update public\.job_requests[\s\S]+Mount Wellington/)
  assert.match(seed, /mount_wellington_account_deals/)
  assert.match(seed, /mount_wellington_account_loyalty/)

  for (const businessId of [
    '21000000-0000-0000-0000-000000000001',
    '31000000-0000-0000-0000-000000000001',
    '41000000-0000-0000-0000-000000000001',
    '51000000-0000-0000-0000-000000000001',
    '61000000-0000-0000-0000-000000000001',
  ]) {
    assert.match(seed, new RegExp(businessId))
  }

  for (const image of [
    'maungarei-cafe-brunch.jpg',
    'mount-wellington-electrical.jpg',
    'mount-wellington-florist.jpg',
    'mount-wellington-home-garden.jpg',
    'mount-wellington-plumbing.jpg',
  ]) {
    const imageStats = await stat(
      new URL(`../public/demo/deals/${image}`, import.meta.url),
    )
    assert.ok(imageStats.size > 100_000, `${image} should be a real demo image`)
    assert.match(seed, new RegExp(`/demo/deals/${image.replace('.', '\\.')}`))
  }
})
