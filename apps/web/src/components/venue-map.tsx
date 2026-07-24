'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CircleMarker,
  MapContainer,
  Marker,
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

const CATEGORIES = [
  { value: null,         label: 'All' },
  { value: 'BAR',        label: 'Bar' },
  { value: 'CLUB',       label: 'Club' },
  { value: 'ROOFTOP',    label: 'Rooftop' },
  { value: 'LIVE_MUSIC', label: 'Live Music' },
  { value: 'LOUNGE',     label: 'Lounge' },
  { value: 'OTHER',      label: 'Other' },
];

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
  canCreate = false,
}: {
  markers?: VenueMapMarker[];
  center?: [number, number];
  zoom?: number;
  showCenterPin?: boolean;
  canCreate?: boolean;
}) {
  const geoMode = externalMarkers === undefined;
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [allMarkers, setAllMarkers] = useState<VenueMapMarker[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [listOpen, setListOpen] = useState(false);

  const loadAllBangkok = async () => {
    try {
      const res = await fetch(`${API_BASE}/venues?pageSize=5000`, { signal: AbortSignal.timeout(10000) });
      const data = (await res.json()) as { items: VenueListItemDto[] };
      setAllMarkers((data.items ?? []).map(toMarker));
    } catch {
      setAllMarkers([]);
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
          setAllMarkers((data.items ?? []).map(toMarker));
        } catch {
          setAllMarkers([]);
        }
      },
      () => { setGeoStatus('denied'); loadAllBangkok(); },
      { timeout: 10000, maximumAge: 60000 },
    );
  }, [geoMode]); // eslint-disable-line react-hooks/exhaustive-deps

  const nearbyMarkers = geoMode
    ? (selectedCategory ? allMarkers.filter(m => m.categoryName === selectedCategory) : allMarkers)
    : externalMarkers!;

  const markers = nearbyMarkers;
  const mapCenter: [number, number] = center ?? BANGKOK_CENTER;
  const mapZoom = zoom ?? 11;
  const showPin = showCenterPin && markers.length > 0;

  return (
    <div className="relative h-full w-full">
      {/* Geo status banner */}
      {geoMode && geoStatus === 'loading' && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1 text-sm text-white backdrop-blur-sm">
            กำลังหาตำแหน่งของคุณ…
          </span>
        </div>
      )}
      {geoMode && geoStatus === 'denied' && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1 text-sm text-white backdrop-blur-sm">
            ไม่ได้รับอนุญาตใช้ตำแหน่ง — แสดง Bangkok ทั้งหมด
          </span>
        </div>
      )}
      {geoMode && geoStatus === 'granted' && allMarkers.length === 0 && (
        <div className="pointer-events-none absolute inset-x-0 top-16 z-[1000] flex justify-center">
          <span className="rounded-full bg-black/60 px-4 py-1 text-sm text-white backdrop-blur-sm">
            ไม่พบร้านในรัศมี 3 กม.
          </span>
        </div>
      )}

      {/* Category filter chips */}
      {geoMode && (
        <div className="absolute inset-x-0 top-20 z-[1000] flex justify-center px-4 pointer-events-auto">
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide max-w-full">
            {CATEGORIES.map(({ value, label }) => (
              <button
                key={label}
                onClick={() => setSelectedCategory(value)}
                className={`flex-shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  selectedCategory === value
                    ? 'bg-accent text-background'
                    : 'bg-black/60 text-white backdrop-blur-sm hover:bg-black/80'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Creator FAB */}
      {canCreate && geoMode && (
        <div className="absolute bottom-48 right-4 z-[1000]">
          <Link
            href="/venues/add"
            className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-background shadow-lg hover:opacity-90 transition-opacity"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </Link>
        </div>
      )}

      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        className="h-full w-full"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=f3199d5697904c388c2af578a23e2844"
        />

        {geoMode && <MapController pos={userPos} />}

        {userPos && (
          <CircleMarker
            center={userPos}
            radius={8}
            pathOptions={{ color: '#fff', fillColor: '#3b82f6', fillOpacity: 1, weight: 2 }}
          />
        )}

        {/* Cluster only at wide zoom (all-Bangkok view). At zoom 12+ show every pin. */}
        <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={12}>
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

      {/* Venue list panel */}
      {geoMode && (
        <div
          className={`absolute bottom-0 inset-x-0 z-[1000] bg-surface rounded-t-2xl shadow-2xl transition-all duration-300 ${
            listOpen ? 'h-[45%]' : 'h-14'
          }`}
        >
          {/* Handle + toggle */}
          <button
            onClick={() => setListOpen(o => !o)}
            className="w-full flex flex-col items-center pt-2 pb-1"
          >
            <div className="w-10 h-1 rounded-full bg-white/20 mb-2" />
            <span className="text-sm text-muted">
              {markers.length} venue{markers.length !== 1 ? 's' : ''}{' '}
              {geoStatus === 'granted' ? 'nearby' : 'found'}
              {selectedCategory ? ` · ${CATEGORIES.find(c => c.value === selectedCategory)?.label}` : ''}
              {' '}{listOpen ? '▾' : '▴'}
            </span>
          </button>

          {listOpen && (
            <div className="overflow-y-auto h-[calc(100%-3.5rem)] px-4 pb-4">
              {markers.length === 0 ? (
                <p className="text-center text-sm text-muted mt-8">No venues found.</p>
              ) : (
                markers.map((m) => (
                  <Link
                    key={m.id}
                    href={`/venues/${m.id}`}
                    className="flex items-center gap-3 py-3 border-b border-border last:border-0 hover:opacity-80"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{m.name}</p>
                      {m.categoryName && (
                        <p className="text-xs text-muted capitalize">
                          {m.categoryName.replace('_', ' ').toLowerCase()}
                        </p>
                      )}
                    </div>
                    {m.rating && m.rating.reviewCount > 0 && (
                      <span className="text-xs text-muted flex-shrink-0">
                        ★ {m.rating.overall.toFixed(1)}
                      </span>
                    )}
                  </Link>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function VenueMarker({ marker }: { marker: VenueMapMarker }) {
  return (
    <Marker
      position={[marker.lat, marker.lng]}
      eventHandlers={{
        click: () => { window.location.href = `/venues/${marker.id}`; },
      }}
    />
  );
}
