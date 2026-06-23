'use client';

import { useRouter } from 'next/navigation';
import { Zap } from 'lucide-react';

interface PaymentButtonProps {
  label?:     string;
  tierId?:    string;
  className?: string;
  fullWidth?: boolean;
}

export function PaymentButton({
  label     = 'BUY TICKET',
  tierId,
  className = '',
  fullWidth = true,
}: PaymentButtonProps) {
  const router = useRouter();

  function handleClick() {
    const dest = tierId ? `/join?tier=${tierId}` : '/join';
    router.push(dest);
  }

  return (
    <div className={`${fullWidth ? 'w-full' : ''} ${className}`}>
      <button
        type="button"
        onClick={handleClick}
        className="relative w-full border border-od-gold bg-od-gold/5 p-4 text-center group overflow-hidden
                   hover:bg-od-gold hover:border-od-gold transition-all duration-300 cursor-none"
      >
        {/* Shimmer sweep */}
        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/10 to-transparent pointer-events-none" />

        <div className="flex items-center justify-center gap-3 mb-1 relative z-10">
          <Zap size={14} className="text-od-gold group-hover:text-od-black transition-colors duration-300" />
          <span className="font-bebas tracking-widest text-od-gold group-hover:text-od-black text-lg transition-colors duration-300">
            {label}
          </span>
        </div>

        <p className="font-mono text-[9px] tracking-[0.3em] text-od-gold/60 group-hover:text-od-black/60 transition-colors duration-300 relative z-10">
          SIGN UP TO CONTINUE →
        </p>
      </button>

      <div className="flex gap-2 mt-2">
        <div className="flex-1 border border-od-border/40 py-1.5 flex items-center justify-center gap-1.5">
          <span className="text-[10px]">💳</span>
          <span className="font-mono text-[8px] tracking-widest text-od-muted">STRIPE</span>
        </div>
        <div className="flex-1 border border-od-border/40 py-1.5 flex items-center justify-center gap-1.5">
          <span className="text-[10px]">🇳🇬</span>
          <span className="font-mono text-[8px] tracking-widest text-od-muted">PAYSTACK</span>
        </div>
      </div>
    </div>
  );
}
