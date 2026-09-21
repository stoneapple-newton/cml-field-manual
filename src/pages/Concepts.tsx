import { useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import {
  Boxes,
  FlaskConical,
  FolderGit2,
  Globe,
  Layers,
  ListChecks,
  TerminalSquare,
} from 'lucide-react';
import Callout from '@/components/Callout';
import CodeBlock from '@/components/CodeBlock';
import type { CodeLanguage } from '@/components/CodeBlock';
import DataTable from '@/components/DataTable';
import DocsSidebar from '@/components/DocsSidebar';
import type { DocsSection } from '@/components/DocsSidebar';
import EndpointRow from '@/components/EndpointRow';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const SECTIONS: DocsSection[] = [
  { id: 'what-is-cml', label: 'What CML is' },
  { id: 'object-hierarchy', label: 'Object hierarchy' },
  { id: 'project-anatomy', label: "A project's anatomy" },
  { id: 'env-vars', label: 'Environment variables' },
  { id: 'api-key', label: 'Getting your API key' },
  { id: 'naming-corrections', label: 'Naming corrections' },
];

/* ------------------------- word-split heading ------------------------- */

function SplitWords({
  text,
  inView = true,
  className,
}: {
  text: string;
  inView?: boolean;
  className?: string;
}) {
  const words = text.split(' ');
  return (
    <motion.span
      initial="hidden"
      {...(inView
        ? { whileInView: 'show', viewport: { once: true, margin: '-15% 0px' } }
        : { animate: 'show' })}
      transition={{ staggerChildren: 0.04 }}
      className={className}
      aria-label={text}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-1 align-bottom">
          <motion.span
            className="inline-block whitespace-pre"
            variants={{
              hidden: { y: 24, opacity: 0 },
              show: { y: 0, opacity: 1, transition: { duration: 0.5, ease: EASE_OUT } },
            }}
          >
            {w}
            {i < words.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </motion.span>
  );
}

function SectionHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div>
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-15% 0px' }}
        transition={{ duration: 0.4, ease: EASE_OUT }}
        className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
      >
        {eyebrow}
      </motion.p>
      <h2 className="mt-3 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-4xl">
        <SplitWords text={title} />
      </h2>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.5, delay: 0.15, ease: EASE_OUT }}
          className="mt-4 text-[17px] leading-relaxed text-body"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

/* --------------------------- hierarchy tree ---------------------------- */

interface TreeNodeData {
  label: string;
  def: string;
  apiPath: string;
  to: string;
  icon: typeof Layers;
}

const WORKSPACE_NODE: TreeNodeData = {
  label: 'Workspace',
  def: 'ml-xxxx.a465-9q4k.cloudera.site',
  apiPath: 'https://<workspace-domain>/api/v2',
  to: '/api',
  icon: Globe,
};

const PROJECT_NODE: TreeNodeData = {
  label: 'Project',
  def: 'files under /home/cdsw, env vars, collaborators',
  apiPath: '/api/v2/projects/{project_id}',
  to: '/jobs',
  icon: FolderGit2,
};

const CHILD_NODES: TreeNodeData[] = [
  {
    label: 'Sessions',
    def: 'interactive engines (Jupyter/Workbench)',
    apiPath: 'launched from the Workbench UI',
    to: '/concepts#project-anatomy',
    icon: TerminalSquare,
  },
  {
    label: 'Jobs',
    def: 'batch runs of a script — cron, manual, dependent',
    apiPath: '/api/v2/projects/{project_id}/jobs',
    to: '/jobs',
    icon: ListChecks,
  },
  {
    label: 'Models',
    def: 'REST endpoints: create → build → deploy',
    apiPath: '/api/v2/projects/{project_id}/models',
    to: '/serving',
    icon: Boxes,
  },
  {
    label: 'Applications',
    def: 'long-lived web apps (FastAPI, Streamlit…)',
    apiPath: '/api/v2/projects/{project_id}/applications',
    to: '/serving',
    icon: Layers,
  },
  {
    label: 'Experiments',
    def: 'tracked runs + metrics',
    apiPath: '/api/v2/projects/{project_id}/experiments',
    to: '/api',
    icon: FlaskConical,
  },
];

function TreeNode({ node, delay, wide }: { node: TreeNodeData; delay: number; wide?: boolean }) {
  const navigate = useNavigate();
  const Icon = node.icon;
  return (
    <motion.button
      type="button"
      onClick={() => navigate(node.to)}
      initial={{ opacity: 0, scale: 0.9 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ type: 'spring', stiffness: 260, damping: 20, delay }}
      whileHover={{ y: -3 }}
      className={cn(
        'group relative cursor-pointer rounded-[10px] border border-line bg-raised px-4 py-3.5 text-left transition-colors hover:border-accent',
        wide && 'w-full max-w-[420px]',
      )}
    >
      <span className="flex items-center gap-2">
        <Icon size={15} className="shrink-0 text-accent" strokeWidth={2.2} />
        <span className="font-mono text-[14px] font-semibold text-ink">{node.label}</span>
      </span>
      <span className="mt-1 block text-[12.5px] leading-snug text-dim">{node.def}</span>

      {/* hover tooltip: API base path */}
      <span className="pointer-events-none absolute -top-2 left-1/2 z-20 w-max max-w-[280px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-md border border-line-bright bg-surface px-2.5 py-1.5 font-mono text-[11px] leading-snug text-accent opacity-0 shadow-lg transition-opacity duration-150 group-hover:opacity-100">
        {node.apiPath}
      </span>
    </motion.button>
  );
}

function DrawnPath({ d, delay, duration }: { d: string; delay: number; duration: number }) {
  return (
    <motion.path
      d={d}
      fill="none"
      stroke="#22D3A7"
      strokeWidth={1.5}
      strokeLinecap="round"
      vectorEffect="non-scaling-stroke"
      initial={{ pathLength: 0 }}
      whileInView={{ pathLength: 1 }}
      viewport={{ once: true, margin: '-10% 0px' }}
      transition={{ duration, delay, ease: 'easeInOut' }}
    />
  );
}

function ObjectHierarchyTree() {
  return (
    <div className="relative">
      {/* Workspace */}
      <div className="flex justify-center">
        <TreeNode node={WORKSPACE_NODE} delay={0} wide />
      </div>

      {/* edge: workspace → project */}
      <div className="mx-auto h-10 w-px">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <DrawnPath d="M50 0 V100" delay={0.25} duration={0.5} />
        </svg>
      </div>

      {/* Project */}
      <div className="flex justify-center">
        <TreeNode node={PROJECT_NODE} delay={0.6} wide />
      </div>

      {/* fan-out edges (desktop) */}
      <div className="relative mx-auto hidden h-14 w-full lg:block" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <DrawnPath d="M50 0 V40" delay={0.85} duration={0.35} />
          <DrawnPath d="M10 40 H90" delay={1.1} duration={0.5} />
          {[10, 30, 50, 70, 90].map((x, i) => (
            <DrawnPath key={x} d={`M${x} 40 V100`} delay={1.35 + i * 0.15} duration={0.35} />
          ))}
        </svg>
      </div>
      {/* mobile connector */}
      <div className="mx-auto h-8 w-px lg:hidden" aria-hidden="true">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
          <DrawnPath d="M50 0 V100" delay={0.85} duration={0.4} />
        </svg>
      </div>

      {/* children */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {CHILD_NODES.map((n, i) => (
          <TreeNode key={n.label} node={n} delay={1.55 + i * 0.15} />
        ))}
      </div>
    </div>
  );
}

/* ------------------------- env var explorer ---------------------------- */

interface EnvVar {
  name: string;
  summary: string;
  detail: string;
  code?: string;
  language?: CodeLanguage;
  filename?: string;
}

const ENV_VARS: EnvVar[] = [
  {
    name: 'CDSW_APIV2_KEY',
    summary: 'API v2 key for Bearer auth',
    detail:
      'The API v2 key, present in modern workspaces and usable with "Authorization: Bearer". This is the key cmlapi picks up automatically — it is what Cloudera\'s own AMPs and Agent Studio use.',
    language: 'python',
    filename: 'bootstrap.py',
    code: `import cmlapi, os

# Easiest — works with no args inside any CML session/job/app:
client = cmlapi.default_client()

# Explicit:
client = cmlapi.default_client(
    url=os.environ["CDSW_API_URL"].replace("/api/v1", ""),
    cml_api_key=os.environ["CDSW_APIV2_KEY"],
)
project_id = os.environ["CDSW_PROJECT_ID"]`,
  },
  {
    name: 'CDSW_DOMAIN',
    summary: 'Workspace domain',
    detail:
      'The workspace domain, e.g. ml-xxxx.a465-9q4k.cloudera.site. It is exactly the hostname in your browser address bar — the workspace URL is https://$CDSW_DOMAIN and every API v2 call starts from it.',
    language: 'python',
    filename: 'domain.py',
    code: `import os

domain = os.environ["CDSW_DOMAIN"]       # ml-xxxx.a465-9q4k.cloudera.site
base_url = f"https://{domain}/api/v2"    # every REST call starts here`,
  },
  {
    name: 'CDSW_API_URL',
    summary: 'Internal API v1 URL',
    detail:
      'The internal API v1 URL, e.g. https://$CDSW_DOMAIN/api/v1. Derive the v2 host by stripping the /api/v1 suffix — this is the pattern Cloudera AMPs use.',
    language: 'python',
    filename: 'api_url.py',
    code: `import os

api_v1 = os.environ["CDSW_API_URL"]              # https://<domain>/api/v1
host = api_v1.replace("/api/v1", "")             # v2 lives at {host}/api/v2/...`,
  },
  {
    name: 'CDSW_API_KEY',
    summary: 'Legacy v1 key (deprecated)',
    detail:
      'The legacy API v1 key, used with HTTP Basic auth against /api/v1. The v1 Jobs API is deprecated — prefer CDSW_APIV2_KEY and API v2 for everything new.',
    language: 'python',
    filename: 'legacy.py',
    code: `import os

legacy_key = os.environ["CDSW_API_KEY"]  # v1 Basic auth — deprecated
v2_key = os.environ["CDSW_APIV2_KEY"]    # use this instead`,
  },
  {
    name: 'CDSW_PROJECT_ID',
    summary: "Current project's ID",
    detail:
      'The ID of the project this engine belongs to. Every API v2 resource path nests under it: /api/v2/projects/{project_id}/jobs, /models, /applications, …',
    language: 'python',
    filename: 'project.py',
    code: `import os

project_id = os.environ["CDSW_PROJECT_ID"]
# e.g. POST /api/v2/projects/{project_id}/jobs/{job_id}/runs`,
  },
  {
    name: 'CDSW_PROJECT',
    summary: 'Project name',
    detail: 'The display name of the current project.',
    language: 'python',
    filename: 'name.py',
    code: `import os

project_name = os.environ["CDSW_PROJECT"]`,
  },
  {
    name: 'CDSW_PROJECT_URL',
    summary: 'Full project URL',
    detail: 'The full URL of the current project; the owner is a path segment.',
    language: 'python',
    filename: 'url.py',
    code: `import os

project_url = os.environ["CDSW_PROJECT_URL"]
# https://<domain>/<owner>/<project-name>`,
  },
  {
    name: 'CDSW_ENGINE_ID',
    summary: 'Engine ID (session subdomain)',
    detail:
      'The session/job engine ID, which doubles as the session subdomain. Anything bound to CDSW_APP_PORT inside a running session is reachable at https://<$CDSW_ENGINE_ID>.<$CDSW_DOMAIN> — great for prototyping a FastAPI server before promoting it to an Application.',
    language: 'python',
    filename: 'engine.py',
    code: `import os

engine = os.environ["CDSW_ENGINE_ID"]
domain = os.environ["CDSW_DOMAIN"]
# prototyping URL:  https://{engine}.{domain}
# read-only server: https://read-only-{engine}.{domain}`,
  },
  {
    name: 'CDSW_APP_PORT',
    summary: 'Web app port (8090)',
    detail:
      'The port an embedded web server must bind to (default 8090), on host 127.0.0.1. Applications and in-session servers are exposed through it.',
    language: 'python',
    filename: 'app.py',
    code: `import os, uvicorn

uvicorn.run(app, host="127.0.0.1", port=int(os.environ["CDSW_APP_PORT"]))  # 8090`,
  },
  {
    name: 'CDSW_READONLY_PORT',
    summary: 'Read-only port (8100)',
    detail: 'Port 8100 — for read-only dashboards served from an engine.',
    language: 'python',
    filename: 'readonly.py',
    code: `import os

port = int(os.environ.get("CDSW_READONLY_PORT", 8100))  # read-only dashboards`,
  },
  {
    name: 'CDSW_CPU_MILLICORES',
    summary: 'vCPU allocation',
    detail: 'The engine\'s CPU allocation in millicores (1000 = 1 vCPU).',
    language: 'python',
    filename: 'resources.py',
    code: `import os

vcpu = int(os.environ["CDSW_CPU_MILLICORES"]) / 1000`,
  },
  {
    name: 'CDSW_MEMORY_MB',
    summary: 'Memory allocation',
    detail: 'The engine\'s memory allocation in MB.',
    language: 'python',
    filename: 'resources.py',
    code: `import os

mem_gb = int(os.environ["CDSW_MEMORY_MB"]) / 1024`,
  },
  {
    name: 'CDSW_IP_ADDRESS',
    summary: 'Engine pod IP',
    detail: 'The engine pod\'s IP address on the workspace network.',
    language: 'python',
    filename: 'network.py',
    code: `import os

ip = os.environ["CDSW_IP_ADDRESS"]`,
  },
];

function EnvVarExplorer() {
  const [selected, setSelected] = useState('CDSW_APIV2_KEY');
  const current = ENV_VARS.find((v) => v.name === selected) ?? ENV_VARS[0];

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)]">
      {/* variable list */}
      <motion.ul
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: '-10% 0px' }}
        transition={{ staggerChildren: 0.035 }}
        className="flex flex-col gap-1.5"
      >
        {ENV_VARS.map((v) => {
          const active = v.name === selected;
          return (
            <motion.li
              key={v.name}
              variants={{
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } },
              }}
            >
              <button
                type="button"
                onClick={() => setSelected(v.name)}
                aria-pressed={active}
                className={cn(
                  'flex w-full items-baseline justify-between gap-3 rounded-lg border px-3.5 py-2.5 text-left transition-colors',
                  active
                    ? 'border-accent/60 bg-accent-dim/60'
                    : 'border-line bg-raised hover:border-line-bright',
                )}
              >
                <span
                  className={cn(
                    'font-mono text-[13px] font-medium',
                    active ? 'text-accent' : 'text-ink',
                  )}
                >
                  {v.name}
                </span>
                <span className="hidden truncate text-[12px] text-dim sm:inline">
                  {v.summary}
                </span>
              </button>
            </motion.li>
          );
        })}
      </motion.ul>

      {/* detail panel */}
      <div className="min-w-0 rounded-[10px] border border-line bg-raised p-5 lg:sticky lg:top-24 lg:self-start">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={current.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
          >
            <p className="font-mono text-[15px] font-bold text-accent">{current.name}</p>
            <p className="mt-2.5 text-[14.5px] leading-relaxed text-body">{current.detail}</p>
            {current.code && (
              <CodeBlock
                className="mt-4"
                code={current.code}
                language={current.language ?? 'python'}
                filename={current.filename}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

/* --------------------------- API key stepper --------------------------- */

const VERIFY_CODE = `export CDSW_DOMAIN="ml-xxxx123456.a465-9q4k.cloudera.site"
export API_KEY="<your api v2 key>"
curl -X GET -H "Authorization: Bearer $API_KEY" \\
  https://$CDSW_DOMAIN/api/v2/projects | jq`;

const STEPS: { title: string; body: ReactNode; code?: boolean }[] = [
  {
    title: 'Create the key',
    body: (
      <>
        Open your workspace → <strong className="text-ink">User Settings → API Keys → Create
        API Key</strong>.
      </>
    ),
  },
  {
    title: 'Pick the right audience',
    body: (
      <>
        Choose <strong className="text-ink">Audience: <code>API</code></strong> for API v2 access
        (<code>Application</code> is for calling app/model subdomains). Optionally set an expiry.
      </>
    ),
  },
  {
    title: 'Send it as a Bearer token',
    body: (
      <>
        Store it as <code>$API_KEY</code>. Send it on every request:{' '}
        <code>Authorization: Bearer &lt;key&gt;</code>.
      </>
    ),
  },
  {
    title: 'Verify with one call',
    body: (
      <>
        List your projects. A <code>200</code> with a JSON body means the key works; a{' '}
        <code>401</code> means the header is wrong.
      </>
    ),
    code: true,
  },
];

function ApiKeyStepper() {
  const rootRef = useRef<HTMLOListElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (lineRef.current) {
        gsap.fromTo(
          lineRef.current,
          { scaleY: 0 },
          {
            scaleY: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 75%',
              end: 'bottom 55%',
              scrub: 0.4,
            },
          },
        );
      }
      gsap.utils.toArray<HTMLElement>('[data-step]', rootRef.current ?? undefined).forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.5,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: el,
            start: 'top 85%',
            toggleActions: 'play none none none',
          },
        });
      });
    },
    { scope: rootRef },
  );

  return (
    <ol ref={rootRef} className="relative space-y-8">
      {/* connecting line */}
      <div
        aria-hidden="true"
        className="absolute bottom-4 left-[19px] top-4 w-px bg-line"
      >
        <div ref={lineRef} className="h-full w-full origin-top bg-accent" />
      </div>
      {STEPS.map((s, i) => (
        <li key={s.title} data-step className="relative pl-14">
          <span
            aria-hidden="true"
            className="absolute left-0 top-0 flex h-10 w-10 items-center justify-center rounded-full border border-accent/60 bg-base font-mono text-[13px] font-bold text-accent"
          >
            {i + 1}
          </span>
          <h3 className="pt-1.5 font-display text-[19px] font-semibold text-ink">{s.title}</h3>
          <p className="mt-1.5 text-[15px] leading-relaxed text-body">{s.body}</p>
          {s.code && (
            <CodeBlock className="mt-4" code={VERIFY_CODE} language="shell" filename="verify.sh" />
          )}
        </li>
      ))}
    </ol>
  );
}

/* --------------------------------- page -------------------------------- */

export default function Concepts() {
  return (
    <div className="mx-auto max-w-content px-5 lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-12 lg:px-8">
      <DocsSidebar sections={SECTIONS} />

      <article className="min-w-0 max-w-[880px]">
        {/* ---------------- Section 1 — page header ---------------- */}
        <section id="what-is-cml" className="scroll-mt-24 pt-16 lg:pt-24">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT }}
            className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
          >
            {'// 01 — CONCEPTS'}
          </motion.p>
          <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-ink md:text-[56px]">
            <SplitWords text="The mental model." inView={false} />
          </h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT }}
            className="mt-5 max-w-[62ch] text-lg leading-relaxed text-body"
          >
            Cloudera Machine Learning — rebranded <strong className="text-ink">Cloudera AI</strong> —
            is a project-scoped ML workspace on Kubernetes. Everything you run (a session, a job, a
            model, an app) is an isolated engine container launched from a project&apos;s files.
          </motion.p>

          <div id="naming-corrections" className="mt-8 scroll-mt-28">
            <Callout variant="correction" title="CML ≠ CDSW, and CML is now Cloudera AI">
              CML was rebranded <strong className="text-ink">Cloudera AI</strong>. Cloud docs live
              under <code>docs.cloudera.com/machine-learning/cloud/…</code>.{' '}
              <strong className="text-ink">CDSW</strong> (Cloudera Data Science Workbench) is the
              legacy on-prem predecessor — same Jobs concepts, older API.
            </Callout>
          </div>
        </section>

        {/* ---------------- Section 2 — object hierarchy ---------------- */}
        <section id="object-hierarchy" className="scroll-mt-24 py-16 lg:py-20">
          <SectionHeader eyebrow="// 02 — OBJECT HIERARCHY" title="Everything hangs off a project.">
            One workspace hosts many projects; each project owns its files, environment, and five
            kinds of runnable objects. Hover a node for its API base path — click to jump to the
            page that covers it.
          </SectionHeader>

          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ duration: 0.4 }}
            className="mt-10 rounded-[10px] border border-line bg-base/60 p-6 lg:p-8"
          >
            <ObjectHierarchyTree />
          </motion.div>

          <Callout variant="tip" className="mt-8">
            Jobs, models and apps are all <strong className="text-ink">project-scoped</strong> —
            scripts and dependencies must exist inside the same project.
          </Callout>
        </section>

        {/* ---------------- Section 3 — project anatomy ---------------- */}
        <section id="project-anatomy" className="scroll-mt-24 py-16 lg:py-20">
          <SectionHeader eyebrow="// 03 — PROJECT ANATOMY" title="Four ways to run code.">
            A <strong className="text-ink">job</strong> automates launching an engine, running a
            script, and tracking results in one batch process. Each run launches its own container
            with the job&apos;s configured vCPU/memory/GPU profile — the same isolation model as
            sessions, but non-interactive.
          </SectionHeader>

          <DataTable
            className="mt-8"
            columns={['Primitive', 'Lifecycle', 'Trigger', 'Exposed at']}
            rows={[
              [
                'Session',
                'Interactive, manual stop',
                <>UI / <code>create_session</code></>,
                'Workbench UI',
              ],
              [
                'Job',
                <>Batch run → terminal status</>,
                <>Manual, cron <code>schedule</code>, or <code>parent_job_id</code></>,
                'History tab + email reports',
              ],
              [
                'Model',
                <>build → deploy → <code>deployed</code></>,
                'API v2',
                <code>https://modelservice.&lt;domain&gt;/model</code>,
              ],
              [
                'Application',
                <>Long-lived web server on <code>$CDSW_APP_PORT</code></>,
                'API v2 / UI',
                <code>https://&lt;subdomain&gt;.&lt;domain&gt;</code>,
              ],
            ]}
          />
        </section>

        {/* ---------------- Section 4 — environment variables ---------------- */}
        <section id="env-vars" className="scroll-mt-24 py-16 lg:py-20">
          <SectionHeader eyebrow="// 04 — ENVIRONMENT VARIABLES" title="os.environ is your config layer.">
            Every CML engine — session, job, model replica, app — gets these injected. Select a
            variable to see what it holds and how to use it.
          </SectionHeader>

          <div className="mt-10">
            <EnvVarExplorer />
          </div>

          <Callout variant="info" className="mt-8">
            Outside CML there are no env vars — copy the domain from the browser address bar,
            create an API v2 key under <strong className="text-ink">User Settings → API
            Keys</strong>, and pass both to <code>default_client(url=…, cml_api_key=…)</code>.
          </Callout>
        </section>

        {/* ---------------- Section 5 — getting your API key ---------------- */}
        <section id="api-key" className="scroll-mt-24 py-16 lg:py-20">
          <SectionHeader eyebrow="// 05 — API KEY" title="Getting your API key.">
            One key unlocks every endpoint on this site. Four steps, thirty seconds.
          </SectionHeader>

          <div className="mt-10">
            <ApiKeyStepper />
          </div>

          <Callout variant="correction" className="mt-8">
            If you see{' '}
            <code>missing &quot;Bearer&quot; prefix in &quot;authorization&quot; header</code>, your
            header is missing or malformed. The legacy <code>/api/v1</code> Jobs API (HTTP Basic
            auth) is deprecated.
          </Callout>

          <div className="mt-10">
            <p className="font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-dim">
              Docs served by your own workspace
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <EndpointRow
                method="GET"
                path="https://<domain>/api/v2/swagger.html"
                sdk="REST reference (Swagger UI)"
              />
              <EndpointRow
                method="GET"
                path="https://<domain>/api/v2/python.html"
                sdk="Python client docs"
              />
              <EndpointRow
                method="GET"
                path="https://<domain>/api/v2/swagger.json"
                sdk="raw OpenAPI spec"
              />
              <EndpointRow
                method="GET"
                path="https://<domain>/api/v2/python.tar.gz"
                sdk="the cmlapi SDK itself"
              />
            </div>
          </div>
        </section>
      </article>
    </div>
  );
}
