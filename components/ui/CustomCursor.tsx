'use client';

import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const dotRef  = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const dot  = dotRef.current;
    const ring = ringRef.current;
    if (!dot || !ring) return;

    let mouseX = 0, mouseY = 0;
    let ringX  = 0, ringY  = 0;
    let rafId: number;

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = `${mouseX - 4}px`;
      dot.style.top  = `${mouseY - 4}px`;
    };

    const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

    const animate = () => {
      ringX = lerp(ringX, mouseX, 0.12);
      ringY = lerp(ringY, mouseY, 0.12);
      ring.style.left = `${ringX - 18}px`;
      ring.style.top  = `${ringY - 18}px`;
      rafId = requestAnimationFrame(animate);
    };

    const onEnterLink = () => {
      dot.style.transform  = 'scale(2)';
      ring.style.width  = '60px';
      ring.style.height = '60px';
    };

    const onLeaveLink = () => {
      dot.style.transform  = 'scale(1)';
      ring.style.width  = '36px';
      ring.style.height = '36px';
    };

    window.addEventListener('mousemove', onMove);
    document.querySelectorAll('a, button, [data-cursor="pointer"]')
      .forEach(el => {
        el.addEventListener('mouseenter', onEnterLink);
        el.addEventListener('mouseleave', onLeaveLink);
      });

    animate();

    return () => {
      window.removeEventListener('mousemove', onMove);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div ref={dotRef}  className="cursor-dot" />
      <div ref={ringRef} className="cursor-ring" />
    </>
  );
}
