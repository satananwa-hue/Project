import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { NextRequest } from 'next/server';

// Load font once at module scope (Node.js runtime only)
let fontData: ArrayBuffer | null = null;
function getFont(): ArrayBuffer | null {
  if (fontData) return fontData;
  try {
    const buf = readFileSync(join(process.cwd(), 'src/app/api/og/arialbd.ttf'));
    fontData = buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength) as ArrayBuffer;
    return fontData;
  } catch {
    return null;
  }
}

// Card design: light background, circular avatar, dashed venue badge, stars
// Matches the IG/Facebook share card mockup (1080×1080 square, ideal for IG Stories)
const GOLD  = '#f59e0b';
const BG    = '#f2f0eb';
const CARD  = '#ffffff';
const TEXT  = '#1c1c1e';
const MUTED = '#6b7280';
const ACCENT = '#7c3aed';

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          style={{
            width: 36,
            height: 36,
            clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
            background: s <= filled ? GOLD : '#d1d5db',
          }}
        />
      ))}
    </div>
  );
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const venue    = searchParams.get('venue')    ?? 'Venue';
  const rating   = parseFloat(searchParams.get('rating') ?? '0');
  const category = (searchParams.get('category') ?? 'BAR').replace(/_/g, ' ');
  const text     = searchParams.get('text')   ?? '';
  const author   = searchParams.get('author') ?? '';
  const avatar   = searchParams.get('avatar') ?? '';  // URL or empty

  const excerpt = text.length > 120 ? text.slice(0, 117) + '...' : text;
  const font    = getFont();

  // Venue label truncated for the badge
  const badgeLabel = venue.length > 32 ? venue.slice(0, 29) + '...' : venue;

  return new ImageResponse(
    (
      <div
        style={{
          width: 1080,
          height: 1080,
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 60,
        }}
      >
        {/* Card */}
        <div
          style={{
            width: '100%',
            background: CARD,
            borderRadius: 32,
            padding: '56px 64px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            boxShadow: '0 8px 48px rgba(0,0,0,0.10)',
            position: 'relative',
          }}
        >
          {/* Top row: avatar + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, width: '100%' }}>
            {/* Circular avatar */}
            <div
              style={{
                width: 180,
                height: 180,
                borderRadius: '50%',
                overflow: 'hidden',
                background: '#e5e7eb',
                flexShrink: 0,
                border: '4px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} width={180} height={180} style={{ objectFit: 'cover' }} alt="" />
              ) : (
                // Default mascot placeholder — purple circle with initials
                <div
                  style={{
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: `${ACCENT}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 72,
                    fontWeight: 800,
                    color: ACCENT,
                  }}
                >
                  {(author || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Right column: dashed badge + label */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 1 }}>
              {/* Dashed oval venue badge */}
              <div
                style={{
                  border: '3px dashed #9ca3af',
                  borderRadius: 99,
                  padding: '16px 32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: 520,
                }}
              >
                <span
                  style={{
                    fontSize: badgeLabel.length > 20 ? 26 : 30,
                    fontWeight: 700,
                    color: TEXT,
                    textAlign: 'center',
                  }}
                >
                  {badgeLabel}
                </span>
              </div>

              {/* Stars */}
              <StarRow rating={rating} />

              {/* "User Review" label */}
              <span style={{ fontSize: 24, color: MUTED, fontWeight: 500 }}>
                {author ? `${author}'s Review` : 'User Review'}
              </span>
            </div>
          </div>

          {/* Review text */}
          {excerpt && (
            <div
              style={{
                marginTop: 48,
                width: '100%',
                borderTop: '1px solid #e5e7eb',
                paddingTop: 40,
                display: 'flex',
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  color: '#374151',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                }}
              >
                "{excerpt}"
              </span>
            </div>
          )}

          {/* Footer branding */}
          <div
            style={{
              marginTop: 48,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ fontSize: 18, color: MUTED }}>{category} · Bangkok</span>
            <span style={{ fontSize: 18, fontWeight: 800, color: ACCENT, letterSpacing: 2 }}>
              Chiwitrakmao
            </span>
          </div>
        </div>
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      ...(font
        ? {
            fonts: [{
              name: 'Arial',
              data: font,
              style: 'normal' as const,
              weight: 700,
            }],
          }
        : {}),
    },
  );
}
