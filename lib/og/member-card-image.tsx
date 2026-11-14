import { ImageResponse } from 'next/og';
import { NextResponse } from 'next/server';
import { getCurrentMember } from '@/lib/auth';
import { getMemberCard, cardQrDataUrl } from '@/lib/member-card';
import { loadBebasNeue } from '@/lib/og-font';
import { ringsFor } from '@/lib/art';
import { TIERS } from '@/lib/constants';

/** The signed-in member's card as a PNG (wallet/wallpaper friendly). */
export async function memberCardResponse() {
  const member = await getCurrentMember();
  if (!member) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const card = await getMemberCard(member.id);
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const tier   = TIERS.find(t => t.id === card.tier);
  const accent = tier?.color ?? '#C9A84C';
  const dark   = tier?.id === 'sovereign';
  const [bebas, qr] = await Promise.all([loadBebasNeue(), cardQrDataUrl(card.verifyUrl)]);
  const rings  = ringsFor(card.number, 7);

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', position: 'relative', background: dark ? '#F5F5F5' : '#0B0B0B', fontFamily: 'Bebas Neue', overflow: 'hidden' }}>
        {rings.map((r, i) => (
          <div key={i} style={{
            position: 'absolute', left: 520 + (r.cx - r.r) * 1.3, top: -60 + (r.cy - r.r) * 1.3,
            width: r.r * 2.6, height: r.r * 2.6, borderRadius: 9999,
            border: `${r.width * 2}px ${r.dash ? 'dashed' : 'solid'} ${dark ? '#080808' : accent}`, opacity: r.opacity * 0.8,
          }} />
        ))}
        <div style={{ position: 'absolute', inset: 0, padding: 56, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 64, height: 64, border: `3px solid ${dark ? '#080808' : '#C9A84C'}`, color: dark ? '#080808' : '#C9A84C', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 38, paddingTop: 4 }}>IC</div>
              <div style={{ color: dark ? '#080808' : '#C9A84C', fontSize: 34, letterSpacing: 10 }}>INNER CIRCLE</div>
            </div>
            <div style={{ color: dark ? '#555' : '#8C8C8C', fontSize: 28, letterSpacing: 6 }}>{card.number}</div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <div style={{ color: dark ? '#080808' : accent, fontSize: 150, lineHeight: 0.85 }}>{tier?.name ?? 'MEMBER'}</div>
              <div style={{ color: dark ? '#080808' : '#FFFFFF', fontSize: 46, letterSpacing: 6, marginTop: 18 }}>{card.username}</div>
              <div style={{ color: dark ? '#555' : '#8C8C8C', fontSize: 26, letterSpacing: 8, marginTop: 6 }}>MEMBER SINCE {card.since}</div>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qr} width={190} height={190} style={{ border: `6px solid ${dark ? '#080808' : '#FFFFFF'}` }} alt="" />
          </div>
        </div>
      </div>
    ),
    {
      width: 1012, height: 638,
      fonts: [{ name: 'Bebas Neue', data: bebas, style: 'normal', weight: 400 }],
      headers: { 'Cache-Control': 'private, no-store', 'Content-Disposition': 'inline; filename="inner-circle-card.png"' },
    }
  );
}
