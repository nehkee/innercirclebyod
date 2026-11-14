import { ImageResponse } from 'next/og';
import { loadBebasNeue } from '@/lib/og-font';

export const alt         = 'Inner Circle by OD — an elite digital society built around Odumodublvck';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

const GOLD = '#C9A84C';

export default async function OpengraphImage() {
  const bebas = await loadBebasNeue();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', position: 'relative',
          background: '#080808',
          backgroundImage:
            'linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '60px 60px',
          fontFamily: 'Bebas Neue',
        }}
      >
        {/* Warm glow behind the wordmark */}
        <div
          style={{
            position: 'absolute', width: 900, height: 500, borderRadius: 450,
            background: 'radial-gradient(ellipse at center, rgba(201,168,76,0.16) 0%, rgba(8,8,8,0) 70%)',
          }}
        />

        {/* OD mark */}
        <div
          style={{
            position: 'absolute', top: 48, left: 56, width: 64, height: 64,
            border: `3px solid ${GOLD}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: GOLD, fontSize: 40, paddingTop: 4,
          }}
        >
          OD
        </div>
        <div style={{ position: 'absolute', top: 66, right: 56, color: '#666666', fontSize: 26, letterSpacing: 8 }}>
          INNERCIRCLEBYOD.COM
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: GOLD, fontSize: 28, letterSpacing: 12 }}>
          <div style={{ width: 60, height: 2, background: 'rgba(201,168,76,0.5)' }} />
          AN ELITE DIGITAL SOCIETY
          <div style={{ width: 60, height: 2, background: 'rgba(201,168,76,0.5)' }} />
        </div>

        <div style={{ display: 'flex', fontSize: 210, lineHeight: 0.9, marginTop: 18, color: '#FFFFFF' }}>
          <span>INNER</span>
          <span style={{ color: GOLD, marginLeft: 36 }}>CIRCLE</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginTop: 26, color: '#9CA3AF', fontSize: 40, letterSpacing: 14 }}>
          <div style={{ width: 80, height: 1, background: '#2A2A2A' }} />
          BY ODUMODUBLVCK
          <div style={{ width: 80, height: 1, background: '#2A2A2A' }} />
        </div>

        {/* Tier strip */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 8, display: 'flex' }}>
          <div style={{ flex: 1, background: '#9CA3AF' }} />
          <div style={{ flex: 1, background: GOLD }} />
          <div style={{ flex: 1, background: '#CC0000' }} />
          <div style={{ flex: 1, background: '#FFFFFF' }} />
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Bebas Neue', data: bebas, style: 'normal', weight: 400 }] }
  );
}
