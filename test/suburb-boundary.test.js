import assert from 'node:assert/strict'
import test from 'node:test'
import { selectSuburbBoundary } from '../src/features/location/api/suburbBoundaries.js'

const polygon = {
  type: 'Feature',
  properties: {
    name: 'Whangārei Central',
    name_ascii: 'Whangarei Central',
  },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [174.31, -35.73],
        [174.33, -35.73],
        [174.33, -35.71],
        [174.31, -35.73],
      ],
    ],
  },
}

test('suburb boundary matching accepts English names for macronised LINZ names', () => {
  assert.equal(selectSuburbBoundary([polygon], 'Whangarei Central'), polygon)
})

test('suburb boundary matching does not choose an ambiguous wrong area', () => {
  const secondPolygon = {
    ...polygon,
    properties: { name: 'Regent' },
  }

  assert.equal(
    selectSuburbBoundary([polygon, secondPolygon], 'Mount Wellington'),
    null,
  )
})
