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

const CATEGORY_COLORS: Record<string, string> = {
  BAR:        'bg-violet-500/20 text-violet-300 border-violet-500/30',
  CLUB:       'bg-purple-500/20 text-purple-300 border-purple-500/30',
  ROOFTOP:    'bg-sky-500/20 text-sky-300 border-sky-500/30',
  LIVE_MUSIC: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  LOUNGE:     'bg-rose-500/20 text-rose-300 border-rose-500/30',
  OTHER:      'bg-zinc-500/20 text-zinc-300 border-zinc-500/30',
};

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

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

      {/* ── Desktop glass sidebar ──────────────────────────── */}
      {geoMode && (
        <>
          <aside
            className={`relative z-30 hidden md:flex flex-col h-full glass-panel transition-all duration-300 ease-in-out overflow-hidden ${sidebarOpen ? 'w-96' : 'w-0'}`}
          >
            {sidebarOpen && (
              <>
                {/* Sidebar header */}
                <div className="px-5 pt-5 pb-3 border-b border-white/5 flex items-end justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-accent tracking-tight">Explore</h2>
                    <p className="text-xs text-muted mt-0.5">{countLabel}</p>
                  </div>
                  {selectedCategory && (
                    <button
                      onClick={() => setSelectedCategory(null)}
                      className="text-xs text-accent hover:text-accent/70 transition-colors"
                    >
                      Clear filter
                    </button>
                  )}
                </div>

                {/* Venue card list */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3">
                  {markers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 gap-3 text-muted">
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" opacity=".4"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                      <p className="text-sm">No venues found.</p>
                    </div>
                  ) : (
                    markers.map((m) => <VenueCard key={m.id} marker={m} />)
                  )}
                </div>

                {/* Footer CTA */}
                {isLoggedIn && (
                  <div className="p-4 border-t border-white/5">
                    <Link
                      href="/invites/mine"
                      className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-accent/10 text-accent text-sm font-semibold hover:bg-accent/20 transition-colors border border-accent/20"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                      Invite a Friend
                    </Link>
                  </div>
                )}
              </>
            )}
          </aside>

          {/* Sidebar toggle tab (desktop) */}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="absolute left-0 top-1/2 -translate-y-1/2 z-40 hidden md:flex items-center justify-center w-5 h-12 bg-surface-raised text-accent rounded-r-lg border border-l-0 border-border/50 hover:bg-surface transition-all"
            style={{ left: sidebarOpen ? '384px' : '0' }}
            aria-label="Toggle sidebar"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {sidebarOpen
                ? <polyline points="15 18 9 12 15 6" />
                : <polyline points="9 18 15 12 9 6" />}
            </svg>
          </button>
        </>
      )}

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

/* ── Venue card (sidebar) ──────────────────────────────── */
function VenueCard({ marker: m }: { marker: VenueMapMarker }) {
  const hasReviews = !!(m.rating && m.rating.reviewCount > 0);
  const catClass = m.categoryName ? (CATEGORY_COLORS[m.categoryName] ?? CATEGORY_COLORS.OTHER) : null;

  return (
    <Link
      href={`/venues/${m.id}`}
      className="group block bg-surface-raised rounded-xl overflow-hidden border border-white/5 hover:border-accent/40 transition-all"
    >
      {/* Thumbnail */}
      <div className="relative h-36 overflow-hidden bg-surface">
        {m.coverPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={m.coverPhoto}
            alt={m.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-muted/40">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
          </div>
        )}

        {/* Category badge */}
        {catClass && m.categoryName && (
          <span className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wider border backdrop-blur-md ${catClass}`}>
            {m.categoryName.replace('_', ' ')}
          </span>
        )}

        {/* Rating badge */}
        {hasReviews && (
          <span className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-black/70 backdrop-blur-md text-[10px] font-bold text-white border border-white/10">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="#FBBF24" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            {m.rating!.overall.toFixed(1)}
          </span>
        )}

        {/* Live indicator for reviewed venues */}
        {hasReviews && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-accent live-pulse" />
            <span className="text-[9px] font-black uppercase tracking-widest text-accent/90">Reviewed</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3">
        <h3 className="font-semibold text-sm text-foreground group-hover:text-accent transition-colors truncate">{m.name}</h3>
        {hasReviews && (
          <p className="text-[11px] text-muted mt-0.5">
            {m.rating!.reviewCount} review{m.rating!.reviewCount !== 1 ? 's' : ''}
          </p>
        )}
      </div>
    </Link>
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
