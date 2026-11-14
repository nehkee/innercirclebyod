'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface ParticleBackgroundProps {
  count?:    number;
  color?:    number;
  size?:     number;
  opacity?:  number;
  speed?:    number;
  className?: string;
}

export function ParticleBackground({
  count   = 900,
  color   = 0xC9A84C,   // ic-gold
  size    = 0.018,
  opacity = 0.45,
  speed   = 1,
  className = '',
}: ParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || typeof window === 'undefined') return;

    // ── Renderer ─────────────────────────────────────────────────────────────
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setSize(canvas.offsetWidth, canvas.offsetHeight);
    renderer.setClearColor(0x000000, 0);

    // ── Scene / Camera ────────────────────────────────────────────────────────
    const scene  = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, canvas.offsetWidth / canvas.offsetHeight, 0.1, 100);
    camera.position.z = 4.5;

    // ── Particles ─────────────────────────────────────────────────────────────
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3); // for individual drift

    for (let i = 0; i < count; i++) {
      const i3 = i * 3;
      positions[i3]     = (Math.random() - 0.5) * 12;
      positions[i3 + 1] = (Math.random() - 0.5) * 12;
      positions[i3 + 2] = (Math.random() - 0.5) * 8;
      // very slow random drift per particle
      velocities[i3]     = (Math.random() - 0.5) * 0.0006 * speed;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.0006 * speed;
      velocities[i3 + 2] = 0;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color,
      size,
      transparent: true,
      opacity,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    // ── Mouse parallax ────────────────────────────────────────────────────────
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;

    const onMouseMove = (e: MouseEvent) => {
      mouseX = (e.clientX / window.innerWidth  - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener('mousemove', onMouseMove, { passive: true });

    // ── Resize ────────────────────────────────────────────────────────────────
    const onResize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      renderer.setSize(w, h);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(onResize);
    ro.observe(canvas);

    // ── Animate ───────────────────────────────────────────────────────────────
    let rafId: number;
    const posAttr = geometry.attributes.position as THREE.BufferAttribute;

    const animate = () => {
      rafId = requestAnimationFrame(animate);

      // Smooth camera parallax
      targetX += (mouseX - targetX) * 0.04;
      targetY += (mouseY - targetY) * 0.04;
      camera.position.x = targetX * 1.2;
      camera.position.y = -targetY * 1.2;

      // Slow global rotation
      points.rotation.y += 0.00025 * speed;
      points.rotation.x += 0.00010 * speed;

      // Per-particle drift (wrap around bounds)
      const pos = posAttr.array as Float32Array;
      for (let i = 0; i < count; i++) {
        const i3 = i * 3;
        pos[i3]     += velocities[i3];
        pos[i3 + 1] += velocities[i3 + 1];
        // wrap
        if (pos[i3]     >  6) pos[i3]     = -6;
        if (pos[i3]     < -6) pos[i3]     =  6;
        if (pos[i3 + 1] >  6) pos[i3 + 1] = -6;
        if (pos[i3 + 1] < -6) pos[i3 + 1] =  6;
      }
      posAttr.needsUpdate = true;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      ro.disconnect();
      geometry.dispose();
      material.dispose();
      renderer.dispose();
    };
  }, [count, color, size, opacity, speed]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  );
}
