'use client';

import {
  LayerGroup,
  LayersControl,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from 'react-leaflet';
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
const UNCATEGORIZED = 'Other';

export interface VenueMapMarker {
  id: string;
  slug: string;
  name: string;
  lat: number;
  lng: number;
  categoryName?: string | null;
  rating?: { overall: number; reviewCount: number };
}

export function VenueMap({ markers }: { markers: VenueMapMarker[] }) {
  const center: [number, number] =
    markers.length > 0 ? [markers[0].lat, markers[0].lng] : BANGKOK_CENTER;

  const byCategory = new Map<string, VenueMapMarker[]>();
  for (const marker of markers) {
    const category = marker.categoryName ?? UNCATEGORIZED;
    const list = byCategory.get(category) ?? [];
    list.push(marker);
    byCategory.set(category, list);
  }
  const categories = [...byCategory.keys()].sort();

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
      {/*
        Leaflet's layers-control pattern: one toggleable overlay (LayerGroup)
        per venue category. Only worth showing when there's actually more than
        one category to toggle between - a single-venue detail map just renders
        its markers directly.
      */}
      {categories.length > 1 ? (
        <LayersControl position="topright">
          {categories.map((category) => (
            <LayersControl.Overlay key={category} checked name={category}>
              <LayerGroup>
                {byCategory.get(category)!.map((marker) => (
                  <VenueMarker key={marker.id} marker={marker} />
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          ))}
        </LayersControl>
      ) : (
        markers.map((marker) => <VenueMarker key={marker.id} marker={marker} />)
      )}
    </MapContainer>
  );
}

function VenueMarker({ marker }: { marker: VenueMapMarker }) {
  return (
    <Marker position={[marker.lat, marker.lng]}>
      <Popup>
        <div className="min-w-[10rem]">
          <Link href={`/venues/${marker.slug}`} className="font-medium">
            {marker.name}
          </Link>
          {marker.categoryName && <p className="text-xs text-muted">{marker.categoryName}</p>}
          {marker.rating && (
            <p className="mt-1 text-sm">
              {marker.rating.reviewCount > 0 ? (
                <>
                  ★ {marker.rating.overall.toFixed(1)}{' '}
                  <span className="text-muted">
                    ({marker.rating.reviewCount}{' '}
                    {marker.rating.reviewCount === 1 ? 'review' : 'reviews'})
                  </span>
                </>
              ) : (
                <span className="text-muted">No reviews yet</span>
              )}
            </p>
          )}
          <Link href={`/venues/${marker.slug}`} className="mt-1 inline-block text-sm text-accent">
            View venue →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
