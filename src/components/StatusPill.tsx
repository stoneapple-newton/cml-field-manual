import { cn } from '@/lib/utils';

/**
 * Run status colors per design.md §1:
 * SCHEDULING/STARTING → amber · RUNNING → blue (pulsing) · SUCCEEDED → green
 * FAILED → red · STOPPED/TIMEDOUT/UNKNOWN → muted gray
 */
const STATUS_MAP: Record<string, { color: string; pulse: boolean }> = {
  ENGINE_SCHEDULING: { color: '#F5A524', pulse: true },
  ENGINE_STARTING: { color: '#F5A524', pulse: true },
  ENGINE_RUNNING: { color: '#5BA8F5', pulse: true },
  ENGINE_STOPPING: { color: '#F5A524', pulse: true },
  ENGINE_SUCCEEDED: { color: '#22D3A7', pulse: false },
  ENGINE_FAILED: { color: '#F5675B', pulse: false },
  ENGINE_STOPPED: { color: '#7C8A9A', pulse: false },
  ENGINE_TIMEDOUT: { color: '#7C8A9A', pulse: false },
  ENGINE_UNKNOWN: { color: '#7C8A9A', pulse: false },
};

interface StatusPillProps {
  status: string;
  className?: string;
}

export default function StatusPill({ status, className }: StatusPillProps) {
  const { color, pulse } = STATUS_MAP[status] ?? { color: '#7C8A9A', pulse: false };
  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[12px]',
        className,
      )}
      style={{ color }}
    >
      <span
        className={cn('h-2 w-2 rounded-full', pulse && 'animate-pulse-dot')}
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}66` }}
      />
      {status}
    </span>
  );
}
