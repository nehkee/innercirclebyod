import { cn } from '@/lib/utils';

interface TickerProps {
  items: string[];
  className?: string;
  separator?: string;
  speed?: 'slow' | 'normal' | 'fast';
}

export function Ticker({ items, className, separator = '⚙️', speed = 'normal' }: TickerProps) {
  const duration = { slow: '60s', normal: '40s', fast: '20s' }[speed];
  const content  = [...items, ...items].join(`   ${separator}   `);

  return (
    <div className={cn('ticker-wrap border-y border-od-border py-3 overflow-hidden', className)}>
      <div
        className="ticker-content font-bebas tracking-widest text-sm text-od-muted whitespace-nowrap"
        style={{ animationDuration: duration }}
      >
        {content}&nbsp;&nbsp;&nbsp;{separator}&nbsp;&nbsp;&nbsp;{content}
      </div>
    </div>
  );
}
