/**
 * Atmospheric backdrop: concentric rings slowly orbiting, the brand's circle
 * motif. Decorative only; stays still for people who prefer reduced motion.
 */
export function CircleField({ className = '', color = '#C9A84C', intensity = 1 }: { className?: string; color?: string; intensity?: number }) {
  const rings = [
    { r: 90,  dash: '',      w: 1,   o: 0.35, speed: 0 },
    { r: 150, dash: '2 10',  w: 1,   o: 0.30, speed: 140 },
    { r: 215, dash: '',      w: 0.6, o: 0.20, speed: 0 },
    { r: 285, dash: '24 14', w: 1,   o: 0.18, speed: -180 },
    { r: 360, dash: '1 6',   w: 1.4, o: 0.16, speed: 220 },
    { r: 440, dash: '',      w: 0.5, o: 0.10, speed: 0 },
  ];
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden="true">
      <svg viewBox="-460 -460 920 920" className="w-full h-full">
        <defs>
          <radialGradient id="cf-glow">
            <stop offset="0%" stopColor={color} stopOpacity={0.12 * intensity} />
            <stop offset="60%" stopColor={color} stopOpacity={0.02 * intensity} />
            <stop offset="100%" stopColor={color} stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle r="450" fill="url(#cf-glow)" />
        {rings.map(ring => (
          <g key={ring.r} className={ring.speed ? 'motion-safe:animate-[spin_var(--d)_linear_infinite]' : ''}
             style={{ ['--d' as string]: `${Math.abs(ring.speed)}s`, animationDirection: ring.speed < 0 ? 'reverse' : 'normal', transformOrigin: '0 0' }}>
            <circle r={ring.r} fill="none" stroke={color} strokeWidth={ring.w} strokeDasharray={ring.dash || undefined} opacity={ring.o * intensity} />
          </g>
        ))}
        <circle r="3" fill={color} opacity={0.8 * intensity} />
      </svg>
    </div>
  );
}
