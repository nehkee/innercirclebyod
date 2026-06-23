'use client';

import { cn } from '@/lib/utils';

interface GlitchTextProps {
  text: string;
  className?: string;
  as?: 'h1' | 'h2' | 'h3' | 'h4' | 'p' | 'span' | 'div';
  gold?: boolean;
}

export function GlitchText({ text, className, as: Tag = 'div', gold = false }: GlitchTextProps) {
  return (
    <Tag
      className={cn('glitch', gold && 'gold-text', className)}
      data-text={text}
    >
      {text}
    </Tag>
  );
}
