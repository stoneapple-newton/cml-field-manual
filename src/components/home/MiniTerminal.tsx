import { memo, useEffect, useState } from 'react';

const CMD_LINES = [
  '$ curl -X POST $CML_HOST/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs \\',
  '    -H "Authorization: Bearer $API_KEY" -d \'{}\'',
];

const STATUS_CYCLE = [
  { label: 'ENGINE_SCHEDULING', color: '#F5A524' },
  { label: 'ENGINE_STARTING', color: '#F5A524' },
  { label: 'ENGINE_RUNNING', color: '#5BA8F5' },
  { label: 'ENGINE_SUCCEEDED', color: '#22D3A7' },
];

/**
 * Mini terminal card: types a curl command char-by-char, then prints the JSON
 * response and cycles the status field SCHEDULING → STARTING → RUNNING →
 * SUCCEEDED (color-shifting), holds, clears, repeats.
 */
const MiniTerminal = memo(function MiniTerminal() {
  const [typed, setTyped] = useState('');
  const [phase, setPhase] = useState<'typing' | 'status' | 'hold'>('typing');
  const [statusIdx, setStatusIdx] = useState(0);

  const fullCmd = CMD_LINES.join('\n');

  useEffect(() => {
    let timer: number;
    if (phase === 'typing') {
      if (typed.length < fullCmd.length) {
        timer = window.setTimeout(() => setTyped(fullCmd.slice(0, typed.length + 1)), 30);
      } else {
        timer = window.setTimeout(() => setPhase('status'), 350);
      }
    } else if (phase === 'status') {
      if (statusIdx < STATUS_CYCLE.length - 1) {
        timer = window.setTimeout(() => setStatusIdx((i) => i + 1), 700);
      } else {
        timer = window.setTimeout(() => setPhase('hold'), 700);
      }
    } else {
      timer = window.setTimeout(() => {
        setTyped('');
        setStatusIdx(0);
        setPhase('typing');
      }, 2000);
    }
    return () => window.clearTimeout(timer);
  }, [phase, typed, statusIdx, fullCmd]);

  const status = STATUS_CYCLE[statusIdx];

  return (
    <div className="w-full max-w-[400px] overflow-hidden rounded-[10px] border border-line bg-code shadow-2xl shadow-black/40">
      <div className="flex h-9 items-center gap-3 border-b border-line bg-surface px-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
        </span>
        <span className="font-mono text-[11px] text-dim">job-run.sh — live</span>
      </div>
      <div className="p-4 font-mono text-[12px] leading-[1.75]">
        <pre className="whitespace-pre-wrap break-all text-body">
          {typed}
          {phase === 'typing' && <span className="animate-caret-blink text-accent">▌</span>}
        </pre>
        {phase !== 'typing' && (
          <pre className="mt-2 whitespace-pre-wrap text-body">
            {'{ "id": "run-9f2a…", "status": "'}
            <span style={{ color: status.color }}>{status.label}</span>
            {'" }'}
          </pre>
        )}
      </div>
    </div>
  );
});

export default MiniTerminal;
