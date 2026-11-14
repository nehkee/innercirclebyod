'use client';

import { useEffect, useRef, useState } from 'react';

const INTERACTIVE = 'a, button, [data-cursor="pointer"]';

/**
 * Gold dot + trailing ring that replace the system cursor.
 * Only runs on devices with a mouse (fine pointer + hover); phones and
 * tablets keep their normal behaviour and never see a stray ring.
 */
export function CustomCursor() {
  const [enabled, setEnabled] = useState(false);
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setEnabled(mq.matches);
    update();
    mq.addEventListener('change', update);
    return () => mq.removeEventListener('change', update);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    const root = document.documentElement;
    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let rafId  = 0;
    let shown  = false;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX - 4}px`;
      dot.style.top  = `${mouseY - 4}px`;
      if (!shown) {
        // First move: jump the ring to the pointer and only then hide the system cursor
        shown = true;
        ringX = mouseX;
        ringY = mouseY;
        dot.style.opacity  = '1';
        ring.style.opacity = '1';
        root.classList.add('has-custom-cursor');
      }
    };

    const onLeaveWindow = () => {
      dot.style.opacity  = '0';
      ring.style.opacity = '0';
      shown = false;
      root.classList.remove('has-custom-cursor');
    };

    // Event delegation so links rendered after mount also get the hover effect
    const onOver = (e: MouseEvent) => {
      const hit = (e.target as Element | null)?.closest?.(INTERACTIVE);
      dot.style.transform = hit ? 'scale(2)' : 'scale(1)';
      ring.style.width    = hit ? '60px' : '36px';
      ring.style.height   = hit ? '60px' : '36px';
      ring.style.marginLeft = hit ? '-12px' : '0';
      ring.style.marginTop  = hit ? '-12px' : '0';
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.12);
      ringY = lerp(ringY, mouseY, 0.12);
      ring.style.left = `${ringX - 18}px`;
      ring.style.top  = `${ringY - 18}px`;
      rafId = requestAnimationFrame(animate);
    };

    window.addEventListener('mousemove', onMove, { passive: true });
    document.addEventListener('mouseover', onOver, { passive: true });
    document.documentElement.addEventListener('mouseleave', onLeaveWindow);
    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseover', onOver);
      document.documentElement.removeEventListener('mouseleave', onLeaveWindow);
      cancelAnimationFrame(rafId);
      root.classList.remove('has-custom-cursor');
    };
  }, [enabled]);

  if (!enabled) return null;

  return (
    <>
      <div ref={dotRef}  className="cursor-dot"  aria-hidden="true" />
      <div ref={ringRef} className="cursor-ring" aria-hidden="true" />
    </>
  );
}
