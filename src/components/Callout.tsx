import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Info, Lightbulb, TriangleAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

type CalloutVariant = 'correction' | 'info' | 'tip';

const VARIANTS: Record<
  CalloutVariant,
  { label: string; icon: typeof Info; bar: string; bg: string; text: string }
> = {
  correction: {
    label: 'CORRECTION',
    icon: TriangleAlert,
    bar: 'bg-amber',
    bg: 'bg-amber-dim/60',
    text: 'text-amber',
  },
  info: {
    label: 'NOTE',
    icon: Info,
    bar: 'bg-blue',
    bg: 'bg-blue-dim/60',
    text: 'text-blue',
  },
  tip: {
    label: 'TIP',
    icon: Lightbulb,
    bar: 'bg-accent',
    bg: 'bg-accent-dim/60',
    text: 'text-accent',
  },
};

interface CalloutProps {
  variant: CalloutVariant;
  title?: string;
  children: ReactNode;
  className?: string;
}

export default function Callout({ variant, title, children, className }: CalloutProps) {
  const v = VARIANTS[variant];
  const Icon = v.icon;
  return (
    <motion.aside
      initial={{ opacity: 0, x: -16 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className={cn(
        'relative overflow-hidden rounded-[10px] border border-line pl-5 pr-5 py-4',
        v.bg,
        className,
      )}
    >
      <span className={cn('absolute inset-y-0 left-0 w-[3px]', v.bar)} aria-hidden="true" />
      <div className={cn('flex items-center gap-2 font-mono text-[11px] font-bold tracking-[0.12em]', v.text)}>
        <Icon size={14} strokeWidth={2.4} />
        {v.label}
        {title && <span className="font-medium normal-case tracking-normal text-ink">— {title}</span>}
      </div>
      <div className="mt-2 text-[15px] leading-relaxed text-body">{children}</div>
    </motion.aside>
  );
}
