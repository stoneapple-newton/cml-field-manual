import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Play, X } from 'lucide-react';
import Callout from '@/components/Callout';
import CodeBlock from '@/components/CodeBlock';
import { MutexBadge } from '@/components/DataTable';
import DocsSidebar from '@/components/DocsSidebar';
import type { DocsSection } from '@/components/DocsSidebar';
import PipelineDiagram from '@/components/PipelineDiagram';
import StatusPill from '@/components/StatusPill';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const SECTIONS: DocsSection[] = [
  { id: 'correction', label: 'the correction' },
  { id: 'tiers', label: 'three tiers' },
  { id: 'native', label: 'native pipelines' },
  { id: 'pipeline-code', label: 'pipeline code' },
  { id: 'in-the-ui', label: 'in the UI' },
  { id: 'decision', label: 'dependencies vs airflow' },
  { id: 'cde-airflow', label: 'airflow via CDE' },
  { id: 'self-hosted', label: 'self-hosted airflow' },
];

/* ------------------------------- headings ------------------------------- */

function WordRise({ text, className }: { text: string; className?: string }) {
  return (
    <span className={cn('inline-block', className)}>
      {text.split(' ').map((w, i) => (
        <span key={i} className="inline-block overflow-hidden whitespace-pre pb-1 align-bottom">
          <motion.span
            className="inline-block whitespace-pre"
            initial={{ y: 26, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ delay: i * 0.04, duration: 0.5, ease: EASE_OUT }}
          >
            {w}
            {i < text.split(' ').length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

function TierChip({ n, color = 'accent' }: { n: string; color?: 'accent' | 'purple' }) {
  return (
    <span
      className={cn(
        'ml-3 inline-flex translate-y-[-2px] items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-[0.1em]',
        color === 'accent' ? 'border-accent/50 text-accent' : 'border-purple/50 text-purple',
      )}
    >
      {n}
    </span>
  );
}

function SectionHead({
  eyebrow,
  title,
  tier,
  tierColor,
  children,
}: {
  eyebrow: string;
  title: string;
  tier?: string;
  tierColor?: 'accent' | 'purple';
  children?: ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-4xl">
        <WordRise text={title} />
        {tier && <TierChip n={tier} color={tierColor} />}
      </h2>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="mt-4 max-w-[68ch] text-[15.5px] leading-relaxed text-body"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

function Section({
  id,
  className,
  children,
}: {
  id: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className={cn('scroll-mt-28 border-t border-line/60 py-14 md:py-20', className)}>
      {children}
    </section>
  );
}

/* ------------------------------ tier glyphs ----------------------------- */

function TierGlyph({ tier }: { tier: 1 | 2 | 3 }) {
  if (tier === 1) {
    return (
      <svg width="88" height="48" viewBox="0 0 88 48" fill="none" aria-hidden="true">
        <circle cx="44" cy="24" r="5" fill="#22D3A7" fillOpacity="0.2" stroke="#22D3A7" strokeWidth="1.5" />
      </svg>
    );
  }
  if (tier === 2) {
    return (
      <svg width="88" height="48" viewBox="0 0 88 48" fill="none" aria-hidden="true">
        <path d="M20 24 H38 M50 24 H68" stroke="#22D3A7" strokeWidth="1.5" />
        <path d="M35 20 L38 24 L35 28 M65 20 L68 24 L65 28" stroke="#22D3A7" strokeWidth="1.5" fill="none" />
        <circle cx="14" cy="24" r="5" stroke="#22D3A7" strokeWidth="1.5" />
        <circle cx="44" cy="24" r="5" stroke="#22D3A7" strokeWidth="1.5" />
        <circle cx="74" cy="24" r="5" fill="#22D3A7" fillOpacity="0.2" stroke="#22D3A7" strokeWidth="1.5" />
      </svg>
    );
  }
  return (
    <svg width="88" height="48" viewBox="0 0 88 48" fill="none" aria-hidden="true">
      <path d="M16 24 C30 24 30 10 44 10 M16 24 C30 24 30 38 44 38"
        stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <path d="M52 10 C58 10 58 24 66 24 M52 38 C58 38 58 24 66 24 M52 24 H66"
        stroke="#A78BFA" strokeWidth="1.5" fill="none" />
      <circle cx="12" cy="24" r="5" stroke="#A78BFA" strokeWidth="1.5" />
      <circle cx="48" cy="10" r="4" stroke="#A78BFA" strokeWidth="1.5" />
      <circle cx="48" cy="24" r="4" stroke="#A78BFA" strokeWidth="1.5" />
      <circle cx="48" cy="38" r="4" stroke="#A78BFA" strokeWidth="1.5" />
      <circle cx="72" cy="24" r="5" fill="#A78BFA" fillOpacity="0.2" stroke="#A78BFA" strokeWidth="1.5" />
    </svg>
  );
}

/* ------------------------------- tier table ------------------------------ */

const TIERS: {
  tier: 1 | 2 | 3;
  mechanism: ReactNode;
  where: string;
  bestFor: string;
  target: string;
}[] = [
  {
    tier: 1,
    mechanism: (
      <>
        <strong className="text-ink">Single scheduled job</strong> (manual / cron)
      </>
    ),
    where: 'CML project',
    bestFor: 'One-off or periodic script execution',
    target: 'pipeline-code',
  },
  {
    tier: 2,
    mechanism: (
      <>
        <strong className="text-ink">Job dependencies ("pipeline")</strong> —{' '}
        <code>parent_job_id</code> chains
      </>
    ),
    where: 'CML project; dependency graph on Jobs tab',
    bestFor: 'Simple linear A → B → C sequences (ingest → train → deploy)',
    target: 'native',
  },
  {
    tier: 3,
    mechanism: (
      <>
        <strong className="text-ink">Full Airflow DAGs</strong> triggering CML jobs over API v2
      </>
    ),
    where: 'CDE managed Airflow (recommended) or self-hosted CML Application',
    bestFor: 'Branching, retries, SLAs, sensors, cross-service pipelines, CI/CD',
    target: 'cde-airflow',
  },
];

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

function TierTable() {
  const [hovered, setHovered] = useState<1 | 2 | 3>(2);
  return (
    <div className="relative">
      {/* topology preview thumbnail */}
      <div className="pointer-events-none absolute -top-2 right-2 z-10 hidden h-16 w-28 items-center justify-center rounded-[10px] border border-line bg-base/90 md:flex">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={hovered}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <TierGlyph tier={hovered} />
          </motion.div>
        </AnimatePresence>
        <span className="absolute bottom-1 right-2 font-mono text-[9px] uppercase tracking-[0.12em] text-dim">
          tier {hovered}
        </span>
      </div>

      <div className="overflow-x-auto rounded-[10px] border border-line">
        <table className="w-full min-w-[640px] border-collapse text-left text-[14px]">
          <thead>
            <tr className="bg-surface">
              {['tier', 'mechanism', 'where it runs', 'best for'].map((c) => (
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
            {TIERS.map((t) => (
              <motion.tr
                key={t.tier}
                variants={{
                  hidden: { opacity: 0, y: 8 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
                }}
                onClick={() => scrollToId(t.target)}
                onMouseEnter={() => setHovered(t.tier)}
                className="h-11 cursor-pointer border-b border-line/60 transition-colors last:border-b-0 hover:bg-raised"
                title="Jump to this tier"
              >
                <td className="px-4 py-2.5 align-middle font-mono text-[13px] font-bold text-accent">
                  {t.tier}
                </td>
                <td className="px-4 py-2.5 align-middle text-body">{t.mechanism}</td>
                <td className="px-4 py-2.5 align-middle text-body">{t.where}</td>
                <td className="px-4 py-2.5 align-middle text-body">{t.bestFor}</td>
              </motion.tr>
            ))}
          </motion.tbody>
        </table>
      </div>
      <p className="mt-3 font-mono text-[12px] text-dim">
        // click a row to jump to that tier's section
      </p>
    </div>
  );
}

/* --------------------------- pipeline simulator -------------------------- */

const SIM_NODE_W = 150;
const SIM_NODE_H = 52;
const SIM_W = 860;
const SIM_H = 250;

type SimStatus = 'IDLE' | 'ENGINE_SCHEDULING' | 'ENGINE_RUNNING' | 'ENGINE_SUCCEEDED';

const SIM_STATUS_COLOR: Record<SimStatus, { color: string; pulse: boolean }> = {
  IDLE: { color: '#7C8A9A', pulse: false },
  ENGINE_SCHEDULING: { color: '#F5A524', pulse: true },
  ENGINE_RUNNING: { color: '#5BA8F5', pulse: true },
  ENGINE_SUCCEEDED: { color: '#22D3A7', pulse: false },
};

interface SimNode {
  id: string;
  label: string;
  spec: string;
  x: number;
  y: number;
  detail: Record<string, unknown>;
}

const RUNTIME_IMG =
  'docker.repository.cloudera.com/cloudera/cdsw/ml-runtime-workbench-python3.10-standard:2024.02.1-b4';

const SIM_NODES: SimNode[] = [
  {
    id: 'ingest',
    label: '01-ingest',
    spec: '2 vCPU · 4 GB',
    x: 30,
    y: 70,
    detail: {
      name: '01-ingest',
      script: 'pipelines/ingest.py',
      kernel: 'python3',
      cpu: 2,
      memory: 4,
      runtime_identifier: RUNTIME_IMG,
      environment: { PIPELINE_NAME: 'ingest-train-deploy' },
      schedule: '0 6 * * *',
    },
  },
  {
    id: 'train',
    label: '02-train',
    spec: '4 vCPU · 16 GB',
    x: 355,
    y: 70,
    detail: {
      name: '02-train',
      script: 'pipelines/train.py',
      kernel: 'python3',
      cpu: 4,
      memory: 16,
      runtime_identifier: RUNTIME_IMG,
      environment: { PIPELINE_NAME: 'ingest-train-deploy' },
      parent_job_id: '<id of 01-ingest>',
    },
  },
  {
    id: 'deploy',
    label: '03-deploy',
    spec: '2 vCPU · 4 GB',
    x: 680,
    y: 70,
    detail: {
      name: '03-deploy',
      script: 'pipelines/deploy_model.py',
      kernel: 'python3',
      cpu: 2,
      memory: 4,
      runtime_identifier: RUNTIME_IMG,
      environment: { PIPELINE_NAME: 'ingest-train-deploy' },
      parent_job_id: '<id of 02-train>',
    },
  },
];

const SIM_EDGES: [string, string][] = [
  ['ingest', 'train'],
  ['train', 'deploy'],
];

function simEdgePath(x1: number, y1: number, x2: number, y2: number) {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function PipelineSimulator() {
  const [statuses, setStatuses] = useState<SimStatus[]>(['IDLE', 'IDLE', 'IDLE']);
  const [litEdges, setLitEdges] = useState<boolean[]>([false, false]);
  const [running, setRunning] = useState(false);
  const [selected, setSelected] = useState<SimNode | null>(null);
  const timers = useRef<number[]>([]);

  useEffect(() => () => timers.current.forEach((t) => window.clearTimeout(t)), []);

  const setStatus = (i: number, s: SimStatus) =>
    setStatuses((prev) => prev.map((v, j) => (j === i ? s : v)));

  const STEP = 1200; // 1.2s per node per state

  const trigger = () => {
    if (running) return;
    setRunning(true);
    setStatuses(['IDLE', 'IDLE', 'IDLE']);
    setLitEdges([false, false]);
    SIM_NODES.forEach((_, i) => {
      const base = i * 3 * STEP;
      timers.current.push(
        window.setTimeout(() => {
          setStatus(i, 'ENGINE_SCHEDULING');
          if (i > 0) setLitEdges((prev) => prev.map((v, j) => (j === i - 1 ? true : v)));
        }, base),
      );
      timers.current.push(window.setTimeout(() => setStatus(i, 'ENGINE_RUNNING'), base + STEP));
      timers.current.push(
        window.setTimeout(() => setStatus(i, 'ENGINE_SUCCEEDED'), base + 2 * STEP),
      );
    });
    // hold the completed graph, then reset
    timers.current.push(
      window.setTimeout(() => {
        setStatuses(['IDLE', 'IDLE', 'IDLE']);
        setLitEdges([false, false]);
        setRunning(false);
      }, SIM_NODES.length * 3 * STEP + 2800),
    );
  };

  const byId = new Map(SIM_NODES.map((n) => [n.id, n]));

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="rounded-[10px] border border-line bg-raised p-4 md:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="font-mono text-[12px] text-dim">
          dependency graph · <span className="text-ink">ingest-train-deploy</span>
        </p>
        <button
          type="button"
          onClick={trigger}
          disabled={running}
          className={cn(
            'inline-flex items-center gap-2 rounded-[10px] border px-4 py-2 font-mono text-[12px] font-medium transition-all',
            running
              ? 'cursor-wait border-line text-dim'
              : 'border-accent/60 text-accent hover:bg-accent-dim hover:shadow-glow',
          )}
        >
          <Play size={13} className={running ? 'animate-pulse' : ''} />
          {running ? 'pipeline running…' : 'Trigger head'}
        </button>
      </div>

      <div className="relative mt-3">
        <svg viewBox={`0 0 ${SIM_W} ${SIM_H}`} className="w-full" role="img" aria-label="Interactive pipeline simulation">
          <defs>
            <marker
              id="sim-arrow"
              viewBox="0 0 10 10"
              refX="9"
              refY="5"
              markerWidth="7"
              markerHeight="7"
              orient="auto-start-reverse"
            >
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#22D3A7" />
            </marker>
          </defs>

          {SIM_EDGES.map(([from, to], i) => {
            const a = byId.get(from)!;
            const b = byId.get(to)!;
            const d = simEdgePath(a.x + SIM_NODE_W, a.y + SIM_NODE_H / 2, b.x, b.y + SIM_NODE_H / 2);
            return (
              <g key={`${from}-${to}`}>
                <motion.path
                  d={d}
                  fill="none"
                  stroke={litEdges[i] ? '#22D3A7' : '#2E4053'}
                  strokeWidth={litEdges[i] ? 2.2 : 1.4}
                  strokeOpacity={litEdges[i] ? 1 : 0.7}
                  markerEnd="url(#sim-arrow)"
                  style={{ transition: 'stroke 0.35s, stroke-width 0.35s' }}
                  initial={{ pathLength: 0 }}
                  whileInView={{ pathLength: 1 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ duration: 0.7, delay: 0.25 + i * 0.18, ease: 'easeOut' }}
                />
                {/* trigger packet travelling along a lit edge */}
                {litEdges[i] && running && (
                  <circle r="3" fill="#22D3A7">
                    <animateMotion dur="0.9s" repeatCount="indefinite" path={d} />
                  </circle>
                )}
              </g>
            );
          })}

          {SIM_NODES.map((n, i) => {
            const st = SIM_STATUS_COLOR[statuses[i]];
            const pillText = statuses[i];
            const pillW = pillText.length * 6.4 + 26;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x}, ${n.y})`}
                style={{ cursor: 'pointer' }}
                onClick={() => setSelected(n)}
              >
                <rect
                  width={SIM_NODE_W}
                  height={SIM_NODE_H}
                  rx={10}
                  fill="#10161E"
                  stroke={statuses[i] === 'IDLE' ? '#1F2B38' : st.color}
                  strokeWidth={statuses[i] === 'IDLE' ? 1 : 1.6}
                  style={{ transition: 'stroke 0.3s' }}
                />
                <text
                  x={SIM_NODE_W / 2}
                  y={22}
                  textAnchor="middle"
                  fill="#E6EDF3"
                  fontSize={13}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight={500}
                >
                  {n.label}
                </text>
                <text
                  x={SIM_NODE_W / 2}
                  y={39}
                  textAnchor="middle"
                  fill="#7C8A9A"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {n.spec}
                </text>
                {/* status pill under the node */}
                <g transform={`translate(${SIM_NODE_W / 2 - pillW / 2}, ${SIM_NODE_H + 12})`}>
                  <rect
                    width={pillW}
                    height={22}
                    rx={11}
                    fill="#161F2A"
                    stroke="#1F2B38"
                    strokeWidth={1}
                  />
                  <circle cx={13} cy={11} r={3.5} fill={st.color}>
                    {st.pulse && (
                      <animate attributeName="opacity" values="1;0.35;1" dur="1.4s" repeatCount="indefinite" />
                    )}
                  </circle>
                  <text
                    x={22}
                    y={15}
                    fill={st.color}
                    fontSize={10}
                    fontFamily="'JetBrains Mono', monospace"
                  >
                    {pillText}
                  </text>
                </g>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-line/60 pt-3">
        <span className="font-mono text-[11px] text-dim">// click a node for its CreateJobRequest JSON</span>
        <span className="flex items-center gap-2 font-mono text-[11px] text-dim">
          <StatusPill status="ENGINE_SCHEDULING" className="!px-2 !py-0.5 !text-[10px]" />
          <ArrowRight size={11} />
          <StatusPill status="ENGINE_RUNNING" className="!px-2 !py-0.5 !text-[10px]" />
          <ArrowRight size={11} />
          <StatusPill status="ENGINE_SUCCEEDED" className="!px-2 !py-0.5 !text-[10px]" />
        </span>
      </div>

      {/* detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-base/80 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-lg overflow-hidden rounded-[10px] border border-line-bright bg-code"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Job detail: ${selected.label}`}
            >
              <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
                <span className="font-mono text-[12px] text-dim">
                  CreateJobRequest · <span className="text-accent">{selected.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded p-1 text-dim hover:text-ink"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <pre className="max-h-[60vh] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-body">
                {JSON.stringify(selected.detail, null, 2)}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ------------------------------ jobs tab mock ---------------------------- */

const MOCK_JOBS = [
  { name: '01-ingest', chip: 'cron · 0 6 * * *', status: 'ENGINE_SUCCEEDED', spec: '2 vCPU · 4 GB' },
  { name: '02-train', chip: 'dependent → 01-ingest', status: 'ENGINE_SUCCEEDED', spec: '4 vCPU · 16 GB', dep: true },
  { name: '03-deploy', chip: 'dependent → 02-train', status: 'ENGINE_RUNNING', spec: '2 vCPU · 4 GB', dep: true },
];

function JobsTabMock() {
  return (
    <motion.div
      initial={{ opacity: 0, x: 40 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
      className="overflow-hidden rounded-[10px] border border-line bg-raised"
    >
      {/* browser chrome */}
      <div className="flex h-9 items-center gap-3 border-b border-line bg-surface px-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
        </span>
        <span className="truncate rounded-md border border-line bg-base px-2.5 py-0.5 font-mono text-[11px] text-dim">
          ml-xxxx.a465-9q4k.cloudera.site<span className="text-body">/projects/churn-project/</span>
          <span className="text-accent">jobs</span>
        </span>
      </div>

      {/* jobs list */}
      <div className="p-4">
        <div className="mb-3 flex items-center justify-between">
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.1em] text-dim">
            Jobs
          </span>
          <span className="rounded-md border border-line bg-surface px-2.5 py-1 font-mono text-[11px] text-dim">
            + New Job
          </span>
        </div>
        <ul className="divide-y divide-line/60 rounded-[10px] border border-line">
          {MOCK_JOBS.map((j) => (
            <li key={j.name} className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3">
              <span className="font-mono text-[13px] font-medium text-ink">{j.name}</span>
              <span
                className={cn(
                  'rounded border px-1.5 py-px font-mono text-[10px]',
                  j.dep
                    ? 'border-accent/50 bg-accent-dim/50 text-accent'
                    : 'border-line text-dim',
                )}
              >
                {j.chip}
              </span>
              <span className="font-mono text-[11px] text-dim">{j.spec}</span>
              <span className="ml-auto">
                <StatusPill status={j.status} />
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 font-mono text-[11px] text-dim">
          job detail tabs: <span className="text-body">Overview</span> ·{' '}
          <span className="text-body">History</span> · <span className="text-body">Settings</span>
          {'  '}(retried runs carry a <span className="text-amber">Retry</span> tag)
        </p>
      </div>

      {/* dependency graph strip */}
      <div className="border-t border-line bg-base/60 p-4">
        <p className="mb-2 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
          dependency graph — rendered on the Jobs tab, not a separate "Workflows" tab
        </p>
        <PipelineDiagram
          width={560}
          height={100}
          animated={false}
          nodes={[
            { id: 'ingest', label: '01-ingest', x: 10, y: 24 },
            { id: 'train', label: '02-train', x: 205, y: 24 },
            { id: 'deploy', label: '03-deploy', x: 400, y: 24 },
          ]}
          edges={[
            { from: 'ingest', to: 'train' },
            { from: 'train', to: 'deploy' },
          ]}
        />
      </div>
    </motion.div>
  );
}

/* ---------------------------- decision panels ---------------------------- */

const NATIVE_WHEN = [
  'Linear A → B → C chain within one project',
  '"Run B only if A succeeded" is the only rule',
  'Cron scheduling of the chain head is enough',
  'Only CML jobs involved',
  'Data scientists self-serve in the UI',
  'Email reports on success/failure suffice',
];

const AIRFLOW_WHEN = [
  'Branching / conditional logic, fan-in/fan-out, loops, dynamic task mapping',
  'Sensors, SLAs, backfill/catchup, retries with backoff, XCom data passing',
  'Complex or calendar/data-aware schedules',
  'Cross-service pipelines: Spark (CDE), Hive/Impala (CDW), CML jobs/models, shell, external HTTP',
  'Pipelines-as-code: Git-reviewed DAG files, CI/CD managed',
  'Centralized Airflow UI, logs, retries, alerting integrations',
];

function ComparePanels() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <motion.div
        initial={{ opacity: 0, x: -24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
        className="rounded-[10px] border border-line bg-raised p-6"
      >
        <h3 className="font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-accent">
          Use native pipelines when…
        </h3>
        <ul className="mt-4 space-y-3">
          {NATIVE_WHEN.map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
              className="flex gap-2.5 text-[14.5px] leading-relaxed text-body"
            >
              <Check size={15} className="mt-1 shrink-0 text-accent" />
              {t}
            </motion.li>
          ))}
        </ul>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: 24 }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.55, ease: EASE_OUT }}
        className="rounded-[10px] border border-line bg-raised p-6"
      >
        <h3 className="font-mono text-[13px] font-semibold uppercase tracking-[0.1em] text-purple">
          Use Airflow DAGs via CDE when…
        </h3>
        <ul className="mt-4 space-y-3">
          {AIRFLOW_WHEN.map((t, i) => (
            <motion.li
              key={t}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.35 }}
              className="flex gap-2.5 text-[14.5px] leading-relaxed text-body"
            >
              <Check size={15} className="mt-1 shrink-0 text-purple" />
              {t}
            </motion.li>
          ))}
        </ul>
      </motion.div>
    </div>
  );
}

/* ------------------------------ code blocks ------------------------------ */

const CREATE_PIPELINE_PY = `"""Creates a 3-step native CML pipeline: ingest -> train -> deploy_model.
Each job runs only after the previous job's run succeeds."""
import cmlapi

client = cmlapi.default_client(url="https://ml-xyz.env.cloudera.site",
                               cml_api_key="<API_KEY>")
PROJECT_ID = "<project-id>"
RUNTIME = ("docker.repository.cloudera.com/cloudera/cdsw/"
           "ml-runtime-workbench-python3.10-standard:2024.02.1-b4")

def make_job(name, script, parent_id=None, schedule=None, cpu=2, memory=4):
    body = cmlapi.CreateJobRequest(
        name=name, script=script, kernel="python3",
        cpu=cpu, memory=memory, runtime_identifier=RUNTIME,
        environment={"PIPELINE_NAME": "ingest-train-deploy"},
    )
    if parent_id:
        body.parent_job_id = parent_id          # dependent job
    elif schedule:
        body.schedule = schedule                # cron, e.g. "0 6 * * *"
    return client.create_job(body, project_id=PROJECT_ID)

ingest = make_job("01-ingest", "pipelines/ingest.py",
                  schedule="0 6 * * *")                  # daily head of pipeline
train  = make_job("02-train",  "pipelines/train.py",
                  parent_id=ingest.id, cpu=4, memory=16) # runs after ingest succeeds
deploy = make_job("03-deploy", "pipelines/deploy_model.py",
                  parent_id=train.id)                    # runs after train succeeds

# Kick off the head of the pipeline; the rest chain automatically:
client.create_job_run(cmlapi.CreateJobRunRequest(),
                      project_id=PROJECT_ID, job_id=ingest.id)
`;

const CML_OPERATOR_PY = `from airflow.exceptions import AirflowException
from airflow.models.baseoperator import BaseOperator
from airflow.hooks.http_hook import HttpHook   # Airflow 2: airflow.providers.http.hooks.http
import time

class CMLJobRunOperator(BaseOperator):

    def __init__(self, project: str, job: str, **kwargs) -> None:
        super().__init__(**kwargs)
        self.project = project
        self.job = job

    def execute(self, context):
        job_label = '({}/{})'.format(self.project, self.job)
        get_hook  = HttpHook(http_conn_id='cml_rest_api', method='GET')
        post_hook = HttpHook(http_conn_id='cml_rest_api', method='POST')

        projects_url = 'api/v2/projects'
        r = get_hook.run(endpoint=projects_url)
        projects = {p['name']: p['id'] for p in r.json()['projects']} if r.ok else None

        if projects and self.project in projects.keys():
            jobs_url = '{}/{}/jobs'.format(projects_url, projects[self.project])
            r = get_hook.run(endpoint=jobs_url)
            jobs = {j['name']: j['id'] for j in r.json()['jobs']} if r.ok else None

            if jobs and self.job in jobs.keys():
                runs_url = '{}/{}/runs'.format(jobs_url, jobs[self.job])
                r = post_hook.run(endpoint=runs_url)
                run = r.json() if r.ok else None
                if run:
                    status = run['status']
                    RUNNING_STATES = ['ENGINE_SCHEDULING', 'ENGINE_STARTING', 'ENGINE_RUNNING']
                    SUCCESS_STATES = ['ENGINE_SUCCEEDED']
                    POLL_INTERVAL = 10
                    while status and status in RUNNING_STATES:
                        r = get_hook.run(endpoint='{}/{}'.format(runs_url, run['id']))
                        status = r.json()['status'] if r.ok else None
                        time.sleep(POLL_INTERVAL)
                    if status not in SUCCESS_STATES:
                        raise AirflowException('Error while waiting for CML job (%s) to complete' % job_label)
                else:
                    raise AirflowException('Problem triggering CML job (%s)' % job_label)
            else:
                raise AirflowException('Problem finding the CML job ID (%s)' % self.job)
        else:
            raise AirflowException('Problem finding the CML project ID (%s)' % self.project)
`;

const CML_DAG_PY = `"""Airflow DAG (deploy to CDE as an --type airflow job) that chains:
ingest -> train -> deploy, by triggering pre-existing CML jobs by name.
Requires an Airflow HTTP connection 'cml_rest_api' (Host=<CML host>,
Schema=https, Extra={"authorization": "Bearer <CML_API_KEY>"})."""
from datetime import datetime, timedelta
from airflow import DAG
from airflow.operators.empty import EmptyOperator   # Airflow >=2: 'empty'; older: dummy_operator

# --- paste the CMLJobRunOperator class from cml_operator.py here ---
from cml_operator_inline import CMLJobRunOperator   # or inline the class

default_args = {
    "owner": "mlops",
    "retry_delay": timedelta(minutes=2),
    "retries": 1,
    "depends_on_past": False,
    "start_date": datetime(2024, 1, 1),
    "email_on_failure": False,
}

dag = DAG(
    "cml_ingest_train_deploy",
    default_args=default_args,
    schedule_interval="@daily",     # 'schedule' on Airflow >= 2.4
    catchup=False,
    is_paused_upon_creation=False,
)

start = EmptyOperator(task_id="start", dag=dag)

ingest = CMLJobRunOperator(task_id="ingest_data",
                           project="churn-project", job="01-ingest", dag=dag)
train  = CMLJobRunOperator(task_id="train_model",
                           project="churn-project", job="02-train", dag=dag)
deploy = CMLJobRunOperator(task_id="deploy_model",
                           project="churn-project", job="03-deploy", dag=dag)

end = EmptyOperator(task_id="end", dag=dag)

start >> ingest >> train >> deploy >> end
`;

const CDE_DEPLOY_SH = `cde resource create --name cml-operator-resource
cde resource upload --name cml-operator-resource --local-path ./cml_pipeline_dag.py
cde job create --name cml-pipeline --type airflow \\
  --mount-1-resource cml-operator-resource --dag-file cml_pipeline_dag.py
`;

const SELF_HOSTED_SH = `# install.sh — one-time
export AIRFLOW_HOME=~/airflow
pip3 install apache-airflow
airflow initdb        # Airflow 2.x: airflow db init

# start.sh — run as a long-lived CML Application
PORT=\${CDSW_APP_PORT:-8090}
export AIRFLOW_HOME=~/airflow
airflow webserver -p $PORT -hn 127.0.0.1
airflow scheduler
`;

/* --------------------------------- page --------------------------------- */

export default function Workflows() {
  return (
    <div className="mx-auto max-w-content px-5 lg:px-8">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <DocsSidebar sections={SECTIONS} className="pt-14" />

        <article className="min-w-0 max-w-[880px] pb-24">
          {/* ================= Section 1 — header + correction ================= */}
          <header className="pt-14 md:pt-20">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
            >
              {'// 03 — PIPELINES'}
            </motion.p>
            <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-ink md:text-[56px]">
              <WordRise text="Workflows are jobs with parents." />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT }}
              className="mt-5 max-w-[62ch] text-lg leading-relaxed text-body"
            >
              You asked how to set up a workflow. The honest answer has two parts — and the
              first is a correction.
            </motion.p>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="mt-8"
              id="correction"
            >
              <div className="scroll-mt-28">
                <Callout variant="correction" className="text-base">
                  <strong className="text-ink">
                    CML does not ship an embedded Apache Airflow instance, and there is no
                    &ldquo;Workflows&rdquo; tab.
                  </strong>{' '}
                  Native orchestration is the Jobs + Pipelines system: linear chains of dependent
                  jobs rendered as a dependency graph on the project&rsquo;s Jobs tab. Full DAG
                  orchestration runs <em>outside</em> CML — usually in Cloudera Data Engineering
                  (CDE), which embeds a managed Airflow per Virtual Cluster — or self-hosted as a
                  CML Application. Both patterns are on this page.
                </Callout>
              </div>
            </motion.div>
          </header>

          {/* ===================== Section 2 — three tiers ===================== */}
          <Section id="tiers">
            <SectionHead eyebrow="// THREE TIERS" title="Three tiers of orchestration">
              <p>
                &ldquo;Workflow&rdquo; on CML can mean three different things. Pick the lowest tier
                that solves the problem — each one builds on the same Jobs API.
              </p>
            </SectionHead>
            <div className="mt-8">
              <TierTable />
            </div>
          </Section>

          {/* ================== Section 3 — native pipelines =================== */}
          <Section id="native">
            <SectionHead eyebrow="// NATIVE PIPELINES" title="parent_job_id chains" tier="TIER 2">
              <p>
                A pipeline is multiple jobs run one after another, each dependent on the output of
                the one preceding it. Set <code>parent_job_id</code> on a job — mutually exclusive
                with <code>schedule</code>
                <MutexBadge /> — and it fires only after the parent&rsquo;s run reaches{' '}
                <code>ENGINE_SUCCEEDED</code>. If the parent fails, the dependent never runs. No
                branching, no run-on-failure, no fan-in/fan-out.
              </p>
            </SectionHead>

            <div className="mt-8">
              <PipelineSimulator />
            </div>

            <ul className="mt-8 space-y-2.5">
              {[
                <>
                  Dependencies can be added <strong className="text-ink">after</strong> creation —
                  job <strong className="text-ink">Settings → Schedule → Dependent</strong> — so
                  pipelines can be retrofitted onto existing jobs.
                </>,
                <>
                  All jobs in a pipeline must live in the{' '}
                  <strong className="text-ink">same project</strong>; scripts and dependencies must
                  be project files.
                </>,
                <>
                  A dependent job fires <strong className="text-ink">only on success</strong> of the
                  parent — there is no branching, no &ldquo;run-on-failure&rdquo;, no fan-in/fan-out
                  semantics beyond simple chaining.
                </>,
                <>
                  <strong className="text-ink">Job Retry</strong> (newer Cloudera AI versions)
                  retries <code>failed</code>, <code>timed-out</code>, or <code>skipped</code> runs —
                  configurable per job (Maximum Retry, Retry Delay, Retry Conditions). Retried runs
                  are tagged in the History view.
                </>,
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="flex gap-3 text-[15px] leading-relaxed text-body"
                >
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>
          </Section>

          {/* ==================== Section 4 — pipeline code ==================== */}
          <Section id="pipeline-code">
            <SectionHead
              eyebrow="// PIPELINE CODE"
              title="Build it with the SDK"
              tier="TIER 1 + 2"
            >
              <p>
                One helper, three jobs. The head gets a cron <code>schedule</code> (tier 1); each
                dependent sets <code>parent_job_id</code> (tier 2). Kick the head off manually and
                the rest of the chain fires automatically.
              </p>
            </SectionHead>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-8"
            >
              <CodeBlock
                code={CREATE_PIPELINE_PY}
                language="python"
                filename="create_pipeline.py"
                maxHeight={520}
              />
            </motion.div>

            <div className="mt-6">
              <Callout variant="tip">
                Trigger the head manually as above for testing; give it a <code>schedule</code> for
                production. The dependents fire automatically either way.
              </Callout>
            </div>

            <Link
              to="/walkthrough#step-4"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[12px] text-body transition-colors hover:border-accent hover:text-accent"
            >
              What does <code>deploy_model.py</code> do?
              <ArrowRight size={13} />
              /walkthrough#step-4
            </Link>
          </Section>

          {/* ===================== Section 5 — in the UI ======================= */}
          <Section id="in-the-ui">
            <SectionHead eyebrow="// IN THE UI" title="How pipelines appear in CML">
              <p>
                The Jobs overview presents a list of all existing jobs created for a project along
                with a dependency graph to display any pipelines you&rsquo;ve created. There is no
                separate Workflows tab — the pipeline view lives under Jobs.
              </p>
            </SectionHead>

            <div className="mt-8">
              <JobsTabMock />
            </div>

            <ul className="mt-8 space-y-2.5">
              {[
                <>
                  <strong className="text-ink">Job detail page</strong> tabs: Overview | History |
                  Settings — History shows every run with creator, start/end time, duration, and
                  status; clicking a run shows the engine output logs.
                </>,
                <>
                  <strong className="text-ink">Triggering:</strong> the Run button, the cron
                  schedule, a dependency firing, or API v2 (<code>create_job_run</code>). Jobs can
                  also run as a service account (&ldquo;Run Job as&rdquo;).
                </>,
                <>
                  <strong className="text-ink">Notifications:</strong> per-job Job Report Recipients
                  get emails on success/failure/timeout, with optional attachments (e.g. console
                  logs).
                </>,
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="flex gap-3 text-[15px] leading-relaxed text-body"
                >
                  <span className="mt-[9px] h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  <span>{item}</span>
                </motion.li>
              ))}
            </ul>

            <div className="mt-6">
              <Callout variant="info">
                Triggered from CDE Airflow, a run appears twice: the CDE Job Runs page (with an
                Airflow UI tab showing the DAG graph) and the CML job&rsquo;s History tab.
              </Callout>
            </div>
          </Section>

          {/* ==================== Section 6 — decision guide =================== */}
          <Section id="decision">
            <SectionHead eyebrow="// DECISION GUIDE" title="Dependencies vs Airflow">
              <p>
                The line is complexity: the moment you need branching, retries with backoff, or
                anything outside one CML project, you&rsquo;ve outgrown job dependencies.
              </p>
            </SectionHead>
            <div className="mt-8">
              <ComparePanels />
            </div>
            <div className="mt-6">
              <Callout variant="tip">
                The two compose: a common pattern is an outer CDE Airflow DAG that triggers a CML
                dependent-job pipeline as one unit — CDE Spark ETL → CML pipeline → CDW reporting.
              </Callout>
            </div>
          </Section>

          {/* =================== Section 7 — Airflow via CDE =================== */}
          <Section id="cde-airflow">
            <SectionHead
              eyebrow="// AIRFLOW VIA CDE"
              title="The full DAG path"
              tier="TIER 3"
              tierColor="purple"
            >
              <p>
                Every <strong className="text-ink">CDE Virtual Cluster embeds a managed Apache
                Airflow</strong> — no admin maintenance. Deploy a DAG as a CDE job of{' '}
                <code>--type airflow</code>. CML jobs are triggered with the community{' '}
                <code>CMLJobRunOperator</code> or stock <code>SimpleHttpOperator</code>/
                <code>PythonOperator</code> against API v2.
              </p>
            </SectionHead>

            <div className="mt-6">
              <Callout variant="correction">
                There is no official CML Airflow provider. <code>CdeRunJobOperator</code> (
                <code>cloudera.cdp.airflow.operators.cde_operator</code>) and the CDW operators are
                for Spark-on-CDE and CDW — <strong className="text-ink">not CML</strong>. The only
                CML operator is the community <code>CMLJobRunOperator</code> (
                <a
                  href="https://github.com/curtishoward/cml_operator"
                  target="_blank"
                  rel="noreferrer"
                  className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent"
                >
                  github.com/curtishoward/cml_operator
                </a>
                ).
              </Callout>
            </div>

            <ol className="mt-8 space-y-3">
              {[
                <>
                  In the CDE Airflow UI, create an HTTP connection <code>cml_rest_api</code>: Host ={' '}
                  <code>&lt;cml-workbench-host&gt;</code>, Schema = <code>https</code>, Extra ={' '}
                  <code>{'{"authorization": "Bearer <CML_API_KEY>"}'}</code>.
                </>,
                <>
                  Paste the <code>CMLJobRunOperator</code> class into your DAG file (below). It
                  resolves project name → project id → job id, POSTs a run, and polls until a
                  terminal state.
                </>,
                <>
                  Deploy to CDE as an <code>--type airflow</code> job with the DAG file mounted as a
                  resource.
                </>,
              ].map((item, i) => (
                <motion.li
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="flex gap-3 text-[15px] leading-relaxed text-body"
                >
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border border-line font-mono text-[11px] text-accent">
                    {i + 1}
                  </span>
                  <span>{item}</span>
                </motion.li>
              ))}
            </ol>

            <div className="mt-8 space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.55, ease: EASE_OUT }}
              >
                <CodeBlock
                  code={CML_OPERATOR_PY}
                  language="python"
                  filename="cml_operator.py — CMLJobRunOperator (community)"
                  maxHeight={520}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.55, delay: 0.08, ease: EASE_OUT }}
              >
                <CodeBlock
                  code={CML_DAG_PY}
                  language="python"
                  filename="cml_pipeline_dag.py"
                  maxHeight={520}
                />
              </motion.div>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-10% 0px' }}
                transition={{ duration: 0.55, delay: 0.16, ease: EASE_OUT }}
              >
                <CodeBlock code={CDE_DEPLOY_SH} language="shell" filename="deploy to CDE" />
              </motion.div>
            </div>

            <div className="mt-6">
              <Callout variant="info">
                A dependency-free variant uses <code>SimpleHttpOperator</code> +{' '}
                <code>HttpSensor</code> polling <code>GET …/runs/{'{run_id}'}</code> until{' '}
                <code>ENGINE_SUCCEEDED</code> — same REST calls the operator wraps. Or a{' '}
                <code>PythonOperator</code> calling <code>cmlapi</code> directly if the wheel is
                installed in the Airflow worker.
              </Callout>
            </div>
          </Section>

          {/* ================= Section 8 — self-hosted Airflow ================= */}
          <Section id="self-hosted" className="border-b-0">
            <SectionHead
              eyebrow="// SELF-HOSTED"
              title="Airflow as a CML Application"
              tier="TIER 3"
              tierColor="purple"
            >
              <p>
                A documented community pattern runs Airflow as a CML{' '}
                <strong className="text-ink">Application</strong> — fine for prototyping, scoped to
                the project, consumes project resources. Production orchestration belongs in CDE.
              </p>
            </SectionHead>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-8"
            >
              <CodeBlock
                code={SELF_HOSTED_SH}
                language="shell"
                filename="install.sh + start.sh"
              />
            </motion.div>

            <Link
              to="/serving#fastapi"
              className="mt-6 inline-flex items-center gap-2 rounded-full border border-line px-4 py-2 font-mono text-[12px] text-body transition-colors hover:border-accent hover:text-accent"
            >
              Why <code>127.0.0.1:$CDSW_APP_PORT</code>?
              <ArrowRight size={13} />
              /serving#fastapi
            </Link>
          </Section>
        </article>
      </div>
    </div>
  );
}
