'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import Link from 'next/link';
import 'leaflet/dist/leaflet.css';
import type { VenueListItemDto } from '@chiwitrakmaochaaowelarakkhrai/shared-types';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl: new URL('leaflet/dist/images/marker-icon.png', import.meta.url).href,
  shadowUrl: new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api';

export interface VenueMapMarker {
  id: string;
  slug?: string;
  name: string;
  lat: number;
  lng: number;
  categoryName?: string | null;
  coverPhoto?: string | null;
  rating?: { overall: number; reviewCount: number };
}

function toMarker(v: VenueListItemDto): VenueMapMarker {
  return {
    id: v.id,
    name: v.name,
    lat: v.lat,
    lng: v.lng,
    categoryName: v.category,
    coverPhoto: (v.photos as string[])[0] ?? null,
    rating: v.topRating !== null
      ? { overall: v.topRating, reviewCount: v.reviewCount }
      : undefined,
  };
}

// Recenter map when userPos changes
function MapController({ pos }: { pos: [number, number] | null }) {
  const map = useMap();
  const didFly = useRef(false);
  useEffect(() => {
    if (pos && !didFly.current) {
      didFly.current = true;
      map.flyTo(pos, 14, { duration: 1 });
    }
  }, [pos, map]);
  return null;
}

export function VenueMap({
  markers: externalMarkers,
  center,
  zoom,
  showCenterPin = false,
}: {
  markers?: VenueMapMarker[];
  center?: [number, number];
  zoom?: number;
  showCenterPin?: boolean;
}) {
  // ── Geolocation mode (home page — no external markers) ──────────────────
  const geoMode = externalMarkers === undefined;
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [nearbyMarkers, setNearbyMarkers] = useState<VenueMapMarker[]>([]);

  const loadAllBangkok = async () => {
    try {
      const res = await fetch(`${API_BASE}/venues?pageSize=5000`, { signal: AbortSignal.timeout(10000) });
      const data = (await res.json()) as { items: VenueListItemDto[] };
      setNearbyMarkers((data.items ?? []).map(toMarker));
    } catch {
      setNearbyMarkers([]);
    }
  };

  useEffect(() => {
    if (!geoMode) return;
    if (!navigator.geolocation) { setGeoStatus('denied'); loadAllBangkok(); return; }

    setGeoStatus('loading');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setUserPos([lat, lng]);
        setGeoStatus('granted');

        try {
          const res = await fetch(
            `${API_BASE}/venues?lat=${lat}&lng=${lng}&radiusM=3000&pageSize=300`,
            { signal: AbortSignal.timeout(8000) },
          );
          const data = (await res.json()) as { items: VenueListItemDto[] };
          setNearbyMarkers((data.items ?? []).map(toMarker));
        } catch {
          setNearbyMarkers([]);
        }
      },
      () => { setGeoStatus('denied'); loadAllBangkok(); },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, [geoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Resolved values ──────────────────────────────────────────────────────
  const markers = geoMode ? nearbyMarkers : externalMarkers!;
  const mapCenter: [number, number] = center ?? BANGKOK_CENTER;
  const mapZoom = zoom ?? 11;
  const showPin = showCenterPin && markers.length > 0;

  return (
    <div className="relative h-full w-full">
      {/* Status banner (geo mode only) */}
      {geoMode && geoStatus === 'loading' && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1 text-sm text-white backdrop-blur-sm">
            กำลังหาตำแหน่งของคุณ…
          </span>
        </div>
      )}
      {geoMode && geoStatus === 'denied' && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1 text-sm text-white backdrop-blur-sm">
            ไม่ได้รับอนุญาตใช้ตำแหน่ง — แสดง Bangkok ทั้งหมด
          </span>
        </div>
      )}
      {geoMode && geoStatus === 'granted' && nearbyMarkers.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-14 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1 text-sm text-white backdrop-blur-sm">
            ไม่พบร้านในรัศมี 3 กม.
          </span>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={false}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=f3199d5697904c388c2af578a23e2844"
        />

        {geoMode && <MapController pos={userPos} />}

        {/* User location dot */}
        {userPos && (
          <CircleMarker
            center={userPos}
            radius={8}
            pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
          />
        )}

        <MarkerClusterGroup chunkedLoading>
          {markers.map((marker) => (
            <VenueMarker key={marker.id} marker={marker} />
          ))}
        </MarkerClusterGroup>
      </MapContainer>

      {showPin ? (
        <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
          <div className="relative">
            <div className="h-4 w-4 rounded-full bg-accent border-2 border-white shadow-xl" />
            <div className="absolute left-1/2 top-full -translate-x-1/2 h-0 w-0 border-x-4 border-x-transparent border-t-4 border-t-accent" />
          </div>
        </div>
      ) : null}
    </div>
  );
}

function VenueMarker({ marker }: { marker: VenueMapMarker }) {
  return (
    <Marker position={[marker.lat, marker.lng]}>
      <Popup>
        <div className="w-40">
          {marker.coverPhoto && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={marker.coverPhoto}
              alt={marker.name}
              className="mb-2 h-20 w-full rounded object-cover"
            />
          )}
          <Link href={`/venues/${marker.id}`} className="font-medium">
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
          <Link href={`/venues/${marker.id}`} className="mt-1 inline-block text-sm text-accent">
            View venue →
          </Link>
        </div>
      </Popup>
    </Marker>
  );
}
