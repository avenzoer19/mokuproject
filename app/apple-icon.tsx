import { ImageResponse } from 'next/og';

// iOS home-screen icon. Edge runtime avoids the @vercel/og font bug on Windows paths.
export const runtime = 'edge';
export const size = { width: 180, height: 180 };
export const contentType = 'image/png';

export default function AppleIcon() {
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
          fontSize: 112,
          fontWeight: 700,
          fontFamily: 'sans-serif',
        }}
      >
        M
      </div>
    ),
    { ...size },
  );
}
