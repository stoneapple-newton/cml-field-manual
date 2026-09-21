import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Copy, SquareArrowOutUpRight, Wrench } from 'lucide-react';
import Callout from '@/components/Callout';
import CodeBlock from '@/components/CodeBlock';
import DataTable from '@/components/DataTable';
import DocsSidebar from '@/components/DocsSidebar';
import type { DocsSection } from '@/components/DocsSidebar';
import EndpointRow from '@/components/EndpointRow';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const SECTIONS: DocsSection[] = [
  { id: 'base-url', label: 'base URL' },
  { id: 'auth', label: 'authentication' },
  { id: 'conventions', label: 'conventions' },
  { id: 'endpoints', label: 'endpoint map' },
  { id: 'sdk', label: 'the cmlapi SDK' },
  { id: 'builder', label: 'request builder' },
  { id: 'errors', label: 'error model' },
];

/* ------------------------------- headings ------------------------------- */

function WordRise({ text }: { text: string }) {
  return (
    <>
      {text.split(' ').map((w, i, arr) => (
        <span key={i} className="inline-block overflow-hidden whitespace-pre pb-1 align-bottom">
          <motion.span
            className="inline-block whitespace-pre"
            initial={{ y: 26, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-10% 0px' }}
            transition={{ delay: i * 0.04, duration: 0.5, ease: EASE_OUT }}
          >
            {w}
            {i < arr.length - 1 ? ' ' : ''}
          </motion.span>
        </span>
      ))}
    </>
  );
}

function SectionHead({
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
      <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">
        {eyebrow}
      </p>
      <h2 className="mt-3 font-display text-[32px] font-semibold leading-tight tracking-[-0.02em] text-ink md:text-4xl">
        <WordRise text={title} />
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

/* ---------------------------- base URL block ----------------------------- */

const BASE_URL_TEXT = 'https://<workspace-domain>/api/v2/<resource>';

function BaseUrlBlock() {
  const [n, setN] = useState(0);
  const [copied, setCopied] = useState(false);
  const done = n >= BASE_URL_TEXT.length;

  useEffect(() => {
    if (done) return;
    const t = window.setTimeout(() => setN((v) => v + 1), 12);
    return () => window.clearTimeout(t);
  }, [n, done]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(BASE_URL_TEXT);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, duration: 0.5, ease: EASE_OUT }}
      className="mt-10 overflow-hidden rounded-[10px] border border-line bg-code"
    >
      <div className="flex items-center justify-between gap-4 px-5 py-4 md:px-6">
        <p className="min-w-0 truncate font-mono text-[15px] text-ink md:text-xl">
          {done ? (
            <>
              <span className="text-dim">https://</span>
              <span className="text-accent">{'<workspace-domain>'}</span>
              <span className="text-dim">/api/v2/</span>
              <span className="text-accent">{'<resource>'}</span>
            </>
          ) : (
            <>
              {BASE_URL_TEXT.slice(0, n)}
              <span className="animate-caret-blink text-accent">▍</span>
            </>
          )}
        </p>
        {done && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            onClick={copy}
            className={cn(
              'flex shrink-0 items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[12px] transition-colors',
              copied
                ? 'border-accent/60 text-accent'
                : 'border-line text-dim hover:border-line-bright hover:text-ink',
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'copied' : 'copy'}
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/* ------------------------------ doc link chips --------------------------- */

const DOC_PATHS = [
  { path: '/api/v2/swagger.html', label: 'swagger.html — REST reference' },
  { path: '/api/v2/python.html', label: 'python.html — Python client docs' },
  { path: '/api/v2/swagger.json', label: 'swagger.json — raw spec' },
  { path: '/api/v2/python.tar.gz', label: 'python.tar.gz — cmlapi client' },
];

function DocChip({ path, label }: { path: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`https://<workspace-domain>${path}`);
    } catch {
      /* clipboard unavailable */
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1400);
  };
  return (
    <button
      type="button"
      onClick={copy}
      title={`${label} — click to copy URL`}
      className="inline-flex items-center gap-2 rounded-md border border-line px-3 py-1.5 font-mono text-[12px] text-body transition-colors hover:border-line-bright hover:text-accent"
    >
      {copied ? (
        <Check size={13} className="text-accent" />
      ) : (
        <SquareArrowOutUpRight size={12} className="text-dim" />
      )}
      {path}
    </button>
  );
}

/* ------------------------------ code strings ----------------------------- */

const AUTH_SH = `export CDSW_DOMAIN="ml-xxxx123456.a465-9q4k.cloudera.site"
export API_KEY="<your api v2 key>"
curl -X GET -H "Authorization: Bearer $API_KEY" https://$CDSW_DOMAIN/api/v2/projects | jq
`;

const SDK_INSTALL_SH = `# cmlapi is version-matched to your workspace — install it from there:
pip3 install https://$CDSW_DOMAIN/api/v2/python.tar.gz
`;

const CLIENT_PY = `import cmlapi

# Inside a CML session (env vars picked up automatically):
client = cmlapi.default_client()

# Outside a session:
client = cmlapi.default_client(url="https://" + CDSW_DOMAIN, cml_api_key=API_KEY)

# Manual construction (e.g. self-signed certs):
config = cmlapi.Configuration()
config.host = "https://" + CDSW_DOMAIN
config.ssl_ca_cert = "/path/to/ca.crt"
api = cmlapi.ApiClient(config)
api.set_default_header("authorization", "Bearer " + API_KEY)
client = cmlapi.CMLServiceApi(api)
`;

const CURSOR_PY = `from cmlapi import Cursor
import json

cursor = Cursor(client.list_runtimes,
                search_filter=json.dumps({"kernel": "Python 3.10", "edition": "Standard"}))
runtimes = cursor.items()
`;

/* ------------------------------ endpoint map ----------------------------- */

interface Endpoint {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  sdk: string;
}

const ENDPOINT_GROUPS: { group: string; rows: Endpoint[] }[] = [
  {
    group: 'Projects',
    rows: [
      {
        method: 'GET',
        path: '/api/v2/projects',
        sdk: 'list_projects(search_filter=…, page_size=…, page_token=…)',
      },
      { method: 'POST', path: '/api/v2/projects', sdk: 'create_project(CreateProjectRequest(…))' },
      { method: 'GET', path: '/api/v2/projects/{project_id}', sdk: 'get_project(project_id)' },
    ],
  },
  {
    group: 'Jobs',
    rows: [
      { method: 'GET', path: '/api/v2/projects/{project_id}/jobs', sdk: 'list_jobs(project_id)' },
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/jobs',
        sdk: 'create_job(body, project_id)',
      },
    ],
  },
  {
    group: 'Job runs',
    rows: [
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs',
        sdk: 'create_job_run(CreateJobRunRequest(), project_id, job_id)',
      },
      {
        method: 'GET',
        path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs',
        sdk: 'list_job_runs(project_id, job_id, sort="-created_at", page_size=1)',
      },
      {
        method: 'GET',
        path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs/{run_id}',
        sdk: 'get_job_run(project_id, job_id, run_id)',
      },
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/jobs/{job_id}/runs/{run_id}/stop',
        sdk: 'stop_job_run(project_id, job_id, run_id)',
      },
    ],
  },
  {
    group: 'Models',
    rows: [
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/models',
        sdk: 'create_model(CreateModelRequest(…), project_id)',
      },
    ],
  },
  {
    group: 'Model builds',
    rows: [
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/models/{model_id}/builds',
        sdk: 'create_model_build(body, project_id, model_id)',
      },
      {
        method: 'GET',
        path: '/api/v2/projects/{project_id}/models/{model_id}/builds/{build_id}',
        sdk: 'get_model_build(project_id, model_id, build_id)',
      },
    ],
  },
  {
    group: 'Deployments',
    rows: [
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/models/{model_id}/builds/{build_id}/deployments',
        sdk: 'create_model_deployment(body, project_id, model_id, build_id)',
      },
      {
        method: 'GET',
        path: '/api/v2/projects/{project_id}/models/{model_id}/builds/{build_id}/deployments/{deployment_id}',
        sdk: 'get_model_deployment(project_id, model_id, build_id, deployment_id)',
      },
    ],
  },
  {
    group: 'Applications',
    rows: [
      {
        method: 'POST',
        path: '/api/v2/projects/{project_id}/applications',
        sdk: 'create_application(CreateApplicationRequest(…), project_id)',
      },
    ],
  },
  {
    group: 'Runtimes',
    rows: [
      { method: 'GET', path: '/api/v2/runtimes', sdk: 'list_runtimes(search_filter=…)' },
    ],
  },
];

function EndpointMap() {
  return (
    <div className="space-y-8">
      {ENDPOINT_GROUPS.map((g, gi) => (
        <motion.div
          key={g.group}
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ duration: 0.5, delay: gi * 0.03, ease: EASE_OUT }}
        >
          <h3 className="sticky top-16 z-10 -mx-1 bg-base/95 px-1 py-2 font-mono text-[12px] font-semibold uppercase tracking-[0.12em] text-dim backdrop-blur-sm">
            <span className="text-accent">{String(gi + 1).padStart(2, '0')}</span> · {g.group}
          </h3>
          <div className="mt-2 space-y-2">
            {g.rows.map((r, ri) => (
              <motion.div
                key={r.path + r.method}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-5% 0px' }}
                transition={{ delay: ri * 0.03, duration: 0.3 }}
              >
                <EndpointRow method={r.method} path={r.path} sdk={r.sdk} />
              </motion.div>
            ))}
          </div>
        </motion.div>
      ))}
      <p className="font-mono text-[12px] text-dim">// click any row to copy the path</p>
    </div>
  );
}

/* ---------------------------- SDK method table --------------------------- */

const SDK_METHODS: [string, string][] = [
  ['Projects', 'list_projects · get_project · create_project · update_project · delete_project · list_project_files'],
  ['Jobs', 'list_jobs · create_job · get_job · update_job · delete_job'],
  ['Job runs', 'list_job_runs · create_job_run · get_job_run · stop_job_run · list_job_run_history'],
  ['Models', 'list_models · create_model · get_model · update_model · delete_model'],
  ['Model builds', 'list_model_builds · create_model_build · get_model_build · delete_model_build'],
  ['Model deployments', 'list_model_deployments · create_model_deployment · get_model_deployment · stop_model_deployment'],
  ['Applications', 'list_applications · create_application · get_application · update_application · delete_application · stop_application · restart_application'],
  ['Experiments', 'create_experiment · create_experiment_run · list_experiment_runs · get_experiment_run · delete_experiment*'],
  ['Runtimes', 'list_runtimes · get_runtime'],
  ['AI Registry', 'list_registered_models · get_registered_model · create_registered_model · …'],
];

/* --------------------------- request model chips ------------------------- */

const REQUEST_MODELS: { name: string; fields: string }[] = [
  {
    name: 'CreateProjectRequest',
    fields: 'name · description · … (see /api/v2/swagger.json)',
  },
  {
    name: 'CreateJobRequest',
    fields:
      'name · script · kernel / runtime_identifier · cpu · memory · nvidia_gpu · environment · arguments · timeout · kill_on_timeout · schedule ⊕ parent_job_id · recipients · attachments · runtime_addon_identifiers',
  },
  {
    name: 'CreateJobRunRequest',
    fields: 'project_id · job_id · environment · arguments — an empty body is fine',
  },
  {
    name: 'CreateModelRequest',
    fields:
      'project_id · name · description · disable_authentication · registered_model_id · visibility · run_as · auto_build_config / auto_deploy_model',
  },
  {
    name: 'CreateModelBuildRequest',
    fields:
      'project_id · model_id · file_path · function_name · kernel or runtime_identifier · runtime_addon_identifiers · comment · registered_model_version_id · auto_deployment_config',
  },
  {
    name: 'CreateModelDeploymentRequest',
    fields: 'project_id · model_id · build_id · cpu · memory · nvidia_gpus · replicas · environment',
  },
  {
    name: 'CreateApplicationRequest',
    fields:
      'name · subdomain · script · project_id · description · kernel / runtime_identifier · cpu · memory · nvidia_gpu · environment · bypass_authentication · port · static_subdomain',
  },
];

function ModelChips() {
  return (
    <div className="flex flex-wrap gap-2">
      {REQUEST_MODELS.map((m, i) => (
        <motion.span
          key={m.name}
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: '-10% 0px' }}
          transition={{ delay: i * 0.05, duration: 0.3, ease: EASE_OUT }}
          className="group relative"
        >
          <span className="inline-flex cursor-default rounded-md border border-line bg-surface px-2.5 py-1.5 font-mono text-[12px] text-ink transition-colors group-hover:border-accent/60 group-hover:text-accent">
            {m.name}
          </span>
          <span className="pointer-events-none absolute bottom-full left-0 z-20 mb-2 hidden w-72 rounded-md border border-line-bright bg-code p-3 font-mono text-[11px] leading-relaxed text-body shadow-xl group-hover:block">
            {m.fields}
          </span>
        </motion.span>
      ))}
    </div>
  );
}

/* ----------------------------- request builder --------------------------- */

type BuilderEndpoint =
  | 'create-job'
  | 'start-run'
  | 'list-runs'
  | 'create-model'
  | 'create-build'
  | 'create-deployment';

const BUILDER_ENDPOINTS: { id: BuilderEndpoint; label: string }[] = [
  { id: 'create-job', label: 'create job' },
  { id: 'start-run', label: 'start run' },
  { id: 'list-runs', label: 'list runs' },
  { id: 'create-model', label: 'create model' },
  { id: 'create-build', label: 'create build' },
  { id: 'create-deployment', label: 'create deployment' },
];

const AUTH_H = '-H "Authorization: Bearer $API_KEY" -H "Content-Type: application/json"';

function buildCurl(endpoint: BuilderEndpoint, domain: string, pid: string): string {
  const d = domain.replace(/^https?:\/\//, '').replace(/\/+$/, '') || '<workspace-domain>';
  const p = pid || '<project-id>';
  const base = `https://${d}/api/v2/projects/${p}`;
  switch (endpoint) {
    case 'create-job':
      return `curl -s -X POST ${AUTH_H} \
  ${base}/jobs \
  -d '{"name":"demo-job","script":"train.py","kernel":"python3","cpu":1,"memory":2}' | jq`;
    case 'start-run':
      return `curl -s -X POST ${AUTH_H} \
  ${base}/jobs/$JOB_ID/runs -d '{}' | jq`;
    case 'list-runs':
      return `curl -s -H "Authorization: Bearer $API_KEY" \
  "${base}/jobs/$JOB_ID/runs?sort=-created_at&pageSize=1" | jq '.job_runs[0].status'`;
    case 'create-model':
      return `curl -s -X POST ${AUTH_H} \
  ${base}/models \
  -d '{"name":"Demo Model","description":"demo","disable_authentication":false}' | jq`;
    case 'create-build':
      return `curl -s -X POST ${AUTH_H} \
  ${base}/models/$MODEL_ID/builds \
  -d '{"file_path":"predict.py","function_name":"predict","runtime_identifier":"'$RT_ID'"}' | jq`;
    case 'create-deployment':
      return `curl -s -X POST ${AUTH_H} \
  ${base}/models/$MODEL_ID/builds/$BUILD_ID/deployments \
  -d '{"cpu":1,"memory":2,"replicas":1}' | jq`;
  }
}

function buildPython(endpoint: BuilderEndpoint, pid: string): string {
  const p = pid || '<project-id>';
  switch (endpoint) {
    case 'create-job':
      return `client.create_job(
    cmlapi.CreateJobRequest(name="demo-job", script="train.py",
                            kernel="python3", cpu=1, memory=2),
    project_id="${p}")`;
    case 'start-run':
      return `run = client.create_job_run(cmlapi.CreateJobRunRequest(),
                            project_id="${p}", job_id=job.id)`;
    case 'list-runs':
      return `client.list_job_runs("${p}", job.id,
                     sort="-created_at", page_size=1)`;
    case 'create-model':
      return `model = client.create_model(
    cmlapi.CreateModelRequest(project_id="${p}", name="Demo Model",
                              description="demo", disable_authentication=False),
    "${p}")`;
    case 'create-build':
      return `build = client.create_model_build(
    cmlapi.CreateModelBuildRequest(project_id="${p}", model_id=model.id,
                                   file_path="predict.py", function_name="predict",
                                   runtime_identifier=rt_id),
    "${p}", model.id)`;
    case 'create-deployment':
      return `deployment = client.create_model_deployment(
    cmlapi.CreateModelDeploymentRequest(project_id="${p}", model_id=model.id,
                                        build_id=build.id, cpu=1, memory=2, replicas=1),
    "${p}", model.id, build.id)`;
  }
}

function RequestBuilder() {
  const [endpoint, setEndpoint] = useState<BuilderEndpoint>('create-job');
  const [domain, setDomain] = useState('ml-xxxx.a465-9q4k.cloudera.site');
  const [pid, setPid] = useState('<project-id>');

  // 150ms debounce on inputs before regenerating output
  const [out, setOut] = useState(() => ({
    curl: buildCurl('create-job', 'ml-xxxx.a465-9q4k.cloudera.site', '<project-id>'),
    py: buildPython('create-job', '<project-id>'),
  }));
  const [flash, setFlash] = useState(0);
  const first = useRef(true);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setOut({ curl: buildCurl(endpoint, domain, pid), py: buildPython(endpoint, pid) });
      if (first.current) {
        first.current = false;
      } else {
        setFlash((f) => f + 1);
      }
    }, 150);
    return () => window.clearTimeout(t);
  }, [endpoint, domain, pid]);

  const inputCls =
    'w-full rounded-md border border-line bg-raised px-3 py-2 font-mono text-[13px] text-ink outline-none transition-colors focus:border-accent/60';

  return (
    <div className="rounded-[10px] border border-line bg-raised p-5 md:p-6">
      <div className="flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.12em] text-dim">
        <Wrench size={13} className="text-accent" />
        Build your first call
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
            Endpoint
          </span>
          <select
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value as BuilderEndpoint)}
            className={cn(inputCls, 'cursor-pointer appearance-none')}
          >
            {BUILDER_ENDPOINTS.map((o) => (
              <option key={o.id} value={o.id} className="bg-raised">
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
            Workspace domain
          </span>
          <input
            value={domain}
            onChange={(e) => setDomain(e.target.value)}
            className={inputCls}
            spellCheck={false}
            placeholder="ml-xxxx.a465-9q4k.cloudera.site"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block font-mono text-[11px] uppercase tracking-[0.1em] text-dim">
            Project ID
          </span>
          <input
            value={pid}
            onChange={(e) => setPid(e.target.value)}
            className={inputCls}
            spellCheck={false}
            placeholder="<project-id>"
          />
        </label>
      </div>

      <motion.div
        key={flash}
        initial={{ boxShadow: '0 0 0 1px rgba(34, 211, 167, 0.55)' }}
        animate={{ boxShadow: '0 0 0 0px rgba(34, 211, 167, 0)' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="mt-5 rounded-[10px]"
      >
        <CodeBlock
          tabs={[
            { label: 'curl', code: out.curl, language: 'shell' },
            { label: 'Python (cmlapi)', code: out.py, language: 'python' },
          ]}
        />
      </motion.div>
      <p className="mt-3 font-mono text-[12px] text-dim">
        // output regenerates 150ms after you stop typing; copy button is in the block header
      </p>
    </div>
  );
}

/* ------------------------------ error model ------------------------------ */

function StatusChip({ label, tone }: { label: string; tone: 'ok' | 'bad' | 'muted' }) {
  const color = tone === 'ok' ? '#22D3A7' : tone === 'bad' ? '#F5675B' : '#7C8A9A';
  return (
    <span
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 font-mono text-[12px]"
      style={{ color }}
    >
      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

const LIFECYCLE: { area: string; chips: { label: string; tone: 'ok' | 'bad' | 'muted' }[] }[] = [
  {
    area: 'job run',
    chips: [
      { label: 'succeeded', tone: 'ok' },
      { label: 'failed', tone: 'bad' },
      { label: 'stopped', tone: 'muted' },
      { label: 'timedout', tone: 'muted' },
    ],
  },
  {
    area: 'model build',
    chips: [
      { label: 'built', tone: 'ok' },
      { label: 'build failed', tone: 'bad' },
    ],
  },
  {
    area: 'deployment',
    chips: [
      { label: 'deployed', tone: 'ok' },
      { label: 'stopped', tone: 'muted' },
      { label: 'failed', tone: 'bad' },
    ],
  },
  { area: 'project', chips: [{ label: 'creation_status == "success"', tone: 'ok' }] },
  { area: 'application', chips: [{ label: 'Running', tone: 'ok' }] },
];

/* ------------------------------ conventions ------------------------------ */

const CONVENTIONS: { title: string; body: ReactNode }[] = [
  {
    title: 'searchFilter',
    body: (
      <>
        Plain substring (<code>?searchFilter=demo</code>) or a URL-encoded JSON field filter:{' '}
        <code>{'search_filter=json.dumps({"name": "my-project"})'}</code>.
      </>
    ),
  },
  {
    title: 'pageSize / pageToken',
    body: (
      <>
        Responses end with <code>next_page_token</code>; request the next page with{' '}
        <code>?pageSize=2&pageToken=&lt;token&gt;</code> — re-send the same <code>pageSize</code>.
      </>
    ),
  },
  {
    title: 'sort',
    body: (
      <>
        <code>sort="-created_at"</code> for newest first.
      </>
    ),
  },
  {
    title: 'status ≠ HTTP',
    body: (
      <>
        HTTP 200 means the request was <em>accepted</em>; async resources (projects, builds,
        deployments, job runs, apps) carry their own lifecycle <code>status</code>. Poll them.
      </>
    ),
  },
];

/* --------------------------------- page ---------------------------------- */

export default function Api() {
  const errorRows = useMemo(
    () => [
      ['200', 'Accepted — async resources still carry their own lifecycle status; poll them'],
      ['400', 'Bad request / validation'],
      ['401', 'Unauthenticated — bad or missing Bearer key'],
      ['403', 'Unauthorized for the project'],
      ['404', 'Unknown id'],
      ['409', 'Conflict (e.g. duplicate subdomain)'],
      ['500', 'Internal'],
    ],
    [],
  );

  return (
    <div className="mx-auto max-w-content px-5 lg:px-8">
      <div className="lg:grid lg:grid-cols-[220px_minmax(0,1fr)] lg:gap-12">
        <DocsSidebar sections={SECTIONS} className="pt-14" />

        <article className="min-w-0 max-w-[880px] pb-24">
          {/* ================= Section 1 — header + base URL ================== */}
          <header id="base-url" className="scroll-mt-28 pt-14 md:pt-20">
            <motion.p
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: EASE_OUT }}
              className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
            >
              {'// 04 — API V2'}
            </motion.p>
            <h1 className="mt-4 font-display text-[44px] font-bold leading-[1.05] tracking-[-0.02em] text-ink md:text-[56px]">
              <WordRise text="One base URL. One Bearer key. Everything is a resource." />
            </h1>
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25, duration: 0.5, ease: EASE_OUT }}
              className="mt-5 max-w-[62ch] text-lg leading-relaxed text-body"
            >
              API v2 is a grpc-gateway-style HTTP/JSON API served by your workspace. If you can{' '}
              <code>curl</code>, you can drive projects, jobs, runs, models, and applications.
            </motion.p>

            <BaseUrlBlock />

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1, duration: 0.5 }}
              className="mt-4 max-w-[68ch] text-[14.5px] leading-relaxed text-dim"
            >
              The workspace domain is exactly the hostname in your browser address bar — no path
              prefix. Example:{' '}
              <code>https://ml-xxxx123456.a465-9q4k.cloudera.site/api/v2/projects</code>.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.1, duration: 0.45 }}
              className="mt-6"
            >
              <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.12em] text-dim">
                workspace-served docs — click to copy
              </p>
              <div className="flex flex-wrap gap-2">
                {DOC_PATHS.map((d) => (
                  <DocChip key={d.path} path={d.path} label={d.label} />
                ))}
              </div>
            </motion.div>
          </header>

          {/* ======================= Section 2 — auth ========================= */}
          <Section id="auth">
            <SectionHead eyebrow="// AUTHENTICATION" title="API key v2, as a Bearer token">
              <p>
                Create a key in the UI:{' '}
                <strong className="text-ink">User Settings → API Keys → Create API Key</strong>.
                Choose Audience <code>API</code> for API v2 (choose <code>Application</code> for
                keys that call model/app subdomains). Send it as a Bearer token on every request.
              </p>
            </SectionHead>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-8"
            >
              <CodeBlock code={AUTH_SH} language="shell" filename="auth + first call" />
            </motion.div>

            <div className="mt-6">
              <Callout variant="correction">
                Missing/malformed header returns{' '}
                <code>missing "Bearer" prefix in "authorization" header</code>. The legacy v1 API (
                <code>/api/v1/…</code>, HTTP Basic with the legacy key) is{' '}
                <strong className="text-ink">deprecated</strong>.
              </Callout>
            </div>
          </Section>

          {/* ==================== Section 3 — conventions ===================== */}
          <Section id="conventions">
            <SectionHead eyebrow="// CONVENTIONS" title="Filtering, sorting, pagination">
              <p>All list endpoints share the same conventions.</p>
            </SectionHead>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {CONVENTIONS.map((c, i) => (
                <motion.div
                  key={c.title}
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ delay: i * 0.08, duration: 0.4, ease: EASE_OUT }}
                  className="rounded-[10px] border border-line bg-raised p-5"
                >
                  <h3 className="font-mono text-[13px] font-semibold text-accent">{c.title}</h3>
                  <p className="mt-2 text-[14px] leading-relaxed text-body">{c.body}</p>
                </motion.div>
              ))}
            </div>
          </Section>

          {/* ==================== Section 4 — endpoint map ==================== */}
          <Section id="endpoints">
            <SectionHead eyebrow="// ENDPOINT MAP" title="The full lifecycle, grouped">
              <p>
                Every REST path with its matching <code>cmlapi</code> SDK method. The path template
                parameters (<code>project_id</code>, <code>job_id</code>, <code>model_id</code>, …)
                are returned by the call above them.
              </p>
            </SectionHead>
            <div className="mt-8">
              <EndpointMap />
            </div>
          </Section>

          {/* ====================== Section 5 — the SDK ======================= */}
          <Section id="sdk">
            <SectionHead eyebrow="// THE CMLAPI SDK" title="One client. Every method.">
              <p>
                The official Python client is version-matched to your workspace and installed from
                the workspace itself.
              </p>
            </SectionHead>

            <div className="mt-6">
              <Callout variant="correction">
                <strong className="text-ink">
                  <code>cmlapi</code> is NOT on PyPI
                </strong>{' '}
                — <code>pip install cmlapi</code> fails. Install the version-matched client from
                your own workspace: <code>pip3 install https://$CDSW_DOMAIN/api/v2/python.tar.gz</code>.
                Inside a CML session it&rsquo;s typically preinstalled.
              </Callout>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-6"
            >
              <CodeBlock code={SDK_INSTALL_SH} language="shell" filename="install" />
            </motion.div>

            <div className="mt-6">
              <Callout variant="info">
                The package exposes{' '}
                <strong className="text-ink">one monolithic class, <code>cmlapi.CMLServiceApi</code></strong>,
                with every method on it — there are no separate <code>ProjectApi</code>/
                <code>JobsApi</code> classes. Returned objects use{' '}
                <strong className="text-ink">attribute access</strong> (<code>proj.id</code>, not{' '}
                <code>proj["id"]</code>). Exceptions:{' '}
                <code>from cmlapi.rest import ApiException</code>.
              </Callout>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-6"
            >
              <CodeBlock code={CLIENT_PY} language="python" filename="client construction" />
            </motion.div>

            <div className="mt-8">
              <DataTable columns={['area', 'methods on CMLServiceApi']} rows={SDK_METHODS} />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-8"
            >
              <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.12em] text-dim">
                pagination helper — auto-pages any list method
              </p>
              <CodeBlock code={CURSOR_PY} language="python" filename="cursor.py" />
            </motion.div>

            <div className="mt-8">
              <p className="mb-3 font-mono text-[12px] uppercase tracking-[0.12em] text-dim">
                request models — hover a chip for its key fields
              </p>
              <ModelChips />
            </div>
          </Section>

          {/* =================== Section 6 — request builder =================== */}
          <Section id="builder">
            <SectionHead eyebrow="// REQUEST BUILDER" title="Leave with a command ready to paste">
              <p>
                Pick an endpoint, drop in your workspace domain and project ID — the exact curl
                command and the equivalent <code>cmlapi</code> call regenerate live.
              </p>
            </SectionHead>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-8"
            >
              <RequestBuilder />
            </motion.div>
          </Section>

          {/* ====================== Section 7 — errors ======================== */}
          <Section id="errors" className="border-b-0">
            <SectionHead eyebrow="// ERROR MODEL" title="HTTP codes + lifecycle statuses">
              <p>
                Error payloads are JSON with an <code>error</code>/<code>code</code>/
                <code>message</code> structure (google.rpc Status shape).
              </p>
            </SectionHead>

            <div className="mt-8">
              <DataTable columns={['code', 'meaning']} rows={errorRows} />
            </div>

            <div className="mt-8 space-y-3">
              <p className="font-mono text-[12px] uppercase tracking-[0.12em] text-dim">
                lifecycle statuses to poll
              </p>
              {LIFECYCLE.map((l, i) => (
                <motion.div
                  key={l.area}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-10% 0px' }}
                  transition={{ delay: i * 0.05, duration: 0.35 }}
                  className="flex flex-wrap items-center gap-2"
                >
                  <span className="w-32 shrink-0 font-mono text-[12px] text-dim">{l.area}</span>
                  {l.chips.map((c) => (
                    <StatusChip key={c.label} label={c.label} tone={c.tone} />
                  ))}
                </motion.div>
              ))}
              <p className="pt-2 text-[14px] text-dim">
                Some newer builds surface <code>ENGINE_*</code> variants — see{' '}
                <Link to="/jobs#lifecycle" className="text-accent hover:underline">
                  /jobs#lifecycle
                </Link>
                .
              </p>
            </div>
          </Section>
        </article>
      </div>
    </div>
  );
}
