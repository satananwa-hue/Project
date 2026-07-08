'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';

// Leaflet's default marker icon paths assume a plain file server, which breaks
// under Next.js's bundler. `new URL(..., import.meta.url)` is the bundler-standard
// way to reference a node_modules asset and get a real, working URL back
// (a plain ES module default import of the .png only resolves to bundler
// metadata for app-local assets, not third-party package assets).
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];

export interface VenueMapMarker {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
}

export function VenueMap({ markers }: { markers: VenueMapMarker[] }) {
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : BANGKOK_CENTER;

  return (
    <MapContainer
      center={center}
      zoom={markers.length > 0 ? 13 : 11}
      scrollWheelZoom={false}
      className="h-full w-full"
    >
      {/*
        CARTO's free dark basemap - no API key/billing account needed, unlike
        Google Maps. Matches the app's dark-mode-first branding instead of the
        default light OpenStreetMap look.
      */}
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        subdomains="abcd"
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]}>
          <Popup>
            <Link href={`/venues/${marker.slug}`} className="font-medium">
              {marker.name}
            </Link>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
