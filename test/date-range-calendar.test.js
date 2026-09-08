import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

test('business deal availability uses the shared accessible range calendar', async () => {
  const [calendar, form, styles, packageJson] = await Promise.all([
    readFile(
      new URL('../src/components/ui/DateRangeCalendar.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/features/deals/components/DealForm.jsx', import.meta.url),
      'utf8',
    ),
    readFile(
      new URL('../src/components/ui/DateRangeCalendar.css', import.meta.url),
      'utf8',
    ),
    readFile(new URL('../package.json', import.meta.url), 'utf8'),
  ])

  assert.match(calendar, /<DayPicker/)
  assert.match(calendar, /mode="range"/)
  assert.match(calendar, /selected=\{selected\}/)
  assert.match(calendar, /onSelect=\{handleSelect\}/)
  assert.match(calendar, /resetOnSelect/)
  assert.match(calendar, /locale=\{enNZ\}/)
  assert.match(calendar, /Choose a start date, then choose an end date/)
  assert.match(form, /<DateRangeCalendar/)
  assert.match(form, /onChange\('startDate', range\.startDate\)/)
  assert.match(form, /onChange\('endDate', range\.endDate\)/)
  assert.doesNotMatch(form, /id="deal-start-date"[\s\S]*?type="date"/)
  assert.match(styles, /\.rdp-day_button\):focus-visible/)
  assert.match(styles, /prefers-reduced-motion: reduce/)
  assert.match(packageJson, /"react-day-picker"/)
  assert.match(packageJson, /"date-fns"/)
})
