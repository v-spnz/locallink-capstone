import L from 'leaflet'
import { useEffect } from 'react'
import {
  Circle,
  CircleMarker,
  MapContainer,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet'

function MapViewport({ location, businesses }) {
  const map = useMap()

  useEffect(() => {
    const points = [
      [location.latitude, location.longitude],
      ...businesses.map((business) => [business.latitude, business.longitude]),
    ]
    if (points.length === 1) {
      map.setView(points[0], 13)
    } else {
      map.fitBounds(L.latLngBounds(points), { padding: [34, 34], maxZoom: 14 })
    }
  }, [businesses, location, map])

  return null
}

export default function DiscoveryMap({ location, radiusKm, businesses }) {
  return (
    <div className="discovery-map" aria-label="Nearby businesses map">
      <MapContainer
        center={[location.latitude, location.longitude]}
        zoom={13}
        scrollWheelZoom
      >
        <TileLayer
          attribution='Powered by <a href="https://www.geoapify.com/" target="_blank">Geoapify</a> | <a href="https://openmaptiles.org/" target="_blank">&copy; OpenMapTiles</a> <a href="https://www.openstreetmap.org/copyright" target="_blank">&copy; OpenStreetMap</a> contributors'
          url={`https://maps.geoapify.com/v1/tile/osm-bright-grey/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_API_KEY}`}
        />
        <Circle
          center={[location.latitude, location.longitude]}
          radius={radiusKm * 1000}
          pathOptions={{
            color: '#3b5bdb',
            fillColor: '#3b5bdb',
            fillOpacity: 0.06,
          }}
        />
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
          <Popup>Your search location</Popup>
        </CircleMarker>
        {businesses.map((business) => (
          <CircleMarker
            key={`${business.business_id}-${business.location_id}`}
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
        <MapViewport location={location} businesses={businesses} />
      </MapContainer>
    </div>
  )
}
