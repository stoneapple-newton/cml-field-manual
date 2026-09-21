import { useRef } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import type { MouseEvent as FMMouseEvent } from 'react';
import { ArrowRight, CornerDownRight } from 'lucide-react';
import HeroCanvas from '@/components/home/HeroCanvas';
import MiniTerminal from '@/components/home/MiniTerminal';
import StatusTicker from '@/components/home/StatusTicker';
import TimelineSection from '@/components/home/TimelineSection';
import StatsSection from '@/components/home/StatsSection';
import Callout from '@/components/Callout';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

/* ------------------------------- hero H1 ------------------------------- */

function KineticLine({ text, delayBase }: { text: string; delayBase: number }) {
  return (
    <span className="block overflow-hidden">
      {text.split('').map((ch, i) => (
        <motion.span
          key={i}
          className={ch === '.' ? 'inline-block text-accent' : 'inline-block text-ink'}
          initial={{ y: 30, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: delayBase + i * 0.018, duration: 0.6, ease: EASE_OUT }}
        >
          {ch === ' ' ? ' ' : ch}
        </motion.span>
      ))}
    </span>
  );
}

/* ------------------------------- tilt card ------------------------------ */

function TiltCard({ children, to }: { children: ReactNode; to: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const sx = useSpring(mx, { stiffness: 200, damping: 25 });
  const sy = useSpring(my, { stiffness: 200, damping: 25 });
  const rotateX = useTransform(sy, [0, 1], [3, -3]);
  const rotateY = useTransform(sx, [0, 1], [-3, 3]);

  const onMove = (e: FMMouseEvent<HTMLDivElement>) => {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set((e.clientX - rect.left) / rect.width);
    my.set((e.clientY - rect.top) / rect.height);
  };
  const onLeave = () => {
    mx.set(0.5);
    my.set(0.5);
  };

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      style={{ rotateX, rotateY, transformPerspective: 900 }}
      className="h-full"
    >
      <Link
        to={to}
        className="group relative flex h-full flex-col rounded-[10px] border border-line bg-raised p-8 transition-colors hover:border-line-bright"
      >
        {children}
        <CornerDownRight
          size={18}
          className="absolute right-6 top-6 -translate-x-2 text-accent opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100"
        />
      </Link>
    </motion.div>
  );
}

/* ------------------------------ mini glyphs ----------------------------- */

function MiniDagGlyph() {
  return (
    <svg width="96" height="40" viewBox="0 0 96 40" fill="none" aria-hidden="true">
      <path d="M16 20 H40" stroke="#22D3A7" strokeWidth="1.5" />
      <path d="M56 20 H80" stroke="#22D3A7" strokeWidth="1.5" />
      <path d="M38 16 L40 20 L38 24" stroke="#22D3A7" strokeWidth="1.5" fill="none" />
      <path d="M78 16 L80 20 L78 24" stroke="#22D3A7" strokeWidth="1.5" fill="none" />
      <rect x="2" y="10" width="14" height="20" rx="4" stroke="#22D3A7" strokeWidth="1.5" />
      <rect x="42" y="10" width="14" height="20" rx="4" stroke="#22D3A7" strokeWidth="1.5" />
      <rect x="82" y="10" width="14" height="20" rx="4" fill="#22D3A7" fillOpacity="0.15" stroke="#22D3A7" strokeWidth="1.5" />
    </svg>
  );
}

function StaticDagBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
      viewBox="0 0 1200 400"
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
    >
      {[
        [100, 200, 320, 80], [100, 200, 320, 320], [420, 80, 640, 200],
        [420, 320, 640, 200], [740, 200, 960, 90], [740, 200, 960, 310],
        [1060, 90, 1150, 200], [1060, 310, 1150, 200],
      ].map(([x1, y1, x2, y2], i) => (
        <path
          key={i}
          d={`M ${x1} ${y1} C ${(x1 + x2) / 2} ${y1}, ${(x1 + x2) / 2} ${y2}, ${x2} ${y2}`}
          stroke="#22D3A7"
          strokeWidth="1.5"
          fill="none"
        />
      ))}
      {[
        [100, 200], [320, 80], [320, 320], [640, 200], [960, 90], [960, 310], [1150, 200],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 16} y={y - 10} width="32" height="20" rx="5" stroke="#22D3A7" strokeWidth="1.5" fill="none" />
      ))}
    </svg>
  );
}

/* --------------------------------- page --------------------------------- */

export default function Home() {
  return (
    <div>
      {/* ============================ Section 1 — Hero ============================ */}
      <section className="relative flex min-h-[calc(100dvh-4rem)] flex-col overflow-hidden">
        {/* backdrop image, 30% opacity, multiply, radial mask */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0 opacity-30 mix-blend-multiply"
          style={{
            backgroundImage: 'url(/og-hero.svg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            maskImage: 'radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 100%)',
            WebkitMaskImage:
              'radial-gradient(ellipse 90% 80% at 50% 40%, black 30%, transparent 100%)',
          }}
        />
        {/* radial fallback tint */}
        <div
          aria-hidden="true"
          className="absolute inset-0 z-0"
          style={{
            background:
              'radial-gradient(ellipse 70% 60% at 65% 35%, rgba(18,63,53,0.5), rgba(11,15,20,0) 70%)',
          }}
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0"
        >
          <HeroCanvas />
        </motion.div>

        <div className="relative z-10 mx-auto flex w-full max-w-content flex-1 items-center px-5 py-20 lg:px-8">
          <div className="flex w-full flex-col items-start gap-10 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-[640px]">
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE_OUT }}
                className="font-mono text-[13px] font-medium tracking-[0.08em] text-accent"
              >
                {'// CLOUDERA MACHINE LEARNING · API v2 FIELD MANUAL'}
              </motion.p>

              <h1 className="mt-5 font-display text-[56px] font-bold leading-[1.04] tracking-[-0.02em] md:text-[64px]">
                <KineticLine text="Jobs." delayBase={0.15} />
                <KineticLine text="Pipelines." delayBase={0.3} />
                <KineticLine text="API v2." delayBase={0.5} />
              </h1>

              <motion.p
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5, duration: 0.5, ease: EASE_OUT }}
                className="mt-6 max-w-[46ch] text-lg leading-relaxed text-body"
              >
                How to actually run work on Cloudera AI: create jobs, chain them into
                pipelines with <code>parent_job_id</code>, and drive the whole lifecycle from
                the REST API and the <code>cmlapi</code> Python SDK. Exact fields, real
                endpoints, runnable code.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.62, duration: 0.5, ease: EASE_OUT }}
                className="mt-8 flex flex-wrap items-center gap-4"
              >
                <Link
                  to="/walkthrough"
                  className="group inline-flex items-center gap-2 rounded-[10px] bg-accent px-6 py-3 font-display text-[15px] font-semibold text-[#0B0F14] transition-all duration-200 hover:scale-[1.03] hover:shadow-glow"
                >
                  Start the walkthrough
                  <ArrowRight size={17} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  to="/jobs"
                  className="inline-flex items-center gap-2 rounded-[10px] border border-line px-6 py-3 font-display text-[15px] font-semibold text-ink transition-colors hover:border-accent"
                >
                  Jump to Jobs →
                </Link>
              </motion.div>
            </div>

            {/* Mini terminal (desktop only) */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7, duration: 0.6, ease: EASE_OUT }}
              className="hidden shrink-0 lg:block"
            >
              <MiniTerminal />
            </motion.div>
          </div>
        </div>

        {/* scroll cue */}
        <motion.div
          aria-hidden="true"
          className="relative z-10 mb-3 flex justify-center"
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        >
          <span className="font-mono text-[11px] tracking-[0.2em] text-dim">scroll ↓</span>
        </motion.div>

        {/* status ticker */}
        <div className="relative z-10">
          <StatusTicker />
        </div>
      </section>

      {/* ==================== Section 2 — the arc (GSAP pinned) ==================== */}
      <div className="py-24 lg:py-28">
        <TimelineSection />
      </div>

      {/* ======================= Section 3 — Quick answers ======================= */}
      <section className="py-24">
        <div className="mx-auto max-w-content px-5 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">
            // 02 — QUICK ANSWERS
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-ink">I just want to…</h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ staggerChildren: 0.12 }}
            className="mt-12 grid gap-6 md:grid-cols-3"
          >
            {[
              {
                to: '/jobs#scheduling',
                title: 'Schedule a job',
                body: (
                  <>
                    Give <code>CreateJobRequest</code> a 5-field UTC cron in{' '}
                    <code>schedule</code> — or POST to <code>…/jobs/{'{id}'}/runs</code> to fire
                    one now.
                  </>
                ),
                chip: 'schedule: "0 2 * * *"',
              },
              {
                to: '/workflows',
                title: 'Chain jobs into a pipeline',
                body: (
                  <>
                    Set <code>parent_job_id</code> on a job. It runs only after the parent&apos;s
                    run returns <code>ENGINE_SUCCEEDED</code>. The Jobs tab draws the graph.
                  </>
                ),
                glyph: true,
              },
              {
                to: '/api',
                title: 'Trigger it all from the API',
                body: (
                  <>
                    <code>Authorization: Bearer &lt;api-key&gt;</code> against{' '}
                    <code>https://&lt;workspace-domain&gt;/api/v2/…</code>, or{' '}
                    <code>pip3 install https://$CDSW_DOMAIN/api/v2/python.tar.gz</code> and use{' '}
                    <code>cmlapi</code>.
                  </>
                ),
                chip: 'POST /api/v2/projects/{id}/jobs/{id}/runs',
              },
            ].map((c) => (
              <motion.div
                key={c.title}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
                }}
              >
                <TiltCard to={c.to}>
                  <h3 className="font-display text-[22px] font-semibold text-ink">{c.title}</h3>
                  <p className="mt-3 flex-1 text-[15px] leading-relaxed text-body">{c.body}</p>
                  <div className="mt-6">
                    {c.glyph ? (
                      <MiniDagGlyph />
                    ) : (
                      <span className="inline-block max-w-full truncate rounded-md border border-line bg-code px-2.5 py-1.5 font-mono text-[12px] text-accent">
                        {c.chip}
                      </span>
                    )}
                  </div>
                </TiltCard>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ====================== Section 4 — Corrections band ====================== */}
      <motion.section
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ duration: 0.6, ease: EASE_OUT }}
        className="border-y border-line bg-amber-dim/25 py-24"
      >
        <div className="mx-auto max-w-content px-5 lg:px-8">
          <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-amber">
            // CORRECTIONS
          </p>
          <h2 className="mt-3 font-display text-4xl font-semibold text-ink">
            Read this before the docs confuse you
          </h2>

          <motion.div
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ staggerChildren: 0.1 }}
            className="mt-10 grid gap-5 lg:grid-cols-3"
          >
            {[
              {
                title: 'There is no Workflows tab.',
                body: (
                  <>
                    CML ships no embedded Airflow. Native orchestration = dependent jobs on the
                    Jobs tab; real DAGs run in CDE&apos;s managed Airflow.{' '}
                    <Link to="/workflows" className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
                      Pipelines →
                    </Link>
                  </>
                ),
              },
              {
                title: '`pip install cmlapi` doesn\'t exist.',
                body: (
                  <>
                    The SDK is served by your workspace:{' '}
                    <code>pip3 install https://&lt;workbench-domain&gt;/api/v2/python.tar.gz</code>.{' '}
                    <Link to="/api" className="text-accent underline decoration-accent/40 underline-offset-2 hover:decoration-accent">
                      API v2 →
                    </Link>
                  </>
                ),
              },
              {
                title: 'CML is now "Cloudera AI".',
                body: (
                  <>
                    Same platform, new name. Docs paths live under{' '}
                    <code>docs.cloudera.com/machine-learning</code>. CDSW is the legacy on-prem
                    predecessor.
                  </>
                ),
              },
            ].map((c) => (
              <motion.div
                key={c.title}
                variants={{
                  hidden: { opacity: 0, x: -16 },
                  show: { opacity: 1, x: 0, transition: { duration: 0.45, ease: EASE_OUT } },
                }}
              >
                <Callout variant="correction" title={c.title} className="h-full">
                  {c.body}
                </Callout>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </motion.section>

      {/* ========================= Section 5 — Numbers ========================= */}
      <StatsSection />

      {/* ========================= Section 6 — Final CTA ========================= */}
      <section className="relative overflow-hidden py-28">
        <StaticDagBg />
        <div className="relative mx-auto max-w-content px-5 text-center lg:px-8">
          <motion.h2
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: '-20% 0px' }}
            transition={{ staggerChildren: 0.04 }}
            className="mx-auto max-w-3xl font-display text-4xl font-semibold leading-tight text-ink md:text-5xl"
            aria-label="You have a project. Let's ship a pipeline."
          >
            {"You have a project. Let's ship a pipeline.".split(' ').map((w, i) => (
              <motion.span
                key={i}
                className="inline-block whitespace-pre"
                variants={{
                  hidden: { opacity: 0, y: 24 },
                  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: EASE_OUT } },
                }}
              >
                {w}{' '}
              </motion.span>
            ))}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-4 text-lg text-body"
          >
            Sixty lines of Python. Three jobs. One model endpoint.
          </motion.p>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.5, type: 'spring', stiffness: 260, damping: 18 }}
            className="mt-9"
          >
            <Link
              to="/walkthrough"
              className="inline-flex animate-breathe items-center gap-2 rounded-[10px] bg-accent px-7 py-3.5 font-display text-[16px] font-semibold text-[#0B0F14] transition-transform hover:scale-[1.03]"
            >
              Run the walkthrough
              <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
