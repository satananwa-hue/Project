import { ImageResponse } from 'next/og';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { NextRequest } from 'next/server';

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

const GOLD   = '#f59e0b';
const ACCENT = '#a78bfa'; // lighter purple — visible on dark video backgrounds
const SHADOW = 'drop-shadow(0 2px 8px rgba(0,0,0,0.8))';

function StarRow({ rating }: { rating: number }) {
  const filled = Math.round(rating);
  return (
    <div style={{ display: 'flex', gap: 10 }}>
      {[1, 2, 3, 4, 5].map((s) => (
        <div
          key={s}
          style={{
            width: 40,
            height: 40,
            clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
            background: s <= filled ? GOLD : 'rgba(255,255,255,0.25)',
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
  const avatar   = searchParams.get('avatar') ?? '';

  const excerpt    = text.length > 120 ? text.slice(0, 117) + '...' : text;
  const badgeLabel = venue.length > 32 ? venue.slice(0, 29) + '...' : venue;
  const font       = getFont();

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
          padding: 80,
        }}
      >
        <div
          style={{
            width: '100%',
            background: 'transparent',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            gap: 0,
          }}
        >
          {/* Top row: avatar + badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 48, width: '100%' }}>

            {/* Circular avatar with white ring */}
            <div
              style={{
                width: 200,
                height: 200,
                borderRadius: '50%',
                overflow: 'hidden',
                flexShrink: 0,
                border: '5px solid rgba(255,255,255,0.9)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.15)',
              }}
            >
              {avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatar} width={200} height={200} style={{ objectFit: 'cover' }} alt="" />
              ) : (
                <div
                  style={{
                    width: 200,
                    height: 200,
                    borderRadius: '50%',
                    background: 'rgba(167,139,250,0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 80,
                    fontWeight: 800,
                    color: '#ffffff',
                  }}
                >
                  {(author || 'U')[0].toUpperCase()}
                </div>
              )}
            </div>

            {/* Right column */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22, flex: 1 }}>

              {/* Dashed oval venue badge — white on transparent */}
              <div
                style={{
                  border: '3px dashed rgba(255,255,255,0.85)',
                  borderRadius: 99,
                  padding: '16px 36px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  maxWidth: 540,
                  background: 'rgba(0,0,0,0.25)',
                }}
              >
                <span
                  style={{
                    fontSize: badgeLabel.length > 20 ? 28 : 32,
                    fontWeight: 700,
                    color: '#ffffff',
                    textAlign: 'center',
                    filter: SHADOW,
                  }}
                >
                  {badgeLabel}
                </span>
              </div>

              {/* Stars */}
              <StarRow rating={rating} />

              {/* Review label */}
              <span
                style={{
                  fontSize: 26,
                  color: 'rgba(255,255,255,0.85)',
                  fontWeight: 600,
                  filter: SHADOW,
                }}
              >
                {author ? `${author}'s Review` : 'User Review'}
              </span>
            </div>
          </div>

          {/* Review text */}
          {excerpt && (
            <div
              style={{
                marginTop: 52,
                width: '100%',
                borderTop: '1px solid rgba(255,255,255,0.3)',
                paddingTop: 40,
                display: 'flex',
              }}
            >
              <span
                style={{
                  fontSize: 30,
                  color: 'rgba(255,255,255,0.92)',
                  lineHeight: 1.6,
                  fontStyle: 'italic',
                  filter: SHADOW,
                }}
              >
                "{excerpt}"
              </span>
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: 52,
              width: '100%',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span
              style={{
                fontSize: 20,
                color: 'rgba(255,255,255,0.65)',
                filter: SHADOW,
              }}
            >
              {category} · Bangkok
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: 800,
                color: ACCENT,
                letterSpacing: 2,
                filter: SHADOW,
              }}
            >
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
