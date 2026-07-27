'use client';

import { useEffect } from 'react';
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: new URL('leaflet/dist/images/marker-icon-2x.png', import.meta.url).href,
  iconUrl:       new URL('leaflet/dist/images/marker-icon.png',   import.meta.url).href,
  shadowUrl:     new URL('leaflet/dist/images/marker-shadow.png', import.meta.url).href,
});

const GEO_KEY = 'f3199d5697904c388c2af578a23e2844';
const BANGKOK_CENTER: [number, number] = [13.7563, 100.5018];

function ClickHandler({ onPin }: { onPin: (lat: number, lng: number, address: string) => void }) {
  useMapEvents({
    click: async (e) => {
      const { lat, lng } = e.latlng;
      try {
        const res = await fetch(
          `https://api.geoapify.com/v1/geocode/reverse?lat=${lat}&lon=${lng}&lang=en&apiKey=${GEO_KEY}`,
        );
        const data = (await res.json()) as { features?: { properties: { formatted?: string } }[] };
        onPin(lat, lng, data.features?.[0]?.properties?.formatted ?? '');
      } catch {
        onPin(lat, lng, '');
      }
    },
  });
  return null;
}

function CenterOnUser({ trigger }: { trigger: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    if (!trigger || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (p) => map.flyTo([p.coords.latitude, p.coords.longitude], 15, { duration: 1 }),
      () => {},
      { timeout: 8000, maximumAge: 60000 },
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
  return null;
}

export default function LocationPicker({
  pin,
  onPin,
  centerOnUserTrigger = 0,
}: {
  pin: [number, number] | null;
  onPin: (lat: number, lng: number, address: string) => void;
  centerOnUserTrigger?: number;
}) {
  return (
    <MapContainer
      center={BANGKOK_CENTER}
      zoom={12}
      scrollWheelZoom
      className="w-full rounded-xl border border-border"
      style={{ height: 280 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.geoapify.com/">Geoapify</a>'
        url={`https://maps.geoapify.com/v1/tile/dark-matter/{z}/{x}/{y}.png?apiKey=${GEO_KEY}`}
      />
      <ClickHandler onPin={onPin} />
      <CenterOnUser trigger={centerOnUserTrigger} />
      {pin && <Marker position={pin} />}
    </MapContainer>
  );
}
