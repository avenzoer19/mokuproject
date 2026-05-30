import { ImageResponse } from 'next/og';

// Dynamic favicon — rendered at build/request time, no static asset needed.
// Edge runtime avoids a @vercel/og font-loading bug on Windows paths with spaces.
export const runtime = 'edge';
export const size = { width: 32, height: 32 };
export const contentType = 'image/png';

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#0F1117',
          color: '#4ECDC4',
          fontSize: 22,
          fontWeight: 700,
          fontFamily: 'sans-serif',
          borderRadius: 7,
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
