import React, { useRef } from 'react'
import { View, StyleSheet, ActivityIndicator } from 'react-native'
import { WebView } from 'react-native-webview'
import { Venue } from '@/lib/venues'

interface VenueMapProps {
  venues: Venue[]
  userCoords: { lat: number; lng: number } | null
  onVenuePress: (venue: Venue) => void
}

export default function VenueMap({ venues, userCoords, onVenuePress }: VenueMapProps) {
  const webViewRef = useRef<WebView>(null)

  const centerLat = userCoords?.lat ?? -33.4489
  const centerLng = userCoords?.lng ?? -70.6693

  const venuesJson = JSON.stringify(
    venues.map(v => ({
      id: v.id,
      name: v.name,
      lat: Number(v.lat),
      lng: Number(v.lng),
      price: v.is_municipal
        ? 'Gratis'
        : `$${Number(v.price_platform).toLocaleString('es-CL')} / hr`,
      featured: v.is_featured,
      municipal: v.is_municipal,
    }))
  )

  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body, #map { width: 100%; height: 100%; }
    .popup-name { font-weight: bold; font-size: 14px; color: #111827; }
    .popup-price { font-size: 13px; color: #16a34a; margin: 4px 0; }
    .popup-btn {
      display: block; width: 100%;
      background: #16a34a; color: white;
      border: none; border-radius: 8px;
      padding: 8px; font-size: 13px;
      cursor: pointer; margin-top: 6px;
      font-weight: 600;
    }
    .leaflet-popup-content { min-width: 160px; }
    .user-dot {
      width: 16px; height: 16px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(37,99,235,0.25);
    }
    .legend {
      position: absolute; bottom: 24px; left: 12px;
      background: white; border-radius: 10px;
      padding: 8px 12px; z-index: 1000;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);
      display: flex; gap: 12px; align-items: center;
      font-size: 12px; color: #374151;
    }
    .dot { width:10px; height:10px; border-radius:50%; display:inline-block; margin-right:4px; }
  </style>
</head>
<body>
  <div id="map"></div>
  <div class="legend">
    <span><span class="dot" style="background:#16a34a"></span>Destacada</span>
    <span><span class="dot" style="background:#6b7280"></span>Cancha</span>
    <span><span class="dot" style="background:#2563eb"></span>Tú</span>
  </div>
  <script>
    const map = L.map('map', { zoomControl: true }).setView([${centerLat}, ${centerLng}], 14)

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
      subdomains: ['a','b','c']
    }).addTo(map)

    const venues = ${venuesJson}

    venues.forEach(venue => {
      const color = venue.featured ? '#16a34a' : '#6b7280'
      const marker = L.circleMarker([venue.lat, venue.lng], {
        radius: venue.featured ? 12 : 9,
        fillColor: color,
        color: 'white',
        weight: 2,
        opacity: 1,
        fillOpacity: 0.9
      }).addTo(map)

      marker.bindPopup(\`
        <div class="popup-name">\${venue.name}</div>
        <div class="popup-price">\${venue.price}</div>
        <button class="popup-btn" onclick="selectVenue('\${venue.id}')">
          Ver detalle →
        </button>
      \`)
    })

    ${userCoords ? `
    const userIcon = L.divIcon({
      className: '',
      html: '<div class="user-dot"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    })
    L.marker([${userCoords.lat}, ${userCoords.lng}], { icon: userIcon }).addTo(map)
    ` : ''}

    function selectVenue(id) {
      window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'VENUE_PRESS', id }))
    }
  </script>
</body>
</html>
  `

  const handleMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data)
      if (data.type === 'VENUE_PRESS') {
        const venue = venues.find(v => v.id === data.id)
        if (venue) onVenuePress(venue)
      }
    } catch (e) {}
  }

  return (
    <View style={{ flex: 1 }}>
      <WebView
        ref={webViewRef}
        source={{ html }}
        style={{ flex: 1 }}
        onMessage={handleMessage}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        renderLoading={() => (
          <View style={styles.loading}>
            <ActivityIndicator size="large" color="#16a34a" />
          </View>
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  loading: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
  },
})