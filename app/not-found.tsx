import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="bg-ic-black min-h-screen flex flex-col items-center justify-center px-6 text-center">
      {/* Grid background */}
      <div
        className="fixed inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      <div className="relative z-10">
        <p className="font-mono text-[10px] tracking-[0.4em] text-ic-gold mb-6">
          ERROR 404
        </p>

        <h1
          className="font-bebas text-white leading-none mb-4 glitch"
          data-text="NOT FOUND"
          style={{ fontSize: 'clamp(80px, 20vw, 240px)' }}
        >
          NOT FOUND
        </h1>

        <p className="font-mono text-[10px] tracking-widest text-ic-muted mb-12">
          THIS ROOM DOESN&apos;T EXIST — OR YOU&apos;RE NOT ON THE LIST
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/" className="btn-primary px-12 py-4 text-base">
            RETURN HOME ◯
          </Link>
          <Link href="/membership" className="btn-secondary px-12 py-4 text-base">
            JOIN THE CIRCLE
          </Link>
        </div>
      </div>
    </main>
  );
}
