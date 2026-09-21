import { memo, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUpRight,
  CalendarClock,
  GitBranch,
  Play,
  Search,
  Terminal,
} from 'lucide-react';
import CodeBlock from '@/components/CodeBlock';
import Callout from '@/components/Callout';
import DataTable, { MutexBadge, RequiredBadge } from '@/components/DataTable';
import DocsSidebar from '@/components/DocsSidebar';
import type { DocsSection } from '@/components/DocsSidebar';
import EndpointRow from '@/components/EndpointRow';
import StatusPill from '@/components/StatusPill';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const SECTIONS: DocsSection[] = [
  { id: 'overview', label: 'What a job is' },
  { id: 'create-ui', label: 'Create via UI' },
  { id: 'create-api', label: 'Create via API' },
  { id: 'fields', label: 'Field reference' },
  { id: 'scheduling', label: 'Scheduling' },
  { id: 'lifecycle', label: 'Run lifecycle' },
  { id: 'monitoring', label: 'Monitoring & logs' },
  { id: 'code', label: 'Code' },
  { id: 'cheatsheet', label: 'Cheat sheet' },
];

/* ------------------------------ primitives ----------------------------- */

function WordRise({ text, delayBase = 0 }: { text: string; delayBase?: number }) {
  return (
    <>
      {text.split(' ').map((w, i, arr) => (
        <span key={i}>
          <span className="inline-block overflow-hidden align-bottom">
            <motion.span
              className="inline-block"
              initial={{ y: '110%' }}
              animate={{ y: 0 }}
              transition={{ delay: delayBase + i * 0.045, duration: 0.55, ease: EASE_OUT }}
            >
              {w}
            </motion.span>
          </span>
          {i < arr.length - 1 ? ' ' : ''}
        </span>
      ))}
    </>
  );
}

interface SectionProps {
  id: string;
  eyebrow: string;
  title: string;
  intro?: ReactNode;
  children: ReactNode;
  className?: string;
}

function Section({ id, eyebrow, title, intro, children, className }: SectionProps) {
  return (
    <section id={id} className={cn('scroll-mt-24 border-t border-line/60 py-14 lg:py-16', className)}>
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.4 }}
        className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT }}
        className="mt-3 font-display text-[28px] font-semibold leading-tight text-ink sm:text-[32px]"
      >
        {title}
      </motion.h2>
      {intro && (
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.45, delay: 0.12 }}
          className="mt-4 max-w-[720px] text-[15px] leading-relaxed text-body"
        >
          {intro}
        </motion.p>
      )}
      <div className="mt-8">{children}</div>
    </section>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/* ------------------------------ cron engine ---------------------------- */

interface FieldSpec {
  min: number;
  max: number;
  names?: Record<string, number>;
  normalize?: (v: number) => number;
}

const FIELD_SPECS: FieldSpec[] = [
  { min: 0, max: 59 }, // minute
  { min: 0, max: 23 }, // hour
  { min: 1, max: 31 }, // day-of-month
  {
    min: 1,
    max: 12,
    names: {
      JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
      JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12,
    },
  },
  {
    min: 0,
    max: 7,
    names: { SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6 },
    normalize: (v) => (v === 7 ? 0 : v),
  },
];

const STAR_SIZES = [60, 24, 31, 12, 7];

function resolveToken(tok: string, spec: FieldSpec): number | null {
  const named = spec.names?.[tok.toUpperCase()];
  if (named !== undefined) return named;
  if (!/^\d+$/.test(tok)) return null;
  const v = parseInt(tok, 10);
  return v >= spec.min && v <= spec.max ? v : null;
}

/** Parse one cron field (* , lists, ranges, steps, names). null = invalid. */
function parseCronField(expr: string, spec: FieldSpec): Set<number> | null {
  const values = new Set<number>();
  const trimmed = expr.trim();
  if (!trimmed) return null;
  for (const rawPart of trimmed.split(',')) {
    const m = /^(\*|[A-Za-z0-9]+)(?:-([A-Za-z0-9]+))?(?:\/(\d+))?$/.exec(rawPart.trim());
    if (!m) return null;
    const step = m[3] ? parseInt(m[3], 10) : 1;
    if (step < 1) return null;
    const add = (v: number) => values.add(spec.normalize ? spec.normalize(v) : v);
    if (m[1] === '*') {
      if (m[2]) return null;
      for (let v = spec.min; v <= spec.max; v += step) add(v);
    } else {
      const a = resolveToken(m[1], spec);
      if (a === null) return null;
      if (m[2] !== undefined) {
        const b = resolveToken(m[2], spec);
        if (b === null || b < a) return null;
        for (let v = a; v <= b; v += step) add(v);
      } else {
        if (m[3]) return null; // "5/10" is not valid 5-field cron
        add(a);
      }
    }
  }
  return values;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const DOW_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const DOW_SHORT = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const pad2 = (n: number) => String(n).padStart(2, '0');

function fmtValues(values: Set<number>, label: (v: number) => string = String): string {
  const arr = [...values].sort((a, b) => a - b);
  let contiguous = arr.length > 2;
  for (let i = 1; i < arr.length; i++) {
    if (arr[i] !== arr[i - 1] + 1) {
      contiguous = false;
      break;
    }
  }
  if (contiguous) return `${label(arr[0])}–${label(arr[arr.length - 1])}`;
  return arr.map(label).join(', ');
}

/** Plain-English rendering in the spirit of the API's english_schedule field. */
function describeCron(exprs: string[]): string | null {
  const sets = exprs.map((e, i) => parseCronField(e, FIELD_SPECS[i]));
  if (sets.some((s) => s === null)) return null;
  const [mnS, hrS, domS, moS, dowS] = sets as Set<number>[];
  const [mnE, hrE] = exprs.map((e) => e.trim());
  const star = (s: Set<number>, i: number) => s.size === STAR_SIZES[i];
  const mnStar = star(mnS, 0);
  const hrStar = star(hrS, 1);
  const domStar = star(domS, 2);
  const moStar = star(moS, 3);
  const dowStar = star(dowS, 4);

  const stepOf = (e: string) => (/^\*\/\d+$/.test(e) ? parseInt(e.slice(2), 10) : null);
  const mnStep = stepOf(mnE);
  const hrStep = stepOf(hrE);

  let time: string;
  if (mnStar && hrStar) time = 'Every minute';
  else if (mnStep !== null && hrStar)
    time = `Every ${mnStep} minute${mnStep > 1 ? 's' : ''}`;
  else if (mnS.size === 1 && hrStep !== null)
    time = `At minute ${[...mnS][0]} past every ${hrStep} hour${hrStep > 1 ? 's' : ''}`;
  else if (mnS.size === 1 && hrS.size === 1)
    time = `At ${pad2([...hrS][0])}:${pad2([...mnS][0])} UTC`;
  else if (mnS.size === 1 && hrStar) time = `At minute ${[...mnS][0]} of every hour`;
  else if (mnStar && !hrStar) time = `Every minute during hour(s) ${fmtValues(hrS)}`;
  else time = `Minutes "${mnE}", hours "${hrE}"`;

  const parts: string[] = [time];
  if (domStar && dowStar) {
    parts.push('every day');
  } else {
    const dayParts: string[] = [];
    if (!domStar) dayParts.push(`day-of-month ${fmtValues(domS)}`);
    if (!dowStar) dayParts.push(fmtValues(dowS, (v) => DOW_NAMES[v]));
    parts.push(`on ${dayParts.join(' or ')}`);
  }
  if (!moStar) parts.push(`in ${fmtValues(moS, (v) => MONTH_NAMES[v - 1])}`);
  return parts.join(', ');
}

/** Next `count` fire times (UTC), computed by fast-forwarding day/hour/minute. */
function nextRunTimes(exprs: string[], count: number): Date[] {
  const sets = exprs.map((e, i) => parseCronField(e, FIELD_SPECS[i]));
  if (sets.some((s) => s === null)) return [];
  const [mn, hr, dom, mo, dow] = sets as Set<number>[];
  const domStar = dom.size === STAR_SIZES[2];
  const dowStar = dow.size === STAR_SIZES[4];
  const out: Date[] = [];
  const d = new Date();
  d.setUTCSeconds(0, 0);
  d.setUTCMinutes(d.getUTCMinutes() + 1);
  let guard = 0;
  while (out.length < count && guard < 6000) {
    guard++;
    if (!mo.has(d.getUTCMonth() + 1)) {
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(1);
      d.setUTCMonth(d.getUTCMonth() + 1);
      continue;
    }
    const domOk = dom.has(d.getUTCDate());
    const dowOk = dow.has(d.getUTCDay());
    // Standard cron semantics: when both dom and dow are restricted, they OR.
    const dayOk = !domStar && !dowStar ? domOk || dowOk : domOk && dowOk;
    if (!dayOk) {
      d.setUTCHours(0, 0, 0, 0);
      d.setUTCDate(d.getUTCDate() + 1);
      continue;
    }
    if (!hr.has(d.getUTCHours())) {
      d.setUTCMinutes(0, 0, 0);
      d.setUTCHours(d.getUTCHours() + 1);
      continue;
    }
    if (!mn.has(d.getUTCMinutes())) {
      d.setUTCMinutes(d.getUTCMinutes() + 1, 0, 0);
      continue;
    }
    out.push(new Date(d));
    d.setUTCMinutes(d.getUTCMinutes() + 1, 0, 0);
  }
  return out;
}

const CRON_LABELS = ['minute', 'hour', 'day-of-month', 'month', 'day-of-week'];

function CronBuilder() {
  const [fields, setFields] = useState<string[]>(['0', '2', '*', '*', '*']);
  const [debounced, setDebounced] = useState<string[]>(fields);

  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(fields), 150);
    return () => window.clearTimeout(t);
  }, [fields]);

  const liveValidity = useMemo(
    () => fields.map((f, i) => parseCronField(f, FIELD_SPECS[i]) !== null),
    [fields],
  );
  const allValid = useMemo(
    () => debounced.every((f, i) => parseCronField(f, FIELD_SPECS[i]) !== null),
    [debounced],
  );
  const english = useMemo(
    () => (allValid ? describeCron(debounced) : null),
    [debounced, allValid],
  );
  const nextRuns = useMemo(
    () => (allValid ? nextRunTimes(debounced, 3) : []),
    [debounced, allValid],
  );

  return (
    <div className="rounded-[10px] border border-line bg-raised p-5 sm:p-6">
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
        cron builder — <span className="text-accent">schedule</span> field
      </p>

      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {CRON_LABELS.map((label, i) => (
          <label key={label} className="block">
            <span className="mb-1.5 block font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
              {label}
            </span>
            <input
              value={fields[i]}
              onChange={(e) => {
                const next = [...fields];
                next[i] = e.target.value;
                setFields(next);
              }}
              spellCheck={false}
              autoComplete="off"
              className={cn(
                'w-full rounded-md border bg-code px-3 py-2 text-center font-mono text-[14px] text-ink outline-none transition-colors',
                liveValidity[i]
                  ? 'border-line focus:border-accent/60'
                  : 'border-red/70 focus:border-red',
              )}
            />
          </label>
        ))}
      </div>

      <div className="mt-5 min-h-[52px] rounded-md border border-line bg-code px-4 py-3">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={english ?? 'invalid'}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
          >
            {english ? (
              <p className="font-mono text-[13px] text-accent">
                english_schedule <span className="text-dim">=</span> "{english}"
              </p>
            ) : (
              <p className="font-mono text-[13px] text-red">
                invalid cron — expected five fields: minute hour day-of-month month day-of-week
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {nextRuns.length > 0 && (
        <div className="mt-4">
          <p className="font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
            next 3 fire times (UTC)
          </p>
          <ul className="mt-2 space-y-1">
            {nextRuns.map((d) => (
              <li key={d.toISOString()} className="flex items-center gap-3 font-mono text-[13px] text-body">
                <span className="h-1.5 w-1.5 rounded-full bg-accent/70" />
                {DOW_SHORT[d.getUTCDay()]} {d.toISOString().slice(0, 16).replace('T', ' ')} UTC
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ------------------------ run lifecycle state machine ------------------------ */

const SM_COLORS: Record<string, string> = {
  ENGINE_SCHEDULING: '#F5A524',
  ENGINE_STARTING: '#F5A524',
  ENGINE_RUNNING: '#5BA8F5',
  ENGINE_STOPPING: '#F5A524',
  ENGINE_SUCCEEDED: '#22D3A7',
  ENGINE_FAILED: '#F5675B',
  ENGINE_STOPPED: '#7C8A9A',
  ENGINE_TIMEDOUT: '#7C8A9A',
  ENGINE_UNKNOWN: '#7C8A9A',
};

const SM_INFO: Record<string, { blurb: string; terminal: boolean }> = {
  ENGINE_SCHEDULING: {
    blurb:
      'Run accepted. CML is finding capacity and queuing an engine pod with the job\u2019s resource profile (vCPU / memory / GPU).',
    terminal: false,
  },
  ENGINE_STARTING: {
    blurb:
      'The engine container is starting: pulling the runtime image and mounting the project filesystem at /home/cdsw.',
    terminal: false,
  },
  ENGINE_RUNNING: {
    blurb:
      'The script is executing. stdout/stderr stream into the run\u2019s session output, viewable in the History tab.',
    terminal: false,
  },
  ENGINE_SUCCEEDED: {
    blurb:
      'The script exited with code 0. If other jobs list this one as parent_job_id, their runs trigger now.',
    terminal: true,
  },
  ENGINE_FAILED: {
    blurb: 'Non-zero exit code or an uncaught exception in the script.',
    terminal: true,
  },
  ENGINE_STOPPING: {
    blurb: 'A stop was requested — CML is tearing the engine down before marking the run stopped.',
    terminal: false,
  },
  ENGINE_STOPPED: {
    blurb: 'Stopped manually: the UI stop button or client.stop_job_run(project_id, job_id, run_id).',
    terminal: true,
  },
  ENGINE_TIMEDOUT: {
    blurb:
      'Exceeded the job timeout (seconds, the timeout field). The run is killed if kill_on_timeout is set.',
    terminal: true,
  },
  ENGINE_UNKNOWN: {
    blurb: 'Status could not be determined — e.g. the engine state was lost before completion.',
    terminal: true,
  },
};

interface SmNode {
  id: string;
  x: number;
  y: number;
  dashed?: boolean;
}

const SM_W = 150;
const SM_H = 36;

const SM_NODES: SmNode[] = [
  { id: 'ENGINE_SCHEDULING', x: 8, y: 168 },
  { id: 'ENGINE_STARTING', x: 182, y: 168 },
  { id: 'ENGINE_RUNNING', x: 356, y: 168 },
  { id: 'ENGINE_SUCCEEDED', x: 560, y: 24 },
  { id: 'ENGINE_FAILED', x: 560, y: 96 },
  { id: 'ENGINE_STOPPING', x: 560, y: 168 },
  { id: 'ENGINE_STOPPED', x: 744, y: 168 },
  { id: 'ENGINE_TIMEDOUT', x: 560, y: 240 },
  { id: 'ENGINE_UNKNOWN', x: 8, y: 320, dashed: true },
];

const SM_EDGES = [
  { id: 'e1', from: 'ENGINE_SCHEDULING', to: 'ENGINE_STARTING', d: 'M 158 186 L 182 186' },
  { id: 'e2', from: 'ENGINE_STARTING', to: 'ENGINE_RUNNING', d: 'M 332 186 L 356 186' },
  { id: 'e3', from: 'ENGINE_RUNNING', to: 'ENGINE_SUCCEEDED', d: 'M 506 186 C 540 186, 520 42, 560 42' },
  { id: 'e4', from: 'ENGINE_RUNNING', to: 'ENGINE_FAILED', d: 'M 506 186 C 535 186, 525 114, 560 114' },
  { id: 'e5', from: 'ENGINE_RUNNING', to: 'ENGINE_STOPPING', d: 'M 506 186 L 560 186' },
  { id: 'e6', from: 'ENGINE_STOPPING', to: 'ENGINE_STOPPED', d: 'M 710 186 L 744 186' },
  { id: 'e7', from: 'ENGINE_RUNNING', to: 'ENGINE_TIMEDOUT', d: 'M 506 186 C 535 186, 525 258, 560 258' },
];

function RunStateMachine() {
  const [selected, setSelected] = useState('ENGINE_SUCCEEDED');
  const [pulseKey, setPulseKey] = useState(0);
  const incoming = SM_EDGES.filter((e) => e.to === selected);
  const info = SM_INFO[selected];

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="overflow-x-auto rounded-[10px] border border-line bg-raised p-3">
        <svg
          viewBox="0 0 910 380"
          className="w-full min-w-[720px]"
          role="img"
          aria-label="CML job run status state machine"
        >
          <defs>
            <marker
              id="sm-arrow"
              viewBox="0 0 8 8"
              refX="7"
              refY="4"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M0 0L8 4L0 8z" fill="#2E4053" />
            </marker>
          </defs>

          {SM_EDGES.map((e, i) => (
            <motion.path
              key={e.id}
              d={e.d}
              fill="none"
              stroke={e.to === selected ? '#22D3A7' : '#2E4053'}
              strokeWidth={e.to === selected ? 1.8 : 1.2}
              markerEnd="url(#sm-arrow)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.6, delay: 0.15 + i * 0.08, ease: 'easeOut' }}
            />
          ))}

          {pulseKey > 0 &&
            incoming.map((e) => (
              <circle key={`${e.id}-${pulseKey}`} r="3.5" fill="#22D3A7">
                <animateMotion dur="0.7s" repeatCount="1" fill="freeze" path={e.d} />
                <animate attributeName="opacity" from="1" to="0" dur="0.95s" fill="freeze" />
              </circle>
            ))}

          {SM_NODES.map((n, i) => {
            const color = SM_COLORS[n.id];
            const isSel = n.id === selected;
            return (
              <motion.g
                key={n.id}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, margin: '-15% 0px' }}
                transition={{ duration: 0.35, delay: 0.05 + i * 0.05 }}
                style={{
                  transformOrigin: `${n.x + SM_W / 2}px ${n.y + SM_H / 2}px`,
                  cursor: 'pointer',
                }}
                onClick={() => {
                  setSelected(n.id);
                  setPulseKey((k) => k + 1);
                }}
              >
                <rect
                  x={n.x}
                  y={n.y}
                  width={SM_W}
                  height={SM_H}
                  rx={18}
                  fill="#10161E"
                  stroke={isSel ? '#22D3A7' : '#1F2B38'}
                  strokeWidth={isSel ? 1.6 : 1}
                  strokeDasharray={n.dashed ? '4 3' : undefined}
                />
                <circle cx={n.x + 16} cy={n.y + SM_H / 2} r={4} fill={color} />
                <text
                  x={n.x + 27}
                  y={n.y + SM_H / 2 + 3.5}
                  fontSize={10.5}
                  fill={isSel ? '#E6EDF3' : '#B7C2CE'}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {n.id}
                </text>
              </motion.g>
            );
          })}
        </svg>
      </div>

      <div className="h-fit rounded-[10px] border border-line bg-raised p-5 lg:sticky lg:top-24">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={selected}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <StatusPill status={selected} />
            <p className="mt-4 text-[14px] leading-relaxed text-body">{info.blurb}</p>
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
              <span style={{ color: SM_COLORS[selected] }}>●</span>{' '}
              {info.terminal ? 'terminal state' : 'transitional state'}
            </p>
          </motion.div>
        </AnimatePresence>
        <p className="mt-5 border-t border-line pt-4 font-mono text-[11px] text-dim">
          // click a state to inspect it
        </p>
      </div>
    </div>
  );
}

/* --------------------------- log viewer mock --------------------------- */

const LOG_LINES = [
  '[02:00:04] engine scheduled — 2 vCPU / 4 GiB / 0 GPU',
  '[02:00:09] runtime image pulled: ml-runtime-workbench-python3.10-standard:2024.05.1-b4',
  '[02:00:11] mounting project filesystem at /home/cdsw',
  '[02:00:12] $ python3 etl.py --date 2024-06-01 --backfill',
  '[02:00:18] reading source tables...',
  '[02:00:41] transformed 14,203 rows',
  '[02:00:44] wrote report/result.csv',
  '[02:00:44] exit code 0 — ENGINE_SUCCEEDED',
];

const LogViewerMock = memo(function LogViewerMock() {
  const [count, setCount] = useState(3);
  useEffect(() => {
    const t = window.setInterval(() => {
      setCount((c) => (c >= LOG_LINES.length ? 3 : c + 1));
    }, 1500);
    return () => window.clearInterval(t);
  }, []);
  const visible = LOG_LINES.slice(0, count).slice(-5);
  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-code">
      <div className="flex h-9 items-center gap-2 border-b border-line bg-surface px-3">
        <Terminal size={13} className="text-dim" />
        <span className="font-mono text-[11px] text-dim">session output — run #42 (mock)</span>
        <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-blue">
          <span className="h-1.5 w-1.5 animate-pulse-dot rounded-full bg-blue" />
          live
        </span>
      </div>
      <div className="h-[140px] p-4 font-mono text-[12.5px] leading-[1.7]">
        {visible.map((line, i) => (
          <div key={line} className={i === visible.length - 1 ? 'text-ink' : 'text-dim'}>
            {line}
            {i === visible.length - 1 && (
              <span className="ml-1 inline-block h-3 w-[7px] animate-caret-blink bg-accent/80 align-middle" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
});

/* ------------------------------ code snippets ---------------------------- */

const CURL_CREATE = `export CML_HOST="https://ml-1234.your-env.cloudera.site"   # workspace domain
export API_KEY="your-api-key"                              # User Settings -> API Keys
export PROJECT_ID="abc1-def2-ghi3"

curl -X POST "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -H "Accept: application/json" \\
  -d '{
    "name": "nightly-etl",
    "script": "etl.py",
    "kernel": "python3",
    "arguments": "--date \${START_DATE}",
    "cpu": 2,
    "memory": 4,
    "nvidia_gpu": 0,
    "timeout": 3600,
    "kill_on_timeout": true,
    "schedule": "0 2 * * *",
    "environment": {"START_DATE": "2024-01-01"},
    "runtime_identifier": "docker.repository.cloudera.com/cloudera/cdsw/ml-runtime-workbench-python3.10-standard:2024.05.1-b4",
    "recipients": [{"email": "you@example.com", "notify_on_success": false,
                    "notify_on_failure": true, "notify_on_timeout": true,
                    "notify_on_stop": false}],
    "attachments": ["report/result.csv"]
  }'`;

const PY_CREATE = `# pip3 install https://<workbench-domain>/api/v2/python.tar.gz
import cmlapi

client = cmlapi.default_client(url="https://<workbench-domain>", cml_api_key="<api key>")
project_id = "<project id>"

job_body = cmlapi.CreateJobRequest(
    project_id = project_id,
    name       = "my job name",
    script     = "pi.py",
    arguments  = 'arg1 arg2 "all arg 3"',
    kernel     = "python3",                 # or "r", or "scala" (legacy-engine projects only)
    schedule   = "0 * * * 5",               # any valid 5-field cron string
    # parent_job_id = "abcd-1234-abcd-1234",  # OR dependent job — never both
    cpu        = 1,
    memory     = 1,
    nvidia_gpu = 1,                         # whole GPUs only
    timeout    = 300,                       # seconds
    environment = {"MY_ENV_KEY": "MY_ENV_VAL"},
    attachments = ["report/1.txt", "report/2.txt"],
    runtime_identifier = "docker.repository.cloudera.com/cloudera/cdsw/ml-runtime-workbench-python3.10-standard:2024.05.1-b4",
    runtime_addon_identifiers = ["spark320-18-hf4"],
)
job = client.create_job(job_body, project_id=project_id)`;

const CURL_TRIGGER = `curl -X POST "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"environment": {"START_DATE": "2024-06-01"},
       "arguments": "--date 2024-06-01 --backfill"}'`;

const PY_POLL = `import time

while True:
    run = client.get_job_run(project_id=project_id, job_id=job.id, run_id=job_run.id)
    print(run.status)
    if run.status in ("ENGINE_SUCCEEDED", "ENGINE_FAILED", "ENGINE_STOPPED", "ENGINE_TIMEDOUT"):
        break
    time.sleep(10)`;

const PY_FULL = `# pip3 install https://<workbench-domain>/api/v2/python.tar.gz
import cmlapi, time

client = cmlapi.default_client(url="https://<workbench-domain>", cml_api_key="<api key>")
project_id = "<project id>"

# --- Create a job ---
job_body = cmlapi.CreateJobRequest(
    project_id = project_id,
    name       = "my job name",
    script     = "pi.py",
    arguments  = 'arg1 arg2 "all arg 3"',
    kernel     = "python3",                 # or "r", or "scala" (legacy-engine projects only)
    # schedule: manual by default; for recurring/cron:
    schedule   = "0 * * * 5",               # any valid 5-field cron string
    # OR for a dependent job (do NOT set both parent_job_id and schedule):
    # parent_job_id = "abcd-1234-abcd-1234",
    cpu        = 1,                         # vCores (float allowed)
    memory     = 1,                         # GB (float allowed)
    nvidia_gpu = 1,                         # whole GPUs only
    timeout    = 300,                       # seconds
    environment = {"MY_ENV_KEY": "MY_ENV_VAL", "MY_SECOND_ENV_KEY": "MY_SECOND_ENV_VAL"},
    attachments = ["report/1.txt", "report/2.txt"],   # relative to /home/cdsw/, attached to emails
    runtime_identifier = "docker.repository.cloudera.com/cloudera/cdsw/ml-runtime-workbench-python3.10-standard:2024.05.1-b4",
    runtime_addon_identifiers = ["spark320-18-hf4"],   # optional, e.g. Spark addon
)
job = client.create_job(job_body, project_id=project_id)

# --- Trigger a run (optionally with per-run env/arguments) ---
job_run = client.create_job_run(
    cmlapi.CreateJobRunRequest(environment={"RUN_PARAM": "42"}),
    project_id=project_id, job_id=job.id,
)

# --- Poll status ---
while True:
    run = client.get_job_run(project_id=project_id, job_id=job.id, run_id=job_run.id)
    print(run.status)   # ENGINE_SCHEDULING/STARTING/RUNNING/SUCCEEDED/FAILED/STOPPED/TIMEDOUT
    if run.status in ("ENGINE_SUCCEEDED", "ENGINE_FAILED", "ENGINE_STOPPED", "ENGINE_TIMEDOUT"):
        break
    time.sleep(10)

# --- List jobs / latest runs / stop / delete ---
jobs = client.list_jobs(project_id=project_id)
latest = client.list_job_runs(project_id, job.id, sort="-created_at", page_size=1)
client.stop_job_run(project_id=project_id, job_id=job.id, run_id=job_run.id)
client.delete_job(project_id=project_id, job_id=job.id)`;

const CURL_MANAGE = `export JOB_ID="<id from create response>"

# --- Trigger a run manually, with per-run overrides ---
curl -X POST "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs" \\
  -H "Authorization: Bearer $API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{"environment": {"START_DATE": "2024-06-01"},
       "arguments": "--date 2024-06-01 --backfill"}'

# --- List jobs / runs, get one run, stop a run ---
curl -H "Authorization: Bearer $API_KEY" "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs"
curl -H "Authorization: Bearer $API_KEY" \\
  "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs?sort=-created_at&page_size=5"
curl -H "Authorization: Bearer $API_KEY" \\
  "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs/$RUN_ID"
curl -X POST -H "Authorization: Bearer $API_KEY" \\
  "$CML_HOST/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs/$RUN_ID/stop"`;

/* ------------------------------ page data ------------------------------ */

const UI_FIELD_ROWS: ReactNode[][] = [
  ['Name', 'Display name of the job'],
  ['Run Job as', 'Optionally run under a Service Account (dropdown)'],
  [
    'Script',
    'File picker — the script must already exist in the project files',
  ],
  [
    'Arguments',
    <>
      CLI arguments for the script; also exposed via the <code>JOB_ARGUMENTS</code> environment
      variable (runtime-agnostic access)
    </>,
  ],
  [
    'Runtime Kernel',
    'Python 3 (legacy engines also offered Python 2, R, Scala)',
  ],
  [
    'Schedule',
    'Manual / Recurring (every X min, hourly, daily, weekly, monthly, or a cron expression) / Dependent',
  ],
  [
    'Resource Profile',
    'vCPUs and memory — plus GPU if the workspace has GPU nodes',
  ],
  ['Timeout (minutes)', 'Optional maximum runtime'],
  [
    'Environment variables',
    'Per-job env vars that override project-level variables',
  ],
  [
    'Job Report Recipients',
    'Emails (you, team, external) notified on success / failure / timeout',
  ],
  [
    'Attachments',
    'Files (e.g. the console log) attached to the emailed job report',
  ],
];

interface FieldRow {
  name: string;
  type: string;
  desc: string;
  required?: boolean;
  mutex?: string;
}

const FIELD_ROWS: FieldRow[] = [
  { name: 'project_id', type: 'string', desc: 'ID of the project containing the job' },
  { name: 'name', type: 'string', desc: 'Name of the new job', required: true },
  { name: 'script', type: 'string', desc: 'Script to run (path relative to project root)', required: true },
  { name: 'cpu', type: 'number', desc: 'vCPU cores per run (default 1); fractional allowed' },
  { name: 'memory', type: 'number', desc: 'Memory in GB per run (default 1); fractional allowed' },
  { name: 'nvidia_gpu', type: 'int32', desc: 'Number of NVIDIA GPUs (default 0; whole GPUs only)' },
  {
    name: 'parent_job_id',
    type: 'string',
    desc: 'Run when the parent job completes successfully — cannot be used with schedule',
    mutex: 'conflicts: schedule',
  },
  { name: 'environment', type: 'object', desc: 'Default env vars for runs, e.g. {"KEY": "VAL"}' },
  { name: 'arguments', type: 'string', desc: 'Default arguments passed to runs' },
  { name: 'timeout', type: 'int32', desc: 'Timeout of job runs, in seconds' },
  {
    name: 'schedule',
    type: 'string',
    desc: 'Cron schedule, e.g. "0 13 * * 1" = Mondays 1 PM UTC. Not on dependent jobs',
    mutex: 'conflicts: parent_job_id',
  },
  {
    name: 'kernel',
    type: 'string',
    desc: 'python3 / python2 / r / scala. Do not set on ML Runtime projects',
  },
  {
    name: 'recipients',
    type: 'array',
    desc: '{email, notify_on_success, notify_on_failure, notify_on_timeout, notify_on_stop}',
  },
  { name: 'attachments', type: 'string[]', desc: 'Email attachments, paths relative to /home/cdsw/' },
  {
    name: 'runtime_identifier',
    type: 'string',
    desc: 'Runtime image — required for ML Runtime projects',
    required: true,
  },
  {
    name: 'runtime_addon_identifiers',
    type: 'string[]',
    desc: 'Runtime addons, e.g. Spark addon spark320-18-hf4',
  },
  { name: 'kill_on_timeout', type: 'boolean', desc: 'Kill the run on timeout' },
];

const JOB_OBJECT_FIELDS = [
  'id',
  'name',
  'script',
  'kernel',
  'cpu',
  'memory',
  'nvidia_gpu',
  'arguments',
  'environment',
  'schedule',
  'english_schedule',
  'type  // "manual" | "cron" | "dependent"',
  'parent_id',
  'timezone',
  'paused',
  'timeout',
  'engine_image_id  // 0 when using runtimes',
  'runtime_identifier',
  'runtime_addon_identifiers',
  'kill_on_timeout',
  'creator { username, name, email }',
  'created_at',
  'updated_at',
];

const JOBRUN_FIELDS = [
  'id',
  'project_id',
  'job_id',
  'status',
  'created_at',
  'scheduling_at',
  'starting_at',
  'running_at',
  'finished_at',
  'kernel',
  'cpu',
  'memory',
  'nvidia_gpu',
  'arguments',
  'environment',
  'creator',
  'runtime_identifier',
];

const SCHEDULE_CARDS = [
  {
    icon: Play,
    title: 'Manual',
    body: 'Run only on demand — the UI "Run" button or a create_job_run call. This is the default; the Job object gets type "manual".',
    target: 'code',
  },
  {
    icon: CalendarClock,
    title: 'Recurring',
    body: 'UI presets (every X min → monthly) or a free-form 5-field cron string, always UTC. The job\u2019s type becomes "cron" and english_schedule is returned.',
    target: 'cron-builder',
  },
  {
    icon: GitBranch,
    title: 'Dependent',
    body: 'Runs when a parent job completes with ENGINE_SUCCEEDED — set parent_job_id (never together with schedule). Chains form pipelines.',
    href: '/workflows',
  },
];

const CHEAT_ROWS: ReactNode[][] = [
  [
    'Job definition',
    <>Launch engine + run script + track results — project-scoped, isolated container. Docs: "Creating a Job"</>,
  ],
  ['Create (UI)', <>Project → Jobs → New Job</>],
  [
    'Create (REST)',
    <>
      <code>POST /api/v2/projects/{'{project_id}'}/jobs</code> (<code>CreateJobRequest</code>)
    </>,
  ],
  [
    'Trigger run (REST)',
    <>
      <code>POST …/jobs/{'{job_id}'}/runs</code> (<code>CreateJobRunRequest</code>:{' '}
      <code>environment</code>, <code>arguments</code>)
    </>,
  ],
  [
    'Schedule',
    <>
      <code>schedule</code> = 5-field cron, always UTC; job <code>type</code> becomes{' '}
      <code>"cron"</code>; UI: Recurring
    </>,
  ],
  [
    'Dependency / pipeline',
    <>
      <code>parent_job_id</code> (API) / Schedule=Dependent (UI); <code>type</code>{' '}
      <code>"dependent"</code>
    </>,
  ],
  [
    'Run statuses',
    <>
      <code>ENGINE_SCHEDULING / STARTING / RUNNING / STOPPING / STOPPED / UNKNOWN / SUCCEEDED / FAILED / TIMEDOUT</code>
    </>,
  ],
  [
    'SDK (cmlapi)',
    <>
      <code>default_client()</code>, <code>create_job</code>, <code>create_job_run</code>,{' '}
      <code>list_job_runs</code>, <code>get_job_run</code>, <code>stop_job_run</code>,{' '}
      <code>delete_job</code>
    </>,
  ],
  ['History & logs', <>Job → History tab — session output (stdout/stderr) per run</>],
];

const ENDPOINTS: { method: 'GET' | 'POST' | 'PATCH' | 'DELETE'; path: string; sdk: string }[] = [
  { method: 'POST', path: '/api/v2/projects/{project_id}/jobs', sdk: 'create_job' },
  { method: 'GET', path: '/api/v2/projects/{project_id}/jobs', sdk: 'list_jobs' },
  { method: 'GET', path: '/api/v2/projects/{project_id}/jobs/{job_id}', sdk: 'get_job' },
  { method: 'PATCH', path: '/api/v2/projects/{project_id}/jobs/{job_id}', sdk: 'update_job' },
  { method: 'DELETE', path: '/api/v2/projects/{project_id}/jobs/{job_id}', sdk: 'delete_job' },
  { method: 'POST', path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs', sdk: 'create_job_run' },
  { method: 'GET', path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs', sdk: 'list_job_runs' },
  {
    method: 'GET',
    path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs/{run_id}',
    sdk: 'get_job_run',
  },
  {
    method: 'POST',
    path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs/{run_id}/stop',
    sdk: 'stop_job_run',
  },
];

/* --------------------------- field reference --------------------------- */

function Highlight({
  text,
  query,
  markClass = 'text-accent',
}: {
  text: string;
  query: string;
  markClass?: string;
}) {
  if (!query) return <>{text}</>;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return <>{text}</>;
  return (
    <>
      {text.slice(0, idx)}
      <span className={markClass}>{text.slice(idx, idx + query.length)}</span>
      {text.slice(idx + query.length)}
    </>
  );
}

function FieldReference() {
  const [query, setQuery] = useState('');
  const q = query.trim().toLowerCase();
  const filtered = FIELD_ROWS.filter(
    (f) => !q || f.name.toLowerCase().includes(q) || f.desc.toLowerCase().includes(q),
  );

  return (
    <div>
      <div className="relative">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="filter fields…"
          spellCheck={false}
          className="w-full rounded-[10px] border border-line bg-raised py-2.5 pl-10 pr-4 font-mono text-[13px] text-ink outline-none transition-colors placeholder:text-dim/70 focus:border-accent/60"
        />
      </div>

      <div className="mt-4 overflow-x-auto rounded-[10px] border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="bg-surface">
              {['Field', 'Type', 'Description'].map((c) => (
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
            key={q}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.15 }}
          >
            {filtered.map((f) => (
              <tr
                key={f.name}
                className="border-b border-line/60 transition-colors last:border-b-0 hover:bg-raised"
              >
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[13px] text-accent">
                  <Highlight text={f.name} query={q} markClass="rounded-sm bg-accent/25 text-ink" />
                  {f.required && <RequiredBadge />}
                  {f.mutex && <MutexBadge>{f.mutex}</MutexBadge>}
                </td>
                <td className="px-4 py-2.5 font-mono text-[12px] text-dim">{f.type}</td>
                <td className="px-4 py-2.5 text-body">
                  <Highlight text={f.desc} query={q} />
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-6 text-center font-mono text-[13px] text-dim">
                  no fields match "{query}"
                </td>
              </tr>
            )}
          </motion.tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[12px] text-dim">
        {filtered.length} / {FIELD_ROWS.length} fields
      </p>
    </div>
  );
}

/* ------------------------------ breadcrumb ----------------------------- */

function Breadcrumb() {
  const text = 'Project → Jobs → New Job';
  return (
    <motion.p
      className="inline-flex flex-wrap rounded-md border border-line bg-raised px-3.5 py-2 font-mono text-[13px] text-dim"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ staggerChildren: 0.018 }}
      aria-label={text}
    >
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          aria-hidden="true"
          variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
          className={cn(ch === '→' && 'text-accent', /[A-Za-z]/.test(ch) && i >= 17 && 'text-ink')}
        >
          {ch === ' ' ? '\u00A0' : ch}
        </motion.span>
      ))}
    </motion.p>
  );
}

/* --------------------------------- page --------------------------------- */

const OVERVIEW_CARDS = [
  {
    title: 'project-scoped',
    body: 'Jobs live inside one project; the script and its dependencies must exist in that same project.',
  },
  {
    title: 'isolated execution',
    body: 'Every run launches its own engine (Kubernetes pod) with the job\u2019s vCPU / memory / GPU profile and runtime.',
  },
  {
    title: 'observable',
    body: 'CML tracks run history, status, duration, and per-run session output — plus email job reports.',
  },
  {
    title: 'composable',
    body: 'Manual, cron, or dependent on another job. Dependent jobs chain into sequential pipelines.',
  },
];

export default function Jobs() {
  return (
    <div>
      <div className="mx-auto max-w-content px-5 lg:px-8">
        <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12">
          <DocsSidebar sections={SECTIONS} className="pt-16 lg:pt-24" />

          <article className="min-w-0 max-w-[880px] pb-10">
            {/* ---------------- Section 1 — page header ---------------- */}
            <section id="overview" className="scroll-mt-24 pb-14 pt-16 lg:pb-16 lg:pt-24">
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"
              >
                {'// 02 — JOBS'}
              </motion.p>
              <h1 className="mt-4 font-display text-[38px] font-bold leading-[1.08] text-ink sm:text-[52px]">
                <WordRise text="Launch an engine. Run a script. Track the result." />
              </h1>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
                className="mt-5 max-w-[720px] text-[16px] leading-relaxed text-body"
              >
                That sentence is the official definition of a CML job — one batch process,
                project-scoped, running in its own isolated container with its own resource
                profile. This page is the complete spec.
              </motion.p>

              <div className="mt-6 flex flex-wrap gap-2.5">
                {['project-scoped', 'isolated container per run', 'manual | cron | dependent'].map(
                  (chip, i) => (
                    <motion.span
                      key={chip}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: 0.6 + i * 0.08,
                        type: 'spring',
                        stiffness: 400,
                        damping: 22,
                      }}
                      className="rounded-md border border-line bg-raised px-3 py-1.5 font-mono text-[12px] text-body"
                    >
                      {chip}
                    </motion.span>
                  ),
                )}
              </div>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                {OVERVIEW_CARDS.map((c, i) => (
                  <motion.div
                    key={c.title}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-10% 0px' }}
                    transition={{ duration: 0.45, delay: i * 0.06, ease: EASE_OUT }}
                    className="rounded-[10px] border border-line bg-raised p-5"
                  >
                    <p className="font-mono text-[13px] font-semibold text-accent">{c.title}</p>
                    <p className="mt-2 text-[14px] leading-relaxed text-body">{c.body}</p>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ---------------- Section 2 — create via UI ---------------- */}
            <Section
              id="create-ui"
              eyebrow="// create via ui"
              title="Create a job via the UI"
              intro="The form maps one-to-one onto the API fields in the reference below — learn it once, automate it later."
            >
              <Breadcrumb />
              <DataTable className="mt-6" columns={['UI field', 'Meaning']} rows={UI_FIELD_ROWS} />
              <Callout variant="info" className="mt-6">
                <strong className="text-ink">Job Retry</strong> settings (auto-retries on failed,
                timed-out, or skipped runs) only appear for jobs with a{' '}
                <em className="text-ink">recurring</em> schedule.
              </Callout>
            </Section>

            {/* ---------------- Section 3 — create via API ---------------- */}
            <Section
              id="create-api"
              eyebrow="// create via api"
              title="Create via API"
              intro="The UI is a form over this one endpoint. Everything the New Job dialog can do, this POST body can do."
            >
              <EndpointRow
                method="POST"
                path="/api/v2/projects/{project_id}/jobs"
                sdk="client.create_job(body, project_id)"
              />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="mt-5"
              >
                <CodeBlock
                  maxHeight={520}
                  tabs={[
                    { label: 'curl', code: CURL_CREATE, language: 'shell' },
                    { label: 'Python (cmlapi)', code: PY_CREATE, language: 'python' },
                  ]}
                />
              </motion.div>
              <Callout variant="correction" className="mt-6">
                <code>cmlapi</code> is <strong className="text-ink">not on PyPI</strong> —{' '}
                <code>pip install cmlapi</code> does not work. Install the official Python client
                from your own workspace:{' '}
                <code>pip3 install https://&lt;workbench-domain&gt;/api/v2/python.tar.gz</code>
              </Callout>
            </Section>

            {/* ---------------- Section 4 — field reference ---------------- */}
            <Section
              id="fields"
              eyebrow="// createjobrequest spec"
              title="CreateJobRequest field reference"
              intro="Every field of the request body, straight from the REST API v2 reference. Filter by name or description."
            >
              <FieldReference />

              <div className="mt-10">
                <h3 className="font-display text-[18px] font-semibold text-ink">
                  The returned <code className="text-[15px]">Job</code> object
                </h3>
                <p className="mt-2 text-[14px] text-body">
                  A successful <code>create_job</code> returns the persisted job, including
                  derived fields like <code>english_schedule</code> and <code>type</code>.
                </p>
                <div className="mt-4 grid gap-x-8 gap-y-1.5 rounded-[10px] border border-line bg-raised p-5 font-mono text-[12.5px] text-body sm:grid-cols-2">
                  {JOB_OBJECT_FIELDS.map((f) => (
                    <span key={f} className="truncate">
                      <span className="text-dim">·</span> {f}
                    </span>
                  ))}
                </div>
              </div>
            </Section>

            {/* ---------------- Section 5 — scheduling ---------------- */}
            <Section
              id="scheduling"
              eyebrow="// scheduling"
              title="Scheduling"
              intro="Three mutually exclusive modes per job. Recurring jobs get Job Retry; dependent jobs get pipelines."
            >
              <div className="grid gap-4 sm:grid-cols-3">
                {SCHEDULE_CARDS.map((c, i) => {
                  const Icon = c.icon;
                  const inner = (
                    <>
                      <div className="flex items-center justify-between">
                        <Icon size={18} className="text-accent" />
                        {c.href && (
                          <ArrowUpRight
                            size={15}
                            className="text-dim transition-colors group-hover:text-accent"
                          />
                        )}
                      </div>
                      <p className="mt-3 font-display text-[17px] font-semibold text-ink">
                        {c.title}
                      </p>
                      <p className="mt-2 text-[13.5px] leading-relaxed text-body">{c.body}</p>
                    </>
                  );
                  const cls =
                    'group flex h-full flex-col rounded-[10px] border border-line bg-raised p-5 text-left transition-colors hover:border-line-bright';
                  return (
                    <motion.div
                      key={c.title}
                      initial={{ opacity: 0, y: 18 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: '-10% 0px' }}
                      transition={{ duration: 0.45, delay: i * 0.08, ease: EASE_OUT }}
                      whileHover={{ y: -3 }}
                    >
                      {c.href ? (
                        <Link to={c.href} className={cls}>
                          {inner}
                        </Link>
                      ) : (
                        <button type="button" onClick={() => scrollToId(c.target!)} className={cls}>
                          {inner}
                        </button>
                      )}
                    </motion.div>
                  );
                })}
              </div>

              <div id="cron-builder" className="mt-8 scroll-mt-28">
                <CronBuilder />
              </div>

              <Callout variant="info" className="mt-6">
                Cron is <strong className="text-ink">exactly five fields, always UTC</strong>:
                minute hour day-of-month month day-of-week. Job Retry (auto-retries on
                failed / timed-out / skipped runs) is only available for recurring jobs.
              </Callout>

              <div className="mt-10">
                <h3 className="font-display text-[18px] font-semibold text-ink">
                  Per-run overrides
                </h3>
                <p className="mt-2 max-w-[720px] text-[14px] leading-relaxed text-body">
                  <code>CreateJobRunRequest</code> accepts per-run <code>environment</code> and{' '}
                  <code>arguments</code> — one scheduled definition, ad-hoc parameterized
                  backfills.
                </p>
                <CodeBlock className="mt-4" code={CURL_TRIGGER} language="shell" filename="trigger.sh" />
              </div>
            </Section>

            {/* ---------------- Section 6 — run lifecycle ---------------- */}
            <Section
              id="lifecycle"
              eyebrow="// run lifecycle"
              title="Run lifecycle"
              intro="Every run walks the engine stages below. Transitional states pulse; terminal states are where your polling loop exits."
            >
              <RunStateMachine />

              <div className="mt-10">
                <h3 className="font-display text-[18px] font-semibold text-ink">
                  The <code className="text-[15px]">JobRun</code> object
                </h3>
                <div className="mt-4 grid gap-x-8 gap-y-1.5 rounded-[10px] border border-line bg-raised p-5 font-mono text-[12.5px] text-body sm:grid-cols-2">
                  {JOBRUN_FIELDS.map((f) => (
                    <span key={f}>
                      <span className="text-dim">·</span> {f}
                    </span>
                  ))}
                </div>
                <Callout variant="tip" className="mt-6">
                  Resource/kernel fields on a run are{' '}
                  <strong className="text-ink">snapshotted at run start</strong> — editing the job
                  later doesn't rewrite history.
                </Callout>
              </div>
            </Section>

            {/* ---------------- Section 7 — monitoring ---------------- */}
            <Section
              id="monitoring"
              eyebrow="// monitoring & logs"
              title="Monitoring, logs, and alerts"
              intro={
                <>
                  UI: <strong className="text-ink">Job → History tab</strong> lists every run
                  (creator, duration, status); clicking a run shows its session output
                  (stdout/stderr). API:{' '}
                  <code>list_job_runs(project_id, job_id, sort="-created_at", page_size=1)</code>{' '}
                  for the latest, <code>get_job_run</code> for one, <code>stop_job_run</code> to
                  kill it.
                </>
              }
            >
              <LogViewerMock />
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="mt-5"
              >
                <CodeBlock code={PY_POLL} language="python" filename="poll_status.py" />
              </motion.div>
              <p className="mt-6 max-w-[720px] text-[15px] leading-relaxed text-body">
                Files written under <code>/home/cdsw/</code> persist in the project; paths in{' '}
                <code>attachments</code> ride along on the job-report email. Recipients can be
                notified per event: success / failure / timeout / stop.
              </p>
            </Section>

            {/* ---------------- Section 8 — code ---------------- */}
            <Section
              id="code"
              eyebrow="// full working code"
              title="Create → run → poll → clean up"
              intro="The complete lifecycle in one script. Mirrors Cloudera's official API v2 examples; every call above in a single flow."
            >
              <CodeBlock
                maxHeight={520}
                tabs={[
                  { label: 'Python (cmlapi) — full flow', code: PY_FULL, language: 'python' },
                  { label: 'curl — trigger & manage', code: CURL_MANAGE, language: 'shell' },
                ]}
              />
            </Section>
          </article>
        </div>
      </div>

      {/* ---------------- Section 9 — cheat sheet (full-width band) ---------------- */}
      <section id="cheatsheet" className="scroll-mt-24 border-y border-line bg-raised">
        <div className="mx-auto max-w-content px-5 py-16 lg:px-8 lg:py-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.4 }}
            className="font-mono text-[12px] font-semibold uppercase tracking-[0.14em] text-accent"
          >
            {'// quick reference'}
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.45, delay: 0.06, ease: EASE_OUT }}
            className="mt-3 font-display text-[28px] font-semibold text-ink sm:text-[32px]"
          >
            Cheat sheet
          </motion.h2>

          <div className="mt-8 grid gap-10 lg:grid-cols-2">
            <DataTable columns={['Concept', 'Where']} rows={CHEAT_ROWS} />
            <div>
              <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
                Endpoint quicklist — click to copy
              </p>
              <motion.div
                initial="hidden"
                whileInView="show"
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ staggerChildren: 0.04 }}
                className="grid gap-2"
              >
                {ENDPOINTS.map((e) => (
                  <motion.div
                    key={`${e.method}-${e.path}`}
                    variants={{
                      hidden: { opacity: 0, y: 10 },
                      show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
                    }}
                  >
                    <EndpointRow method={e.method} path={e.path} sdk={e.sdk} />
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
