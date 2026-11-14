'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Menu, X } from 'lucide-react';
import { NavAuth } from '@/components/auth/NavAuth';

const NAV_LINKS = [
  { href: '/membership', label: 'MEMBERSHIP' },
  { href: '/events',     label: 'EVENTS'     },
  { href: '/access',     label: 'ACCESS'     },
  { href: '/community',  label: 'COMMUNITY'  },
  { href: '/drops',      label: 'DROPS'      },
];

export function Nav() {
  const [scrolled,    setScrolled]    = useState(false);
  const [menuOpen,    setMenuOpen]    = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  return (
    <>
      <header
        className={cn(
          'fixed top-0 left-0 right-0 z-50 transition-all duration-500',
          scrolled
            ? 'bg-od-black/90 backdrop-blur-md border-b border-od-border'
            : 'bg-transparent'
        )}
      >
        <nav className="max-w-7xl mx-auto px-6 flex items-center justify-between h-16 md:h-20">
          {/* Logo */}
          <Link href="/" className="group flex items-center gap-3">
            <div className="w-8 h-8 border border-od-gold flex items-center justify-center group-hover:bg-od-gold transition-colors duration-300">
              <span className="font-bebas text-od-gold group-hover:text-black text-lg leading-none transition-colors duration-300">OD</span>
            </div>
            <div className="hidden sm:block">
              <p className="font-bebas text-xs tracking-[0.3em] text-od-gold leading-none">INNER CIRCLE</p>
              <p className="font-mono text-[9px] tracking-[0.2em] text-od-muted leading-none mt-0.5">BY ODUMODUBLVCK</p>
            </div>
          </Link>

          {/* Desktop Links */}
          <ul className="hidden md:flex items-center gap-8">
            {NAV_LINKS.map(link => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={cn(
                    'font-bebas text-sm tracking-widest transition-colors duration-200',
                    pathname === link.href
                      ? 'text-od-gold'
                      : 'text-od-muted hover:text-white'
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Right */}
          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4">
              <NavAuth />
              <Link href="/join" className="btn-primary py-2 px-6 text-sm">
                JOIN
              </Link>
            </div>

            {/* Hamburger */}
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="md:hidden text-white p-1"
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <div
        className={cn(
          'fixed inset-0 z-40 bg-od-black flex flex-col transition-all duration-500 md:hidden',
          menuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        )}
      >
        <div className="flex-1 flex flex-col justify-center items-center gap-8 pt-20">
          {NAV_LINKS.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'font-bebas text-5xl tracking-widest transition-colors duration-200',
                pathname === link.href ? 'gold-text' : 'text-white hover:text-od-gold'
              )}
              style={{ animationDelay: `${i * 0.1}s` }}
            >
              {link.label}
            </Link>
          ))}
          <Link href="/join" className="btn-primary mt-4">
            JOIN THE INNER CIRCLE
          </Link>
          <NavAuth mobile />
        </div>

        <div className="p-8 text-center">
          <p className="font-mono text-[10px] tracking-widest text-od-muted">
            INNERCIRCLEBYOD.COM
          </p>
        </div>
      </div>
    </>
  );
}
