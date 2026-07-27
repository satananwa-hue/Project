'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const CATEGORIES = [
  { value: 'BAR', label: 'Bar' },
  { value: 'CLUB', label: 'Club' },
  { value: 'ROOFTOP', label: 'Rooftop' },
  { value: 'LIVE_MUSIC', label: 'Live Music' },
  { value: 'LOUNGE', label: 'Lounge' },
  { value: 'OTHER', label: 'Other' },
];

const PRICE_RANGES = [
  { value: 'BUDGET', label: '฿ Budget' },
  { value: 'MODERATE', label: '฿฿ Moderate' },
  { value: 'UPSCALE', label: '฿฿฿ Upscale' },
  { value: 'LUXURY', label: '฿฿฿฿ Luxury' },
];

const GEO_KEY = 'f3199d5697904c388c2af578a23e2844';

type GeoStatus = 'idle' | 'loading' | 'found' | 'error';

export function AddVenueClient() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [address, setAddress] = useState('');
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [geoStatus, setGeoStatus] = useState<GeoStatus>('idle');
  const [resolvedAddress, setResolvedAddress] = useState('');
  const [coverCharge, setCoverCharge] = useState('');
  const [priceRange, setPriceRange] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  async function geocode() {
    if (!address.trim()) return;
    setGeoStatus('loading');
    try {
      const url = `https://api.geoapify.com/v1/geocode/search?text=${encodeURIComponent(address)}&lang=en&limit=1&filter=countrycode:th&apiKey=${GEO_KEY}`;
      const res = await fetch(url);
      const data = (await res.json()) as { features?: { geometry: { coordinates: [number, number] }; properties: { formatted?: string } }[] };
      const feature = data.features?.[0];
      if (!feature) { setGeoStatus('error'); return; }
      const [lngVal, latVal] = feature.geometry.coordinates;
      setLat(latVal);
      setLng(lngVal);
      setResolvedAddress(feature.properties.formatted ?? address);
      setGeoStatus('found');
    } catch {
      setGeoStatus('error');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !address.trim() || lat === null || lng === null) {
      setError('Please fill in the name, address, and tap "Find" to set the map pin before submitting.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name: name.trim(),
        category,
        address: resolvedAddress || address.trim(),
        lat,
        lng,
        isPublished: false,
      };
      if (coverCharge) body.coverCharge = parseInt(coverCharge, 10);
      if (priceRange) body.priceRange = priceRange;

      const res = await fetch('/api/venues', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw new Error(Array.isArray(err.message) ? (err.message as string[]).join(', ') : (err.message ?? 'Failed to submit venue'));
      }
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="flex flex-col items-center gap-4 py-12 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/20 text-3xl">✓</div>
        <h2 className="text-xl font-semibold">Venue submitted!</h2>
        <p className="max-w-xs text-sm text-muted">
          Your suggestion will be reviewed by our team before appearing on the map. Thank you!
        </p>
        <button
          onClick={() => router.push('/')}
          className="mt-4 rounded-xl bg-accent px-8 py-3 text-sm font-bold text-white hover:bg-accent/90 transition-colors"
        >
          Back to map
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Venue Name *</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Sky Bar Bangkok"
          required
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
      </div>

      {/* Category */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Category</label>
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        >
          {CATEGORIES.map(c => (
            <option key={c.value} value={c.value}>{c.label}</option>
          ))}
        </select>
      </div>

      {/* Address + geocode */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Address *</label>
        <div className="flex gap-2">
          <input
            value={address}
            onChange={e => {
              setAddress(e.target.value);
              setGeoStatus('idle');
              setLat(null);
              setLng(null);
              setResolvedAddress('');
            }}
            placeholder="e.g. Lebua at State Tower, Silom Rd"
            required
            className="min-w-0 flex-1 rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
          />
          <button
            type="button"
            onClick={geocode}
            disabled={!address.trim() || geoStatus === 'loading'}
            className="flex-shrink-0 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm font-semibold text-accent hover:bg-accent/20 transition-colors disabled:opacity-40"
          >
            {geoStatus === 'loading' ? '…' : 'Find'}
          </button>
        </div>
        {geoStatus === 'found' && (
          <p className="mt-2 text-xs text-green-400">
            ✓ {resolvedAddress} ({lat?.toFixed(5)}, {lng?.toFixed(5)})
          </p>
        )}
        {geoStatus === 'error' && (
          <p className="mt-2 text-xs text-red-400">
            Could not find that address — try being more specific (e.g. add the street or district).
          </p>
        )}
        {geoStatus === 'idle' && (
          <p className="mt-2 text-xs text-muted">Enter the address then tap &quot;Find&quot; to pin it on the map.</p>
        )}
      </div>

      {/* Optional fields */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Cover Charge (฿)</label>
          <input
            type="number"
            min="0"
            value={coverCharge}
            onChange={e => setCoverCharge(e.target.value)}
            placeholder="e.g. 500"
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">Price Range</label>
          <select
            value={priceRange}
            onChange={e => setPriceRange(e.target.value)}
            className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
          >
            <option value="">— optional —</option>
            {PRICE_RANGES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={submitting || lat === null}
        className="w-full rounded-xl bg-accent py-4 text-sm font-bold text-white hover:bg-accent/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {submitting ? 'Submitting…' : 'Submit Venue'}
      </button>

      <p className="text-center text-xs text-muted">
        Venues are reviewed before going live on the map.
      </p>
    </form>
  );
}
