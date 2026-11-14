import { ImageResponse } from 'next/og';
import { loadBebasNeue } from '@/lib/og-font';
import { getEvent } from '@/lib/data';
import { ringsFor, TYPE_ACCENT, TYPE_LABEL } from '@/lib/art';

export const alt         = 'Inner Circle event';
export const size        = { width: 1200, height: 630 };
export const contentType = 'image/png';

/** Share image for each event: its own generated ring composition + title, date and city. */
export default async function EventOgImage({ params }: { params: { id: string } }) {
  const [bebas, event] = await Promise.all([loadBebasNeue(), getEvent(params.id)]);
  const title  = event?.title ?? 'INNER CIRCLE';
  const type   = event?.type ?? 'listening_party';
  const accent = TYPE_ACCENT[type] ?? '#C9A84C';
  const rings  = ringsFor(title + type, 8);
  const date   = event ? new Date(event.date).toLocaleDateString('en-GB', { weekday: 'short', day: '2-digit', month: 'long' }).toUpperCase() : '';
  const city   = event?.location.split(',')[0].toUpperCase() ?? '';

  // Rings were designed on a 400x500 canvas; place them on the right of the 1200x630 image
  const scale = 1.2, ox = 640, oy = -30;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: '#080808', fontFamily: 'Bebas Neue' }}>
        <div style={{
          position: 'absolute', left: ox + rings[0].cx * scale - 380, top: oy + rings[0].cy * scale - 380, width: 760, height: 760, borderRadius: 380,
          background: `radial-gradient(circle, ${accent}40 0%, ${accent}0d 45%, rgba(8,8,8,0) 70%)`,
        }} />
        {rings.map((r, i) => (
          <div key={i} style={{
            position: 'absolute',
            left: ox + (r.cx - r.r) * scale, top: oy + (r.cy - r.r) * scale,
            width: r.r * 2 * scale, height: r.r * 2 * scale, borderRadius: 9999,
            border: `${r.width * 2}px ${r.dash ? 'dashed' : 'solid'} ${accent}`, opacity: r.opacity,
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, color: accent, fontSize: 30, letterSpacing: 10 }}>
            <div style={{ width: 56, height: 56, border: `3px solid #C9A84C`, color: '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, paddingTop: 4 }}>IC</div>
            {TYPE_LABEL[type] ?? 'INNER CIRCLE'}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', maxWidth: 760 }}>
            <div style={{ color: '#FFFFFF', fontSize: title.length > 24 ? 96 : 128, lineHeight: 0.9 }}>{title}</div>
            <div style={{ display: 'flex', gap: 32, marginTop: 28, color: '#9CA3AF', fontSize: 36, letterSpacing: 8 }}>
              <span>{date}</span>
              <span style={{ color: accent }}>{city}</span>
            </div>
          </div>
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: 'Bebas Neue', data: bebas, style: 'normal', weight: 400 }] }
  );
}
