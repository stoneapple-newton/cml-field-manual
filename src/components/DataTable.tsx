import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface DataTableProps {
  columns: string[];
  rows: ReactNode[][];
  /** Render the first column in mono + accent tint (common for field/param names). */
  monoFirstCol?: boolean;
  className?: string;
}

/**
 * Dense engineering table: header bg-surface mono uppercase, 44px rows,
 * hover bg-raised, row stagger (30ms/row, translateY 8px) on first view.
 */
export default function DataTable({ columns, rows, monoFirstCol = true, className }: DataTableProps) {
  return (
    <div className={cn('overflow-x-auto rounded-[10px] border border-line', className)}>
      <table className="w-full min-w-[560px] border-collapse text-left text-[14px]">
        <thead>
          <tr className="bg-surface">
            {columns.map((c) => (
              <th
                key={c}
                className="border-b border-line px-4 py-2.5 font-mono text-[12px] font-semibold uppercase tracking-[0.08em] text-dim"
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ staggerChildren: 0.03 }}
        >
          {rows.map((row, i) => (
            <motion.tr
              key={i}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
              }}
              className="h-11 border-b border-line/60 transition-colors last:border-b-0 hover:bg-raised"
            >
              {row.map((cell, j) => (
                <td
                  key={j}
                  className={cn(
                    'px-4 py-2.5 align-middle text-body',
                    j === 0 && monoFirstCol && 'font-mono text-[13px] text-accent',
                  )}
                >
                  {cell}
                </td>
              ))}
            </motion.tr>
          ))}
        </motion.tbody>
      </table>
    </div>
  );
}

/** Tiny accent-outline "Required" badge. */
export function RequiredBadge() {
  return (
    <span className="ml-2 inline-flex rounded border border-accent/50 px-1.5 py-px font-mono text-[10px] font-medium text-accent">
      required
    </span>
  );
}

/** Amber "mutually exclusive" chip. */
export function MutexBadge({ children = 'mutually exclusive' }: { children?: ReactNode }) {
  return (
    <span className="ml-2 inline-flex rounded border border-amber/50 bg-amber-dim/50 px-1.5 py-px font-mono text-[10px] font-medium text-amber">
      {children}
    </span>
  );
}
