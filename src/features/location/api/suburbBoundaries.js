const LINZ_SUBURB_LAYER_URL =
  'https://services.arcgis.com/xdsHIIxuCWByZiCB/ArcGIS/rest/services/LINZ_NZ_Suburbs_and_Localities/FeatureServer/0/query'

function isPolygonFeature(feature) {
  return ['Polygon', 'MultiPolygon'].includes(feature?.geometry?.type)
}

function normalizeName(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('en-NZ')
}

function featureNames(feature) {
  const properties = feature?.properties || {}
  return [
    properties.name,
    properties.name_ascii,
    properties.additional_name,
    properties.additional_name_ascii,
    properties.major_name,
    properties.major_name_ascii,
  ].map(normalizeName)
}

export function selectSuburbBoundary(features, suburb) {
  const polygonFeatures = (features || []).filter(isPolygonFeature)
  const targetName = normalizeName(suburb)

  return (
    polygonFeatures.find((feature) =>
      featureNames(feature).includes(targetName),
    ) || (polygonFeatures.length === 1 ? polygonFeatures[0] : null)
  )
}

export async function fetchSuburbBoundary(location, { signal } = {}) {
  const latitude = Number(location?.latitude)
  const longitude = Number(location?.longitude)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null

  const query = new URLSearchParams({
    geometry: `${longitude},${latitude}`,
    geometryType: 'esriGeometryPoint',
    inSR: '4326',
    spatialRel: 'esriSpatialRelIntersects',
    outFields:
      'name,name_ascii,additional_name,additional_name_ascii,major_name,major_name_ascii,territorial_authority',
    returnGeometry: 'true',
    outSR: '4326',
    f: 'geojson',
  })
  const response = await fetch(`${LINZ_SUBURB_LAYER_URL}?${query}`, { signal })

  if (!response.ok) {
    throw new Error('Unable to load the selected suburb boundary.')
  }

  const data = await response.json()
  if (data.error) {
    throw new Error('Unable to load the selected suburb boundary.')
  }

  return selectSuburbBoundary(data.features, location.suburb)
}
