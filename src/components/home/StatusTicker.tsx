import { memo } from 'react';
import StatusPill from '@/components/StatusPill';

const STATUSES = [
  'ENGINE_SCHEDULING',
  'ENGINE_STARTING',
  'ENGINE_RUNNING',
  'ENGINE_SUCCEEDED',
  'ENGINE_FAILED',
  'ENGINE_STOPPED',
  'ENGINE_TIMEDOUT',
  'ENGINE_UNKNOWN',
  'ENGINE_STOPPING',
];

/** Infinite marquee of run-status pills; pauses on hover. */
const StatusTicker = memo(function StatusTicker() {
  const row = (key: string) => (
    <div key={key} className="flex shrink-0 items-center gap-6 pr-6" aria-hidden={key === 'b'}>
      {STATUSES.map((s) => (
        <span key={s} className="flex items-center gap-6">
          <StatusPill status={s} />
          <span className="font-mono text-xs text-dim">·</span>
        </span>
      ))}
    </div>
  );

  return (
    <div className="marquee-track relative w-full overflow-hidden border-t border-line bg-base/60 py-3 backdrop-blur-sm">
      <div className="flex w-max animate-marquee">
        {row('a')}
        {row('b')}
      </div>
      <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-base to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-base to-transparent" />
    </div>
  );
});

export default StatusTicker;
