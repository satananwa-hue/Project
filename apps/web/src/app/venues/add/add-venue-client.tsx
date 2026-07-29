'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';

const LocationPicker = dynamic(() => import('./location-picker'), {
  ssr: false,
  loading: () => (
    <div className="h-[280px] w-full rounded-xl border border-border bg-surface-raised animate-pulse" />
  ),
});

const CATEGORIES = [
  { value: 'BAR',        label: 'Bar' },
  { value: 'CLUB',       label: 'Club' },
  { value: 'ROOFTOP',    label: 'Rooftop' },
  { value: 'LIVE_MUSIC', label: 'Live Music' },
  { value: 'LOUNGE',     label: 'Lounge' },
  { value: 'OTHER',      label: 'Other' },
];

const PRICE_RANGES = [
  { value: 'BUDGET',   label: '฿ Budget' },
  { value: 'MODERATE', label: '฿฿ Moderate' },
  { value: 'UPSCALE',  label: '฿฿฿ Upscale' },
  { value: 'LUXURY',   label: '฿฿฿฿ Luxury' },
];

export function AddVenueClient() {
  const router = useRouter();
  const [name, setName]               = useState('');
  const [category, setCategory]       = useState('OTHER');
  const [pin, setPin]                 = useState<[number, number] | null>(null);
  const [address, setAddress]         = useState('');
  const [coverCharge, setCoverCharge] = useState('');
  const [priceRange, setPriceRange]   = useState('');
  const [centerTrigger, setCenterTrigger] = useState(0);
  const [submitting, setSubmitting]   = useState(false);
  const [error, setError]             = useState('');
  const [success, setSuccess]         = useState(false);

  function handlePin(lat: number, lng: number, reverseAddress: string) {
    setPin([lat, lng]);
    if (reverseAddress) setAddress(reverseAddress);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError('Please enter a venue name.'); return; }
    if (!pin)         { setError('Tap the map to place the venue pin first.'); return; }
    if (!address.trim()) { setError('Please confirm or type the address.'); return; }

    setSubmitting(true);
    setError('');
    try {
      const body: Record<string, unknown> = {
        name:        name.trim(),
        category,
        address:     address.trim(),
        lat:         pin[0],
        lng:         pin[1],
        isPublished: true,
      };
      if (coverCharge) body.coverCharge = parseInt(coverCharge, 10);
      if (priceRange)  body.priceRange  = priceRange;

      const res = await fetch('/api/venues', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });

      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string | string[] };
        const msg = Array.isArray(err.message) ? err.message.join(', ') : (err.message ?? 'Failed to submit');
        throw new Error(msg);
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
        <h2 className="text-xl font-semibold">Venue added!</h2>
        <p className="max-w-xs text-sm text-muted">
          It&apos;s now live on the map. Thank you for contributing!
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

      {/* Map pin picker */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-sm font-medium">
            Pin Location *{' '}
            {pin
              ? <span className="font-normal text-green-400 text-xs">✓ Pinned ({pin[0].toFixed(5)}, {pin[1].toFixed(5)})</span>
              : <span className="font-normal text-muted text-xs">Tap the map to place a pin</span>}
          </label>
          <button
            type="button"
            onClick={() => setCenterTrigger(t => t + 1)}
            className="text-xs text-accent hover:text-accent/70 transition-colors"
          >
            Use my location
          </button>
        </div>
        <LocationPicker pin={pin} onPin={handlePin} centerOnUserTrigger={centerTrigger} />
      </div>

      {/* Address (auto-filled by reverse-geocode, editable) */}
      <div>
        <label className="mb-1.5 block text-sm font-medium">Address *</label>
        <input
          value={address}
          onChange={e => setAddress(e.target.value)}
          placeholder="Auto-filled when you pin the map"
          className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-sm outline-none focus:border-accent transition-colors"
        />
        <p className="mt-1.5 text-xs text-muted">Auto-filled from your pin — edit if needed.</p>
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
        disabled={submitting || !pin}
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
