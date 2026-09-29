import L from 'leaflet'
import { useEffect, useState } from 'react'
import {
  CircleMarker,
  GeoJSON,
  MapContainer,
  Polygon,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'
import { fetchSuburbBoundary } from '../api/suburbBoundaries'

const WORLD_RING = [
  [-85, -180],
  [-85, 180],
  [85, 180],
  [85, -180],
  [-85, -180],
]

function toLeafletRing(ring) {
  return ring.map(([longitude, latitude]) => [latitude, longitude])
}

function createOutsideMaskPositions(geometry) {
  if (geometry?.type === 'Polygon') {
    return [WORLD_RING, toLeafletRing(geometry.coordinates[0])]
  }

  if (geometry?.type === 'MultiPolygon') {
    return [
      WORLD_RING,
      ...geometry.coordinates.map((polygon) => toLeafletRing(polygon[0])),
    ]
  }

  return null
}

function MapViewport({ location, businesses, boundary }) {
  const map = useMap()

  useEffect(() => {
    if (boundary) {
      const bounds = L.geoJSON(boundary).getBounds()
      bounds.extend([location.latitude, location.longitude])
      businesses.forEach((business) =>
        bounds.extend([business.latitude, business.longitude]),
      )
      map.fitBounds(bounds, {
        padding: [28, 28],
        maxZoom: 14,
      })
      return
    }

    const points = [
      [location.latitude, location.longitude],
      ...businesses.map((business) => [business.latitude, business.longitude]),
    ]
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [34, 34], maxZoom: 14 })
    }
  }, [boundary, businesses, location, map])

  return null
}

export default function DiscoveryMap({ location, businesses }) {
  const locationKey = `${location.suburb}-${location.latitude}-${location.longitude}`
  const [boundaryResult, setBoundaryResult] = useState({
    locationKey: '',
    feature: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    fetchSuburbBoundary(location, { signal: controller.signal })
      .then((feature) => setBoundaryResult({ locationKey, feature }))
      .catch((error) => {
        if (error.name !== 'AbortError') {
          console.warn('Unable to show the selected suburb boundary.', error)
        }
      })

    return () => controller.abort()
  }, [location, locationKey])

  const boundary =
    boundaryResult.locationKey === locationKey ? boundaryResult.feature : null
  const outsideMaskPositions = createOutsideMaskPositions(boundary?.geometry)

  return (
    <div className="discovery-map" aria-label="Nearby businesses map">
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={13}
        scrollWheelZoom
      >
        <TileLayer
          attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | Suburb boundaries &copy; <a href="https://data.linz.govt.nz/layer/113764-nz-suburbs-and-localities/" target="_blank">LINZ</a> | <a href="https://openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a> contributors'
          url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
        />
        {outsideMaskPositions && (
          <Polygon
            positions={outsideMaskPositions}
            interactive={false}
            pathOptions={{
              stroke: false,
              fillColor: '#475569',
              fillOpacity: 0.3,
              fillRule: 'evenodd',
            }}
          />
        )}
        {boundary && (
          <GeoJSON
            key={`${location.suburb}-${location.latitude}-${location.longitude}`}
            data={boundary}
            interactive={false}
            style={{
              color: '#3b5bdb',
              weight: 2,
              opacity: 0.9,
              fill: false,
            }}
          />
        )}
        <CircleMarker
          center={[location.latitude, location.longitude]}
          radius={8}
          pathOptions={{
            color: '#fff',
            weight: 3,
            fillColor: '#3b5bdb',
            fillOpacity: 1,
          }}
        >
          <Popup>Your registered suburb</Popup>
        </CircleMarker>
        {businesses.map((business, index) => (
          <CircleMarker
            key={`${business.business_id}-${business.location_id}-${index}`}
            center={[business.latitude, business.longitude]}
            radius={7}
            pathOptions={{
              color: '#fff',
              weight: 2,
              fillColor: '#12b886',
              fillOpacity: 1,
            }}
          >
            <Popup>
              <strong>{business.business_name}</strong>
              <br />
              {business.formatted_address}
              <br />
              {Number(business.distance_km).toFixed(1)} km away
            </Popup>
          </CircleMarker>
        ))}
        <MapViewport
          location={location}
          businesses={businesses}
          boundary={boundary}
        />
      </MapContainer>
    </div>
  )
}
