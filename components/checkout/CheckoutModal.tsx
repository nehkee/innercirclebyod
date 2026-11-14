'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';
import { CheckoutOptions, type CheckoutProduct } from '@/components/checkout/CheckoutOptions';
import type { PaymentMethods } from '@/lib/payments/config';

interface CheckoutModalProps {
  open:     boolean;
  onClose:  () => void;
  title:    string;
  subtitle: string;
  color?:   string;
  product:  CheckoutProduct;
  methods:  PaymentMethods;
  priceUSD: number;
  priceNGN: number;
}

/** Payment method picker in a dialog (used by membership tiers). */
export function CheckoutModal({ open, onClose, title, subtitle, color = '#C9A84C', ...rest }: CheckoutModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-0 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="w-full sm:max-w-md bg-od-dark border border-od-border p-6 sm:p-8 max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="section-label mb-2">CHECKOUT</p>
            <h2 className="font-bebas text-4xl leading-none" style={{ color }}>{title}</h2>
            <p className="font-mono text-[10px] tracking-widest text-od-muted mt-2">{subtitle}</p>
          </div>
          <button onClick={onClose} className="text-od-muted hover:text-white p-1" aria-label="Close">
            <X size={20} />
          </button>
        </div>
        <CheckoutOptions {...rest} />
      </div>
    </div>
  );
}
