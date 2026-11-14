'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import jsQR from 'jsqr';
import { Camera, CameraOff, CheckCircle2, XCircle, ArrowLeft } from 'lucide-react';

interface EventOption { id: string; title: string; date: string }
type Result =
  | { valid: true; member: { username: string; tier: string }; event?: { title?: string } }
  | { valid: false; reason: string; usedAt?: string };

/** The token inside a scanned QR (URL form "…/tickets/scan?t=…" or a bare token). */
function tokenFromScan(scanned: string): string {
  const text = scanned.trim();
  try {
    const t = new URL(text).searchParams.get('t');
    if (t) return t;
  } catch { /* bare token */ }
  return text;
}

/** Door scanner: point a phone at ticket QR codes. Green = let them in. */
export function DoorScanner() {
  const [events, setEvents]   = useState<EventOption[]>([]);
  const [eventId, setEventId] = useState('');
  const [camera, setCamera]   = useState(false);
  const [result, setResult]   = useState<Result | null>(null);
  const [manual, setManual]   = useState('');
  const [count, setCount]     = useState(0);
  const [camError, setCamError] = useState<string | null>(null);

  const videoRef  = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const lastScan  = useRef<{ token: string; at: number }>({ token: '', at: 0 });
  const busy      = useRef(false);

  useEffect(() => {
    fetch('/api/events').then(r => r.json()).then(d => {
      const today = Date.now() - 12 * 3600_000;
      const upcoming = (d.events ?? []).filter((e: EventOption) => new Date(e.date).getTime() > today);
      setEvents(upcoming);
      if (upcoming[0]) setEventId(upcoming[0].id);
    }).catch(() => {});
  }, []);

  const verify = useCallback(async (scanned: string) => {
    const token = tokenFromScan(scanned);
    const now = Date.now();
    // Ignore the same code held in front of the camera
    if (busy.current || (token === lastScan.current.token && now - lastScan.current.at < 4000)) return;
    lastScan.current = { token, at: now };
    busy.current = true;
    try {
      const res = await fetch('/api/tickets/verify', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, eventId }),
      });
      const data = await res.json().catch(() => ({ valid: false, reason: 'Scanner error' }));
      setResult(data);
      if (data.valid) setCount(c => c + 1);
      navigator.vibrate?.(data.valid ? 80 : [60, 60, 60]);
    } catch {
      setResult({ valid: false, reason: 'Network error — check your connection' });
    } finally {
      busy.current = false;
    }
  }, [eventId]);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCamera(false);
  }, []);

  async function startCamera() {
    setCamError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' }, audio: false });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCamera(true);
    } catch {
      setCamError('Camera unavailable. Allow camera access, or type the code below.');
    }
  }

  // Read frames while the camera is on
  useEffect(() => {
    if (!camera) return;
    let raf = 0;
    const tick = () => {
      const video = videoRef.current, canvas = canvasRef.current;
      if (video && canvas && video.readyState === video.HAVE_ENOUGH_DATA) {
        const w = video.videoWidth, h = video.videoHeight;
        canvas.width = w; canvas.height = h;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, w, h);
          const code = jsQR(ctx.getImageData(0, 0, w, h).data, w, h, { inversionAttempts: 'attemptBoth' });
          if (code?.data) verify(code.data);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [camera, verify]);

  useEffect(() => stopCamera, [stopCamera]);

  return (
    <div className="min-h-screen bg-ic-black px-4 py-6 max-w-lg mx-auto">
      <div className="flex items-center justify-between mb-6">
        <Link href="/admin" className="flex items-center gap-2 font-mono text-[11px] tracking-widest text-ic-muted hover:text-white">
          <ArrowLeft size={14} /> ADMIN
        </Link>
        <p className="font-mono text-[11px] tracking-widest text-ic-gold">{count} ADMITTED</p>
      </div>

      <h1 className="font-bebas text-5xl text-white leading-none mb-4">DOOR</h1>

      <label className="section-label block mb-2" htmlFor="event">EVENT</label>
      <select
        id="event"
        value={eventId}
        onChange={e => { setEventId(e.target.value); setResult(null); }}
        className="w-full bg-ic-dark border border-ic-border text-white px-3 py-3 mb-4 focus:outline-none focus:border-ic-gold"
      >
        {events.length === 0 && <option value="">No upcoming events</option>}
        {events.map(e => <option key={e.id} value={e.id}>{e.title} — {new Date(e.date).toLocaleDateString('en-GB')}</option>)}
      </select>

      <div className="relative aspect-square bg-ic-dark border border-ic-border mb-4 overflow-hidden">
        <video ref={videoRef} className={`w-full h-full object-cover ${camera ? '' : 'hidden'}`} playsInline muted />
        <canvas ref={canvasRef} className="hidden" />
        {!camera && (
          <button onClick={startCamera} disabled={!eventId}
            className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-ic-gold disabled:opacity-40">
            <Camera size={40} />
            <span className="font-bebas tracking-widest text-2xl">START SCANNING</span>
          </button>
        )}
        {camera && <div className="absolute inset-10 border-2 border-ic-gold/70 pointer-events-none" />}
      </div>
      {camera && (
        <button onClick={stopCamera} className="w-full flex items-center justify-center gap-2 border border-ic-border text-ic-muted py-2 mb-4 font-mono text-[11px] tracking-widest">
          <CameraOff size={14} /> STOP CAMERA
        </button>
      )}
      {camError && <p className="font-mono text-[11px] text-ic-red mb-4">{camError}</p>}

      {result && (
        <div className={`p-6 mb-4 text-center border-2 ${result.valid ? 'border-green-500 bg-green-500/10' : 'border-ic-red bg-ic-red/10'}`} role="status">
          {result.valid ? (
            <>
              <CheckCircle2 size={48} className="mx-auto text-green-400 mb-2" />
              <p className="font-bebas text-4xl text-green-400">LET THEM IN</p>
              <p className="font-mono text-sm text-white mt-1">{result.member.username}</p>
              <p className="font-mono text-[11px] tracking-widest text-ic-gold">{result.member.tier.toUpperCase()}</p>
            </>
          ) : (
            <>
              <XCircle size={48} className="mx-auto text-ic-red mb-2" />
              <p className="font-bebas text-4xl text-ic-red">STOP</p>
              <p className="text-white text-sm mt-1">{result.reason}</p>
              {result.usedAt && <p className="font-mono text-[11px] text-ic-muted mt-1">SCANNED AT {new Date(result.usedAt).toLocaleTimeString()}</p>}
            </>
          )}
        </div>
      )}

      <form onSubmit={e => { e.preventDefault(); if (manual.trim()) { verify(manual); setManual(''); } }} className="flex gap-2">
        <input value={manual} onChange={e => setManual(e.target.value)} placeholder="Or paste a ticket code"
          className="flex-1 bg-ic-dark border border-ic-border text-white text-sm px-3 py-2 focus:outline-none focus:border-ic-gold" />
        <button disabled={!eventId} className="border border-ic-gold text-ic-gold px-4 font-mono text-[11px] tracking-widest disabled:opacity-40">CHECK</button>
      </form>
    </div>
  );
}
