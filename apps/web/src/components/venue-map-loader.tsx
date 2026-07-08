'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window` at import time, which crashes during SSR/static
// generation - ssr:false must be set from within a Client Component (Next.js
// errors if a Server Component tries to pass ssr:false to next/dynamic).
export const VenueMap = dynamic(
  () => import('./venue-map').then((mod) => mod.VenueMap),
  {
    ssr: false,
    loading: () => <div className="h-full w-full animate-pulse bg-surface-raised" />,
  },
);
