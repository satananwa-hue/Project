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

function createVenueIcon(hasReviews: boolean) {
  return L.divIcon({
    html: `<div style="
      width:26px;height:26px;
      background:${hasReviews ? '#8B5CF6' : '#494454'};
      border:2px solid rgba(255,255,255,0.25);
      border-radius:50%;
      box-shadow:${hasReviews ? '0 0 14px rgba(139,92,246,0.75)' : 'none'};
    "></div>`,
    className: '',
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
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
  isLoggedIn = false,
}: {
  markers?: VenueMapMarker[];
  center?: [number, number];
  zoom?: number;
  showCenterPin?: boolean;
  canCreate?: boolean;
  isLoggedIn?: boolean;
}) {
  const geoMode = externalMarkers === undefined;
  const [userPos, setUserPos] = useState<[number, number] | null>(null);
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const [allMarkers, setAllMarkers] = useState<VenueMapMarker[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const isLoggedInRef = useRef(isLoggedIn);
  isLoggedInRef.current = isLoggedIn;

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
    if (!isLoggedInRef.current) { loadAllBangkok(); return; }
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

  const baseMarkers = geoMode
    ? (selectedCategory ? allMarkers.filter(m => m.categoryName === selectedCategory) : allMarkers)
    : externalMarkers!;

  const markers = isLoggedIn
    ? baseMarkers
    : baseMarkers.filter(m => m.rating !== undefined && m.rating.reviewCount > 0);

  const mapCenter: [number, number] = center ?? BANGKOK_CENTER;
  const mapZoom = zoom ?? 11;
  const showPin = showCenterPin && markers.length > 0;

  const countLabel = `${markers.length} ${!isLoggedIn ? 'reviewed ' : ''}venue${markers.length !== 1 ? 's' : ''} ${isLoggedIn && geoStatus === 'granted' ? 'nearby' : 'in Bangkok'}`;

  return (
    <div className="relative flex h-full w-full overflow-hidden">


      {/* ── Map + overlays ────────────────────────────────── */}
      <div className="relative flex-1 h-full min-w-0">

        {/* Geo status banner (logged-in only) */}
        {geoMode && isLoggedIn && geoStatus === 'loading' && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center fade-up">
            <span className="rounded-full bg-black/70 px-4 py-1 text-xs text-white/80 backdrop-blur-md border border-white/10">
              กำลังหาตำแหน่งของคุณ…
            </span>
          </div>
        )}
        {geoMode && isLoggedIn && geoStatus === 'denied' && (
          <div className="pointer-events-none absolute inset-x-0 top-3 z-[1000] flex justify-center fade-up">
            <span className="rounded-full bg-black/70 px-4 py-1 text-xs text-white/80 backdrop-blur-md border border-white/10">
              ไม่ได้รับอนุญาตใช้ตำแหน่ง — แสดง Bangkok ทั้งหมด
            </span>
          </div>
        )}

        {/* Category chips — float over map */}
        {geoMode && (
          <div className="absolute top-3 inset-x-0 z-[1000] flex justify-center pointer-events-auto px-4">
            <div className="flex gap-2 overflow-x-auto pb-1 max-w-full" style={{ scrollbarWidth: 'none' }}>
              {CATEGORIES.map(({ value, label }) => (
                <button
                  key={label}
                  onClick={() => setSelectedCategory(value)}
                  className={`flex-shrink-0 rounded-full px-4 py-1.5 text-xs font-bold tracking-wide transition-all border ${
                    selectedCategory === value
                      ? 'bg-accent text-white border-transparent shadow-lg shadow-accent/30'
                      : 'bg-black/60 text-white/80 border-white/10 backdrop-blur-md hover:border-accent/50 hover:text-accent'
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
          <div className="absolute bottom-48 right-4 z-[1000] md:bottom-8">
            <Link
              href="/venues/add"
              className="flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-xl shadow-accent/30 hover:bg-accent/90 transition-all active:scale-95"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </Link>
          </div>
        )}

        {/* Leaflet map */}
        <MapContainer center={mapCenter} zoom={mapZoom} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a> | &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=f3199d5697904c388c2af578a23e2844"
          />

          {geoMode && <MapController pos={userPos} />}

          {userPos && (
            <CircleMarker
              center={userPos}
              radius={8}
              pathOptions={{ color: '#fff', fillColor: '#8B5CF6', fillOpacity: 1, weight: 2 }}
            />
          )}

          <MarkerClusterGroup chunkedLoading disableClusteringAtZoom={12}>
            {markers.map((marker) => (
              <VenueMarker key={marker.id} marker={marker} />
            ))}
          </MarkerClusterGroup>
        </MapContainer>

        {showPin && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <div className="h-4 w-4 rounded-full bg-accent border-2 border-white shadow-xl live-pulse" />
          </div>
        )}

        {/* ── Mobile bottom sheet ────────────────────────── */}
        {geoMode && (
          <MobileVenueSheet markers={markers} countLabel={countLabel} />
        )}
      </div>
    </div>
  );
}

/* ── Mobile bottom sheet ───────────────────────────────── */
function MobileVenueSheet({ markers, countLabel }: { markers: VenueMapMarker[]; countLabel: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className={`md:hidden absolute bottom-0 inset-x-0 z-[1000] glass-panel rounded-t-2xl shadow-2xl transition-all duration-300 ${
        open ? 'h-[55%]' : 'h-14'
      }`}
    >
      {/* Handle + toggle */}
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex flex-col items-center pt-2 pb-1"
      >
        <div className="w-10 h-1 rounded-full bg-white/15 mb-2" />
        <span className="text-xs text-muted">
          {countLabel} {open ? '▾' : '▴'}
        </span>
      </button>

      {open && (
        <div className="overflow-y-auto h-[calc(100%-3.5rem)] px-4 pb-4 space-y-3">
          {markers.length === 0 ? (
            <p className="text-center text-sm text-muted mt-8">No venues found.</p>
          ) : (
            markers.map((m) => (
              <Link
                key={m.id}
                href={`/venues/${m.id}`}
                className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0"
              >
                {m.coverPhoto && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.coverPhoto} alt={m.name} className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  {m.categoryName && (
                    <p className="text-xs text-muted capitalize">{m.categoryName.replace('_', ' ').toLowerCase()}</p>
                  )}
                </div>
                {m.rating && m.rating.reviewCount > 0 && (
                  <span className="text-xs text-muted flex-shrink-0 flex items-center gap-1">
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    {m.rating.overall.toFixed(1)}
                  </span>
                )}
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}

/* ── Map marker ────────────────────────────────────────── */
function VenueMarker({ marker }: { marker: VenueMapMarker }) {
  const hasReviews = !!(marker.rating && marker.rating.reviewCount > 0);
  return (
    <Marker
      position={[marker.lat, marker.lng]}
      icon={createVenueIcon(hasReviews)}
      eventHandlers={{
        click: () => { window.location.href = `/venues/${marker.id}`; },
      }}
    />
  );
}
