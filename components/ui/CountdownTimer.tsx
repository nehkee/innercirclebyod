'use client';

import { useEffect, useState } from 'react';

interface CountdownTimerProps {
  targetDate: string;
  className?: string;
  compact?: boolean;
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
}

function calculate(target: string): TimeLeft {
  const diff = Math.max(0, new Date(target).getTime() - Date.now());
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function pad(n: number | undefined) {
  return n === undefined ? '--' : String(n).padStart(2, '0');
}

export function CountdownTimer({ targetDate, className, compact = false }: CountdownTimerProps) {
  // null until mounted: the server can't know the visitor's clock, and "00" would read as "it's over"
  const [time, setTime] = useState<TimeLeft | null>(null);

  useEffect(() => {
    setTime(calculate(targetDate));
    const id = setInterval(() => setTime(calculate(targetDate)), 1000);
    return () => clearInterval(id);
  }, [targetDate]);

  if (compact) {
    return (
      <span className={`font-mono text-ic-gold text-sm ${className}`}>
        {pad(time?.days)}:{pad(time?.hours)}:{pad(time?.minutes)}:{pad(time?.seconds)}
      </span>
    );
  }

  const units = [
    { label: 'DAYS',    value: time?.days },
    { label: 'HRS',     value: time?.hours },
    { label: 'MINS',    value: time?.minutes },
    { label: 'SECS',    value: time?.seconds },
  ];

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {units.map(({ label, value }, i) => (
        <div key={label} className="flex items-center gap-3">
          <div className="text-center">
            <div className="font-mono text-3xl font-bold text-ic-gold tabular-nums leading-none">
              {pad(value)}
            </div>
            <div className="font-mono text-[11px] tracking-widest text-ic-muted mt-1">
              {label}
            </div>
          </div>
          {i < units.length - 1 && (
            <span className="font-mono text-2xl text-ic-border mb-4">:</span>
          )}
        </div>
      ))}
    </div>
  );
}
