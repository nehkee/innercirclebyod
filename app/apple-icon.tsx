import { ImageResponse } from 'next/og';
import { loadBebasNeue } from '@/lib/og-font';

export const size        = { width: 180, height: 180 };
export const contentType = 'image/png';

export default async function AppleIcon() {
  const bebas = await loadBebasNeue();
  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#080808' }}>
        <div
          style={{
            width: 140, height: 140, border: '6px solid #C9A84C', display: 'flex',
            alignItems: 'center', justifyContent: 'center', color: '#C9A84C',
            fontFamily: 'Bebas Neue', fontSize: 92, paddingTop: 8,
          }}
        >
          IC
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Bebas Neue', data: bebas, style: 'normal', weight: 400 }] }
  );
}
