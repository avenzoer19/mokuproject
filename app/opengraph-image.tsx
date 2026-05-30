import { ImageResponse } from 'next/og';

// Auto-injected into both OpenGraph and Twitter card metadata by Next.js.
export const runtime = 'edge';
export const alt = 'Moku for Research — Platform Riset All-in-One Berbasis AI';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: '#0F1117',
          backgroundImage:
            'radial-gradient(circle at 80% 15%, rgba(78,205,196,0.16) 0%, rgba(15,17,23,0) 45%)',
        }}
      >
        <div
          style={{
            display: 'flex',
            fontSize: 22,
            letterSpacing: '0.22em',
            textTransform: 'uppercase',
            color: '#4ECDC4',
            fontFamily: 'monospace',
          }}
        >
          Moku · Science for Everyone
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: '#E8E8E8',
            }}
          >
            Platform Riset All-in-One
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 88,
              fontWeight: 700,
              letterSpacing: '-0.03em',
              lineHeight: 1.05,
              color: '#4ECDC4',
            }}
          >
            Berbasis AI
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              fontSize: 30,
              fontWeight: 300,
              lineHeight: 1.4,
              color: '#8B8FA8',
              maxWidth: 900,
            }}
          >
            Literatur, screening, terjemahan, data lab, dan penulisan manuskrip —
            disatukan untuk akademisi Indonesia.
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            fontSize: 26,
            color: '#8B8FA8',
            fontFamily: 'monospace',
          }}
        >
          mokuresearch.com
        </div>
      </div>
    ),
    { ...size },
  );
}
