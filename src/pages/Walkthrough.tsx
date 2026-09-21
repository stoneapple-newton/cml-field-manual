import { memo, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, ChevronDown } from 'lucide-react';
import Callout from '@/components/Callout';
import CodeBlock from '@/components/CodeBlock';
import DocsSidebar from '@/components/DocsSidebar';
import PipelineDiagram from '@/components/PipelineDiagram';
import StatusPill from '@/components/StatusPill';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const STEPS = [
  { id: 'step-0', label: '0 · Prerequisites' },
  { id: 'step-1', label: '1 · Bootstrap the client' },
  { id: 'step-2', label: '2 · Pick a runtime' },
  { id: 'step-3', label: '3 · Create the pipeline' },
  { id: 'step-4', label: '4 · The deploy job' },
  { id: 'step-5', label: '5 · Trigger & poll' },
  { id: 'step-6', label: '6 · Invoke the model' },
  { id: 'troubleshoot', label: 'Troubleshooting' },
];

/* ------------------------------- snippets ------------------------------- */

const BOOTSTRAP_PY = `import cmlapi, os, json, time, sys

client = cmlapi.default_client(
    url="https://" + os.environ["CDSW_DOMAIN"],
    cml_api_key=os.environ["CDSW_APIV2_KEY"],   # or your API v2 key
)
project_id = os.environ["CDSW_PROJECT_ID"]      # in-session; else from list_projects()`;

const RUNTIME_PY = `runtimes = client.list_runtimes(
    search_filter=json.dumps({"kernel": "Python 3.10", "edition": "Standard", "editor": "Workbench"})
).runtimes
rt_id = runtimes[0].image_identifier`;

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
                  schedule="0 6 * * *")                       # daily head of pipeline
train  = make_job("02-train",  "pipelines/train.py",
                  parent_id=ingest.id, cpu=4, memory=16)      # runs after ingest succeeds
deploy = make_job("03-deploy", "pipelines/deploy_model.py",
                  parent_id=train.id)                         # runs after train succeeds

# Kick off the head of the pipeline; the rest chain automatically:
client.create_job_run(cmlapi.CreateJobRunRequest(),
                      project_id=PROJECT_ID, job_id=ingest.id)`;

const DEPLOY_MODEL_PY = `import os, time, sys
import cmlapi

client = cmlapi.default_client()          # in-project: picks up ambient config
project_id = os.environ["CDSW_PROJECT_ID"]

model = client.create_model(
    cmlapi.CreateModelRequest(project_id=project_id, name="churn-model",
                              description="deployed by pipeline"),
    project_id)

build = client.create_model_build(
    cmlapi.CreateModelBuildRequest(project_id=project_id, model_id=model.id,
                                   file_path="pipelines/predict.py",
                                   function_name="predict", kernel="python3"),
    project_id, model.id)

while build.status not in ["built", "build failed"]:
    time.sleep(10)
    build = client.get_model_build(project_id, model.id, build.id)
if build.status == "build failed":
    sys.exit(1)

deployment = client.create_model_deployment(
    cmlapi.CreateModelDeploymentRequest(project_id=project_id, model_id=model.id,
                                        build_id=build.id, cpu=2, memory=4),
    project_id, model.id, build.id)

while deployment.status not in ["stopped", "failed", "deployed"]:
    time.sleep(10)
    deployment = client.get_model_deployment(project_id, model.id, build.id, deployment.id)
sys.exit(0 if deployment.status == "deployed" else 1)`;

const TRIGGER_PY = `# Kick off the head; dependents chain automatically on success
run = client.create_job_run(cmlapi.CreateJobRunRequest(),
                            project_id=project_id, job_id=ingest.id)

while True:
    run = client.get_job_run(project_id, ingest.id, run.id)
    if run.status in ("ENGINE_SUCCEEDED", "ENGINE_FAILED",
                      "ENGINE_STOPPED", "ENGINE_TIMEDOUT"):
        break
    time.sleep(10)
print(run.status)`;

const TRIGGER_CURL = `# trigger
curl -s -X POST -H "$AUTH" -H "$CT" \
  https://$CDSW_DOMAIN/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs -d '{}' | jq

# poll latest run status
curl -s -H "$AUTH" \
  "https://$CDSW_DOMAIN/api/v2/projects/$PROJECT_ID/jobs/$JOB_ID/runs?sort=-created_at&pageSize=1" \
  | jq '.job_runs[0].status'`;

const ACCESS_KEY_PY = `model = client.get_model(model.id, project_id)
print(model.access_key)   # per-model key, e.g. "mgc4w3rdi43x28fy4h8e8..."`;

const INVOKE_PY = `import requests
resp = requests.post(
    f"https://modelservice.{os.environ['CDSW_DOMAIN']}/model",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
    json={"accessKey": ACCESS_KEY, "request": {"petal_length": 1.4}},
)
print(resp.json()["response"])`;

/* ------------------------------ header canvas ---------------------------- */

/** Compact DAG particle canvas behind the page header. Paused offscreen. */
function HeaderCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = false;
    let w = 0;
    let h = 0;

    interface Node {
      x: number;
      y: number;
      vx: number;
      vy: number;
    }
    let nodes: Node[] = [];
    let edges: [number, number][] = [];
    let packets: { e: number; t: number }[] = [];

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const count = Math.max(18, Math.min(44, Math.floor((w * h) / 14000)));
      nodes = Array.from({ length: count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.22,
        vy: (Math.random() - 0.5) * 0.22,
      }));
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (Math.hypot(dx, dy) < 130 && nodes[j].x > nodes[i].x) edges.push([i, j]);
        }
      }
      packets = [];
    };

    let lastPacket = 0;
    const draw = (now: number) => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);

      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }

      ctx.strokeStyle = 'rgba(34, 211, 167, 0.16)';
      ctx.lineWidth = 1;
      for (const [a, b] of edges) {
        ctx.beginPath();
        ctx.moveTo(nodes[a].x, nodes[a].y);
        ctx.lineTo(nodes[b].x, nodes[b].y);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(34, 211, 167, 0.55)';
      for (const n of nodes) {
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.6, 0, Math.PI * 2);
        ctx.fill();
      }

      // packets travel along edges like job triggers firing
      if (now - lastPacket > 1200 && edges.length > 0) {
        packets.push({ e: Math.floor(Math.random() * edges.length), t: 0 });
        lastPacket = now;
      }
      ctx.fillStyle = 'rgba(34, 211, 167, 0.95)';
      packets = packets.filter((p) => p.t <= 1);
      for (const p of packets) {
        p.t += 0.02;
        const [a, b] = edges[p.e];
        const x = nodes[a].x + (nodes[b].x - nodes[a].x) * p.t;
        const y = nodes[a].y + (nodes[b].y - nodes[a].y) * p.t;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      raf = requestAnimationFrame(draw);
    };

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !running) {
          running = true;
          raf = requestAnimationFrame(draw);
        } else if (!entry.isIntersecting && running) {
          running = false;
          cancelAnimationFrame(raf);
        }
      },
      { threshold: 0 },
    );

    resize();
    io.observe(canvas);
    window.addEventListener('resize', resize);
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      className="opacity-60 [mask-image:radial-gradient(70%_80%_at_50%_40%,black,transparent)]"
    />
  );
}

/* --------------------------- progress step rail -------------------------- */

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/** Desktop stepper rail: check circles fill in (accent) as sections are visited. */
function StepRail() {
  const [active, setActive] = useState(STEPS[0].id);
  const [visited, setVisited] = useState<Set<string>>(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActive(entry.target.id);
            setVisited((prev) => {
              if (prev.has(entry.target.id)) return prev;
              const next = new Set(prev);
              next.add(entry.target.id);
              return next;
            });
          }
        }
      },
      { rootMargin: '-96px 0px -60% 0px', threshold: 0 },
    );
    for (const s of STEPS) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, []);

  return (
    <nav aria-label="Walkthrough steps" className="hidden lg:block">
      <div className="sticky top-24">
        <p className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
          Progress
        </p>
        <ol className="space-y-1">
          {STEPS.map((s) => {
            const isActive = s.id === active;
            const isVisited = visited.has(s.id);
            return (
              <li key={s.id}>
                <button
                  type="button"
                  onClick={() => scrollToId(s.id)}
                  className="group flex w-full items-center gap-3 py-1.5 text-left"
                >
                  <span
                    className={cn(
                      'flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                      isActive
                        ? 'border-accent bg-accent-dim'
                        : isVisited
                          ? 'border-accent/50'
                          : 'border-line group-hover:border-line-bright',
                    )}
                  >
                    {isVisited && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 24 }}
                      >
                        <Check size={11} className="text-accent" strokeWidth={3.5} />
                      </motion.span>
                    )}
                  </span>
                  <span
                    className={cn(
                      'font-mono text-[12.5px] transition-colors',
                      isActive ? 'text-accent' : 'text-dim group-hover:text-ink',
                    )}
                  >
                    {s.label}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </nav>
  );
}

/* --------------------------- prereq checklist ---------------------------- */

const PREREQ_KEY = 'cml-walkthrough-prereqs';

const PREREQS: { id: string; label: ReactNode }[] = [
  {
    id: 'domain',
    label: (
      <>
        Workspace domain — the hostname in your browser address bar, e.g.{' '}
        <code>ml-xxxx.a465-9q4k.cloudera.site</code>
      </>
    ),
  },
  {
    id: 'key',
    label: (
      <>
        API v2 key — User Settings → API Keys → Create API Key, Audience <code>API</code>
      </>
    ),
  },
  {
    id: 'project',
    label: (
      <>
        Project ID — <code>CDSW_PROJECT_ID</code> in-session, or <code>list_projects()</code>
      </>
    ),
  },
  {
    id: 'sdk',
    label: <code>pip3 install https://$CDSW_DOMAIN/api/v2/python.tar.gz</code>,
  },
];

function PrereqChecklist() {
  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = window.localStorage.getItem(PREREQ_KEY);
      return new Set(raw ? (JSON.parse(raw) as string[]) : []);
    } catch {
      return new Set();
    }
  });

  const toggle = (id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        window.localStorage.setItem(PREREQ_KEY, JSON.stringify([...next]));
      } catch {
        /* storage unavailable */
      }
      return next;
    });
  };

  return (
    <div className="mt-8 rounded-[10px] border border-line bg-raised p-5">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
          Prerequisites
        </p>
        <p className="font-mono text-[11px] text-dim">
          {checked.size}/{PREREQS.length} ready
        </p>
      </div>
      <ul className="mt-4 space-y-2.5">
        {PREREQS.map((p, i) => {
          const done = checked.has(p.id);
          return (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.15 + i * 0.07, ease: EASE_OUT }}
            >
              <motion.button
                type="button"
                onClick={() => toggle(p.id)}
                aria-pressed={done}
                animate={
                  done
                    ? { borderColor: '#1F2B38' }
                    : { borderColor: ['#3D2C10', '#F5A52488', '#3D2C10'] }
                }
                transition={
                  done
                    ? { duration: 0.2 }
                    : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
                }
                className="flex w-full items-start gap-3 rounded-[10px] border bg-base px-4 py-3 text-left"
              >
                <span
                  className={cn(
                    'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors',
                    done ? 'border-accent bg-accent-dim' : 'border-line-bright',
                  )}
                >
                  {done && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 500, damping: 22 }}
                    >
                      <Check size={12} className="text-accent" strokeWidth={3.5} />
                    </motion.span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[14.5px] leading-relaxed transition-colors',
                    done ? 'text-dim line-through decoration-line-bright' : 'text-body',
                  )}
                >
                  {p.label}
                </span>
              </motion.button>
            </motion.li>
          );
        })}
      </ul>
    </div>
  );
}

/* --------------------------- live status strip --------------------------- */

const SEQ = [
  'ENGINE_SCHEDULING',
  'ENGINE_STARTING',
  'ENGINE_RUNNING',
  'ENGINE_RUNNING',
  'ENGINE_SUCCEEDED',
  'ENGINE_SUCCEEDED',
  'ENGINE_SUCCEEDED',
];
const PERIOD = 16;

/** Decorative looping cascade: ingest → train → deploy statuses. */
const StatusStrip = memo(function StatusStrip() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = window.setInterval(() => setTick((v) => v + 1), 800);
    return () => window.clearInterval(t);
  }, []);

  return (
    <div className="mt-6 flex flex-wrap items-center gap-x-2 gap-y-3 rounded-[10px] border border-line bg-raised p-4">
      <span className="mr-2 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
        simulated run
      </span>
      {['01-ingest', '02-train', '03-deploy'].map((name, i) => {
        const phase = (((tick - i * 3) % PERIOD) + PERIOD) % PERIOD;
        const status = SEQ[Math.min(phase, SEQ.length - 1)];
        return (
          <span key={name} className="flex items-center gap-2">
            <span className="font-mono text-[12px] text-dim">{name}</span>
            <StatusPill status={status} />
            {i < 2 && (
              <span className="px-1 font-mono text-accent" aria-hidden="true">
                →
              </span>
            )}
          </span>
        );
      })}
    </div>
  );
});

/* ------------------------------ accordion -------------------------------- */

const TROUBLESHOOTING: { q: ReactNode; a: ReactNode }[] = [
  {
    q: <code>missing "Bearer" prefix in "authorization" header</code>,
    a: (
      <>
        The header is missing or malformed — every request needs{' '}
        <code>Authorization: Bearer &lt;key&gt;</code>. Check quoting and that{' '}
        <code>$API_KEY</code> is actually set.
      </>
    ),
  },
  {
    q: (
      <>
        <code>pip install cmlapi</code> fails
      </>
    ),
    a: (
      <>
        <code>cmlapi</code> is not on PyPI. Install it from your own workspace:{' '}
        <code>pip3 install https://$CDSW_DOMAIN/api/v2/python.tar.gz</code>. Inside a CML session it
        is typically preinstalled.
      </>
    ),
  },
  {
    q: 'Dependent job never runs',
    a: (
      <>
        Dependents fire only on the parent's <code>ENGINE_SUCCEEDED</code> — check the parent's
        History tab. Also: both jobs must live in the same project, and you can't set both{' '}
        <code>schedule</code> and <code>parent_job_id</code>.
      </>
    ),
  },
  {
    q: (
      <>
        Build stuck / <code>build failed</code>
      </>
    ),
    a: (
      <>
        Poll <code>get_model_build</code> until <code>built</code> or <code>build failed</code>.
        Keep project files &gt;50 MB and <code>.git</code> out of the build snapshot.
      </>
    ),
  },
  {
    q: 'Model call returns 401/403',
    a: (
      <>
        The Bearer key needs the <strong className="text-ink">Application</strong> audience; or send
        only the <code>accessKey</code> if model authentication is disabled.
      </>
    ),
  },
];

function Troubleshooting() {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="mt-8 divide-y divide-line overflow-hidden rounded-[10px] border border-line bg-raised">
      {TROUBLESHOOTING.map((item, i) => {
        const isOpen = open === i;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-8% 0px' }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: EASE_OUT }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : i)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors hover:bg-surface/60"
            >
              <span className="font-mono text-[13px] text-ink">{item.q}</span>
              <ChevronDown
                size={15}
                className={cn(
                  'shrink-0 text-dim transition-transform duration-200',
                  isOpen && 'rotate-180 text-accent',
                )}
              />
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  key="content"
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.25, ease: EASE_OUT }}
                  className="overflow-hidden"
                >
                  <div className="px-4 pb-4 text-[14.5px] leading-relaxed text-body">
                    {item.a}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

/* --------------------------- step section shell --------------------------- */

function StepSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 pt-16 lg:pt-20">
      <motion.p
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.4 }}
        className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
      >
        {eyebrow}
      </motion.p>
      <motion.h2
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.5, delay: 0.06, ease: EASE_OUT }}
        className="mt-3 font-display text-2xl font-semibold text-ink lg:text-3xl"
      >
        {title}
      </motion.h2>
      {children}
    </section>
  );
}

function Body({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-15% 0px' }}
      transition={{ duration: 0.5, delay: 0.1, ease: EASE_OUT }}
      className="mt-4 space-y-3 leading-relaxed text-body"
    >
      {children}
    </motion.div>
  );
}

function Code({ ...props }: Parameters<typeof CodeBlock>[0]) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-12% 0px' }}
      transition={{ duration: 0.55, ease: EASE_OUT }}
      className="mt-6"
    >
      <CodeBlock {...props} />
    </motion.div>
  );
}

/* --------------------------------- page ---------------------------------- */

export default function Walkthrough() {
  return (
    <div className="mx-auto max-w-content px-5 lg:px-8">
      {/* Mobile chip scroller (desktop rail inside DocsSidebar suppressed) */}
      <DocsSidebar sections={STEPS} className="lg:!hidden" />
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <div className="pt-6 lg:pt-24">
          <StepRail />
        </div>

        <article className="min-w-0 max-w-[880px] pb-16">
          {/* ------------------------- header + prereqs ------------------------- */}
          <section id="step-0" className="relative scroll-mt-24 pt-16 lg:pt-24">
            <div className="relative overflow-hidden rounded-[10px] border border-line bg-raised/40 px-6 py-10 lg:px-10">
              <HeaderCanvas />
              <div className="relative">
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
                >
                  {'// 06 — WALKTHROUGH'}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.55, delay: 0.06, ease: EASE_OUT }}
                  className="mt-3 max-w-[16ch] font-display text-4xl font-bold text-ink lg:text-5xl"
                >
                  From project to prediction in six steps.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.14, ease: EASE_OUT }}
                  className="mt-4 max-w-[64ch] leading-relaxed text-body"
                >
                  A complete, copy-pasteable run: three jobs wired with{' '}
                  <code>parent_job_id</code> (ingest → train → deploy), triggered over API v2,
                  ending with a live model endpoint. Assumes a CML project with scripts{' '}
                  <code>pipelines/ingest.py</code>, <code>pipelines/train.py</code>,{' '}
                  <code>pipelines/deploy_model.py</code>, and <code>pipelines/predict.py</code>.
                </motion.p>
              </div>
            </div>
            <PrereqChecklist />
          </section>

          {/* ------------------------------ Step 1 ------------------------------ */}
          <StepSection id="step-1" eyebrow="// STEP 1" title="Bootstrap the client">
            <Body>
              <p>
                Inside any CML session/job/app, <code>cmlapi.default_client()</code> with no args
                works — ambient env vars carry domain and key. Outside, pass <code>url</code> +{' '}
                <code>cml_api_key</code> explicitly.
              </p>
              <Link
                to="/concepts#env"
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[12px] text-accent transition-colors hover:border-accent/60"
              >
                in-session env vars → /concepts#env
              </Link>
            </Body>
            <Code code={BOOTSTRAP_PY} language="python" filename="bootstrap.py" />
          </StepSection>

          {/* ------------------------------ Step 2 ------------------------------ */}
          <StepSection id="step-2" eyebrow="// STEP 2" title="Pick a runtime">
            <Body>
              <p>
                ML Runtime projects need <code>runtime_identifier</code> on every job/build — grab
                it from <code>list_runtimes</code> instead of hard-coding an image tag.
                Legacy-engine projects use <code>kernel="python3"</code> instead.
              </p>
            </Body>
            <Code code={RUNTIME_PY} language="python" filename="runtime.py" />
          </StepSection>

          {/* ------------------------------ Step 3 ------------------------------ */}
          <StepSection id="step-3" eyebrow="// STEP 3" title="Create the pipeline">
            <Body>
              <p>
                Three jobs. <code>01-ingest</code> carries the cron schedule (daily 06:00 UTC);{' '}
                <code>02-train</code> and <code>03-deploy</code> are dependents — each fires only
                after its parent's run succeeds.
              </p>
            </Body>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-6 rounded-[10px] border border-line bg-raised p-4"
            >
              <PipelineDiagram
                width={740}
                height={180}
                nodes={[
                  {
                    id: 'ingest',
                    label: '01-ingest',
                    x: 20,
                    y: 64,
                    spec: 'cron 0 6 * * * · 2 vCPU · 4 GB',
                    detail: {
                      name: '01-ingest',
                      script: 'pipelines/ingest.py',
                      kernel: 'python3',
                      cpu: 2,
                      memory: 4,
                      runtime_identifier: '<RUNTIME>',
                      environment: { PIPELINE_NAME: 'ingest-train-deploy' },
                      schedule: '0 6 * * *',
                    },
                  },
                  {
                    id: 'train',
                    label: '02-train',
                    x: 295,
                    y: 64,
                    spec: 'parent: 01-ingest · 4 vCPU · 16 GB',
                    detail: {
                      name: '02-train',
                      script: 'pipelines/train.py',
                      kernel: 'python3',
                      cpu: 4,
                      memory: 16,
                      runtime_identifier: '<RUNTIME>',
                      environment: { PIPELINE_NAME: 'ingest-train-deploy' },
                      parent_job_id: '<ingest.id>',
                    },
                  },
                  {
                    id: 'deploy',
                    label: '03-deploy',
                    x: 570,
                    y: 64,
                    spec: 'parent: 02-train · 2 vCPU · 4 GB',
                    detail: {
                      name: '03-deploy',
                      script: 'pipelines/deploy_model.py',
                      kernel: 'python3',
                      cpu: 2,
                      memory: 4,
                      runtime_identifier: '<RUNTIME>',
                      environment: { PIPELINE_NAME: 'ingest-train-deploy' },
                      parent_job_id: '<train.id>',
                    },
                  },
                ]}
                edges={[
                  { from: 'ingest', to: 'train' },
                  { from: 'train', to: 'deploy' },
                ]}
              />
            </motion.div>

            <Code code={CREATE_PIPELINE_PY} language="python" filename="create_pipeline.py" maxHeight={520} />

            <Callout variant="info" className="mt-6">
              <code>parent_job_id</code> and <code>schedule</code> are mutually exclusive on a
              single job — the head of the chain owns the schedule.
            </Callout>
          </StepSection>

          {/* ------------------------------ Step 4 ------------------------------ */}
          <StepSection id="step-4" eyebrow="// STEP 4" title="The deploy job">
            <Body>
              <p>
                <code>03-deploy</code> runs <em>inside</em> CML, so it uses the ambient client (
                <code>cmlapi.default_client()</code> + <code>os.environ["CDSW_PROJECT_ID"]</code>).
                It performs the full model lifecycle: create → build (poll for{' '}
                <code>built</code>) → deploy (poll for <code>deployed</code>), exiting non-zero on
                failure so the job run is marked <code>ENGINE_FAILED</code> and the pipeline
                visibly stops.
              </p>
            </Body>
            <Code
              code={DEPLOY_MODEL_PY}
              language="python"
              filename="pipelines/deploy_model.py"
              maxHeight={520}
            />
            <Body>
              <p>
                Key lines: <code>sys.exit(1)</code> on <code>build failed</code>; the final{' '}
                <code>sys.exit(0 if deployment.status == "deployed" else 1)</code> maps the model
                lifecycle onto the job-run exit code.
              </p>
            </Body>
          </StepSection>

          {/* ------------------------------ Step 5 ------------------------------ */}
          <StepSection id="step-5" eyebrow="// STEP 5" title="Trigger and poll">
            <Code
              tabs={[
                { label: 'Python (cmlapi)', code: TRIGGER_PY, language: 'python' },
                { label: 'curl', code: TRIGGER_CURL, language: 'shell' },
              ]}
              filename="trigger + poll"
            />
            <Body>
              <p>
                Per-run overrides go in{' '}
                <code>CreateJobRunRequest(environment={'{...}'}, arguments="...")</code> —
                backfills without editing the job. Watch the chain fire in the UI:{' '}
                <strong className="text-ink">Project → Jobs</strong> shows the dependency graph;
                each job's <strong className="text-ink">History</strong> tab shows its runs.
              </p>
            </Body>
            <StatusStrip />
          </StepSection>

          {/* ------------------------------ Step 6 ------------------------------ */}
          <StepSection id="step-6" eyebrow="// STEP 6" title="Invoke the model">
            <Body>
              <p>
                When <code>03-deploy</code> finishes <code>deployed</code>, grab the access key and
                call the serving endpoint:
              </p>
            </Body>
            <Code code={ACCESS_KEY_PY} language="python" filename="access key" />
            <Code code={INVOKE_PY} language="python" filename="invoke.py" />

            <Callout variant="info" className="mt-6">
              Response shape: <code>{'{"response": <predict return value>}'}</code> (+
              <code>uuid</code> with metrics enabled).
            </Callout>

            {/* success state */}
            <motion.div
              initial={{ opacity: 0, scale: 0.94 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ type: 'spring', stiffness: 180, damping: 18 }}
              className="mt-10 flex flex-col items-center gap-4 rounded-[10px] border border-accent/30 bg-accent-dim/30 px-6 py-10"
            >
              <StatusPill
                status="ENGINE_SUCCEEDED"
                className="animate-breathe px-5 py-2 text-sm shadow-glow"
              />
              <p className="font-mono text-[12px] text-dim">
                pipeline complete · model serving on modelservice.&lt;domain&gt;
              </p>
            </motion.div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                to="/jobs"
                className="inline-flex items-center gap-2 rounded-[10px] border border-line bg-raised px-5 py-2.5 font-mono text-sm text-body transition-colors hover:border-line-bright hover:text-ink"
              >
                <ArrowLeft size={15} />
                Back to Jobs
              </Link>
              <Link
                to="/serving#fastapi"
                className="inline-flex items-center gap-2 rounded-[10px] border border-accent/60 bg-accent-dim px-5 py-2.5 font-mono text-sm font-medium text-accent transition-colors hover:border-accent"
              >
                Serve a FastAPI app instead
                <ArrowRight size={15} />
              </Link>
            </div>
          </StepSection>

          {/* --------------------------- troubleshooting --------------------------- */}
          <section id="troubleshoot" className="scroll-mt-24 py-16 lg:py-20">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.4 }}
              className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
            >
              {'// WHEN IT BREAKS'}
            </motion.p>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-15% 0px' }}
              transition={{ duration: 0.5, delay: 0.06, ease: EASE_OUT }}
              className="mt-3 font-display text-2xl font-semibold text-ink lg:text-3xl"
            >
              Troubleshooting
            </motion.h2>
            <Troubleshooting />
            <p className="mt-10 text-center font-mono text-[12px] text-dim">
              <span className="text-accent">ENGINE_SUCCEEDED</span> — ship it.
            </p>
          </section>
        </article>
      </div>
    </div>
  );
}
