import { ringsFor, hashString, TYPE_ACCENT, TYPE_LABEL } from '@/lib/art';

interface EventPosterProps {
  title:     string;
  type:      string;
  date:      string;
  location:  string;
  imageUrl?: string | null;
  /** Small thumbnail: rings and title only. */
  compact?:  boolean;
  /** Artwork only (no text, no border), for backgrounds. */
  bare?:     boolean;
  className?: string;
}

/**
 * Generated poster art for events (and drops). Every title gets its own ring
 * composition in the event-type colour, with film grain and scanlines, so the
 * site feels photographed even without photos. When an event has a real image
 * it's shown black-and-white with a gold wash, matching the brand guide.
 */
export function EventPoster({ title, type, date, location, imageUrl, compact = false, bare = false, className = '' }: EventPosterProps) {
  const accent = TYPE_ACCENT[type] ?? '#C9A84C';
  const rings  = ringsFor(title + type);
  const id     = `p${hashString(title + type + (compact ? 'c' : '')).toString(36)}`;
  const d      = new Date(date);
  const dateStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  const city   = location.split(',')[0].toUpperCase();

  return (
    <div className={`relative overflow-hidden bg-ic-black ${bare ? '' : 'aspect-[4/5] w-full border border-ic-border'} ${className}`}>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover grayscale contrast-125 brightness-75" />
          <div className="absolute inset-0 mix-blend-multiply" style={{ background: `linear-gradient(160deg, ${accent}55, #080808 85%)` }} />
        </>
      ) : (
        <svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
          <defs>
            <radialGradient id={`${id}-glow`} cx={rings[0].cx / 400} cy={rings[0].cy / 500} r="0.75">
              <stop offset="0%" stopColor={accent} stopOpacity="0.28" />
              <stop offset="55%" stopColor={accent} stopOpacity="0.05" />
              <stop offset="100%" stopColor="#080808" stopOpacity="0" />
            </radialGradient>
            <pattern id={`${id}-scan`} width="4" height="4" patternUnits="userSpaceOnUse">
              <rect width="4" height="1" fill="#ffffff" opacity="0.035" />
            </pattern>
            <filter id={`${id}-grain`}>
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
              <feColorMatrix type="saturate" values="0" />
              <feComponentTransfer><feFuncA type="table" tableValues="0 0.22" /></feComponentTransfer>
            </filter>
          </defs>
          <rect width="400" height="500" fill="#080808" />
          <rect width="400" height="500" fill={`url(#${id}-glow)`} />
          {rings.map((r, i) => (
            <circle key={i} cx={r.cx} cy={r.cy} r={r.r} fill="none" stroke={accent} strokeWidth={r.width}
              strokeDasharray={r.dash || undefined} opacity={r.opacity} transform={`rotate(${r.rotate} ${r.cx} ${r.cy})`} />
          ))}
          <circle cx={rings[0].cx} cy={rings[0].cy} r="4" fill={accent} />
          <rect width="400" height="500" fill={`url(#${id}-scan)`} />
          <rect width="400" height="500" filter={`url(#${id}-grain)`} />
        </svg>
      )}

      {/* Typography layer */}
      {bare ? null : compact ? (
        <p className="absolute left-2 right-2 bottom-2 font-bebas text-white leading-none text-sm line-clamp-2">{title}</p>
      ) : (
        <div className="absolute inset-0 p-5 flex flex-col justify-between">
          <div className="flex justify-between font-mono text-[10px] tracking-[0.3em]" style={{ color: accent }}>
            <span>{TYPE_LABEL[type] ?? 'INNER CIRCLE'}</span>
            <span>IC</span>
          </div>
          <div>
            <p className="font-bebas text-white leading-[0.9] mb-3" style={{ fontSize: 'clamp(28px, 4vw, 48px)' }}>{title}</p>
            <div className="flex justify-between font-mono text-[11px] tracking-[0.25em] text-ic-silver border-t pt-2" style={{ borderColor: `${accent}55` }}>
              <span>{dateStr}</span>
              <span>{city}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
