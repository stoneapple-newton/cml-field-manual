import { useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Send } from 'lucide-react';
import Callout from '@/components/Callout';
import CodeBlock from '@/components/CodeBlock';
import DataTable from '@/components/DataTable';
import DocsSidebar from '@/components/DocsSidebar';
import EndpointRow from '@/components/EndpointRow';
import { cn } from '@/lib/utils';

const EASE_OUT = [0.16, 1, 0.3, 1] as [number, number, number, number];

const SECTIONS = [
  { id: 'two-ways', label: 'Two ways to serve' },
  { id: 'path-a', label: 'Path A: CML Model' },
  { id: 'build-deploy', label: 'Build & deploy' },
  { id: 'calling', label: 'Calling the model' },
  { id: 'fastapi', label: 'Path B: FastAPI app' },
  { id: 'compare', label: 'Model vs Application' },
];

/* ------------------------------- snippets ------------------------------- */

const PREDICT_PY = `# predict.py
import cml.models_v1 as models   # PBJ/ML Runtime library ("cdsw" is the deprecated legacy-engine equivalent)

@models.cml_model(metrics=True)  # decorator optional; metrics=True enables track_metric/UUID-wrapped responses
def predict(args):
    petal_length = float(args["petal_length"])
    result = model.predict([[petal_length]])
    return {"result": result[0][0]}`;

const CALL_CURL = `curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer $API_KEY" \\
  https://modelservice.$CDSW_DOMAIN/model \\
  -d '{"accessKey":"mgc4w3rdi4...","request":{"petal_length": 1.4}}'`;

const CALL_PYTHON = `import requests
resp = requests.post(
    f"https://modelservice.{os.environ['CDSW_DOMAIN']}/model",
    headers={"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"},
    json={"accessKey": ACCESS_KEY, "request": {"petal_length": 1.4}},
)
print(resp.json()["response"])`;

const APP_PY = `import os, uvicorn
from fastapi import FastAPI

app = FastAPI()

@app.post("/predict")
def predict(payload: dict):
    return {"prediction": sum(payload.values())}

if __name__ == "__main__":
    uvicorn.run(app, host="127.0.0.1", port=int(os.environ["CDSW_APP_PORT"]))  # 8090`;

const CREATE_APP_PY = `app = client.create_application(
    cmlapi.CreateApplicationRequest(
        name="churn-api", subdomain="churn-api-x7", script="app.py",
        runtime_identifier=rt_id, cpu=1, memory=2,
        bypass_authentication=False,
    ),
    project_id=project_id)

# poll until the app is serving:
while client.get_application(project_id, app.id).status != "Running":
    time.sleep(10)
# live at https://churn-api-x7.<workspace-domain>`;

/* ----------------------------- shared bits ------------------------------ */

function SectionHeading({
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
        className="mt-3 font-display text-3xl font-semibold text-ink lg:text-4xl"
      >
        {title}
      </motion.h2>
      {children && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-15% 0px' }}
          transition={{ duration: 0.5, delay: 0.12, ease: EASE_OUT }}
          className="mt-4 space-y-3 leading-relaxed text-body"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

/** Lifecycle status keyword chip (built / deployed / Running …). */
function StatusChip({ label, color }: { label: string; color: string }) {
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono text-[11px]"
      style={{ color, borderColor: `${color}55`, backgroundColor: `${color}14` }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}

function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/* --------------------------- split hero panels --------------------------- */

function PathPanel({
  variant,
  title,
  steps,
  target,
  delay,
}: {
  variant: 'model' | 'app';
  title: string;
  steps: string[];
  target: string;
  delay: number;
}) {
  const color = variant === 'model' ? '#22D3A7' : '#A78BFA';
  return (
    <motion.button
      type="button"
      onClick={() => scrollToId(target)}
      initial={{ opacity: 0, x: variant === 'model' ? -32 : 32 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6, delay, ease: EASE_OUT }}
      className="group relative overflow-hidden rounded-[10px] border border-line bg-raised p-6 text-left transition-colors hover:border-line-bright"
    >
      <span
        className="pointer-events-none absolute inset-x-0 top-0 h-[2px]"
        style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        aria-hidden="true"
      />
      <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em]" style={{ color }}>
        {variant === 'model' ? 'Path A' : 'Path B'}
      </p>
      <h3 className="mt-2 font-display text-xl font-semibold text-ink">{title}</h3>
      <div className="mt-4 flex flex-wrap items-center gap-y-2 font-mono text-[12px]">
        {steps.map((s, i) => (
          <span key={s} className="flex items-center">
            <span
              className="rounded-md border border-line bg-surface px-2 py-1 text-body transition-colors group-hover:border-line-bright"
              style={{ transitionDelay: `${i * 90}ms` }}
            >
              {s}
            </span>
            {i < steps.length - 1 && (
              <span
                className="-translate-x-1 px-1.5 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100"
                style={{ color, transitionDelay: `${i * 120}ms` }}
                aria-hidden="true"
              >
                →
              </span>
            )}
          </span>
        ))}
      </div>
      <p className="mt-4 flex items-center gap-1.5 font-mono text-[11px] text-dim transition-colors group-hover:text-ink">
        jump to section <ArrowRight size={12} style={{ color }} />
      </p>
    </motion.button>
  );
}

/* ------------------------------ mini console ----------------------------- */

const CONSOLE_RESPONSE = '{"response": {"result": 0}}';

function MiniConsole() {
  const [input, setInput] = useState('{"petal_length": 1.4}');
  const [phase, setPhase] = useState<'idle' | 'sending' | 'typing' | 'done'>('idle');
  const [typed, setTyped] = useState('');
  const timerRef = useRef<number | null>(null);

  const send = () => {
    if (phase === 'sending' || phase === 'typing') return;
    if (timerRef.current) window.clearTimeout(timerRef.current);
    setTyped('');
    setPhase('sending');
    timerRef.current = window.setTimeout(() => setPhase('typing'), 400);
  };

  useEffect(() => {
    if (phase !== 'typing') return;
    let i = 0;
    const t = window.setInterval(() => {
      i += 1;
      setTyped(CONSOLE_RESPONSE.slice(0, i));
      if (i >= CONSOLE_RESPONSE.length) {
        window.clearInterval(t);
        setPhase('done');
      }
    }, 28);
    return () => window.clearInterval(t);
  }, [phase]);

  useEffect(
    () => () => {
      if (timerRef.current) window.clearTimeout(timerRef.current);
    },
    [],
  );

  return (
    <div className="overflow-hidden rounded-[10px] border border-line bg-code">
      <div className="flex h-9 items-center justify-between border-b border-line bg-surface px-3">
        <span className="font-mono text-[11px] text-dim">modelservice — try it</span>
        <span className="rounded border border-amber/50 bg-amber-dim/50 px-1.5 py-px font-mono text-[10px] text-amber">
          simulated
        </span>
      </div>
      <div className="space-y-3 p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            aria-label="Request JSON"
            className="min-w-0 flex-1 rounded-md border border-line bg-base px-3 py-2 font-mono text-[13px] text-ink outline-none transition-colors focus:border-line-bright"
          />
          <motion.button
            type="button"
            onClick={send}
            whileTap={{ scale: 0.96 }}
            className="flex items-center justify-center gap-2 rounded-md border border-accent/60 bg-accent-dim px-4 py-2 font-mono text-[12px] font-medium text-accent transition-colors hover:border-accent"
          >
            <Send size={13} />
            send
          </motion.button>
        </div>
        <div className="min-h-[52px] rounded-md border border-line bg-base p-3 font-mono text-[13px]">
          {phase === 'idle' && <span className="text-dim">// response appears here</span>}
          {phase === 'sending' && (
            <span className="flex items-center gap-2 text-blue">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-blue" />
              POST /model …
            </span>
          )}
          {(phase === 'typing' || phase === 'done') && (
            <span className="text-accent">
              {typed}
              {phase === 'typing' && <span className="animate-caret-blink">▌</span>}
            </span>
          )}
        </div>
        <p className="flex items-center justify-between font-mono text-[11px] text-dim">
          <span>request: {input || '∅'}</span>
          {phase === 'done' && <span className="text-accent">200 OK · 412 ms</span>}
        </p>
      </div>
    </div>
  );
}

/* ------------------------------ flow strip ------------------------------ */

const STAGES = [
  {
    title: 'create_model',
    sdk: 'CreateModelRequest',
    fields: ['name', 'description', 'disable_authentication'],
    statuses: [] as { label: string; color: string }[],
  },
  {
    title: 'create_model_build',
    sdk: 'CreateModelBuildRequest',
    fields: ['file_path', 'function_name', 'runtime_identifier'],
    statuses: [
      { label: 'built', color: '#22D3A7' },
      { label: 'build failed', color: '#F5675B' },
    ],
  },
  {
    title: 'create_model_deployment',
    sdk: 'CreateModelDeploymentRequest',
    fields: ['cpu', 'memory', 'replicas'],
    statuses: [
      { label: 'deployed', color: '#22D3A7' },
      { label: 'stopped', color: '#7C8A9A' },
      { label: 'failed', color: '#F5675B' },
    ],
  },
];

/* --------------------------------- page --------------------------------- */

export default function Serving() {
  return (
    <div className="mx-auto max-w-content px-5 lg:px-8">
      <div className="lg:grid lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
        <DocsSidebar sections={SECTIONS} className="pt-16 lg:pt-24" />

        <article className="min-w-0 max-w-[880px] pb-16">
          {/* ------------------------- Section 1: header ------------------------- */}
          <section id="two-ways" className="scroll-mt-24 pt-16 lg:pt-24">
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
            >
              {'// 05 — SERVING'}
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, delay: 0.06, ease: EASE_OUT }}
              className="mt-3 font-display text-4xl font-bold text-ink lg:text-6xl"
            >
              Two ways to serve.
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.14, ease: EASE_OUT }}
              className="mt-4 leading-relaxed text-body"
            >
              A <strong className="text-ink">CML Model</strong> is a managed prediction endpoint —
              you ship a <code>predict()</code> function, CML builds and hosts it. An{' '}
              <strong className="text-ink">Application</strong> is any long-lived web server —
              FastAPI, Flask, Streamlit — bound to <code>$CDSW_APP_PORT</code> and exposed on its
              own subdomain. Pick per use case; the comparison is at the bottom.
            </motion.p>

            <div className="mt-8 grid gap-4 md:grid-cols-2">
              <PathPanel
                variant="model"
                title="CML Model"
                steps={['predict.py', 'build', 'deploy', 'modelservice.<domain>/model']}
                target="path-a"
                delay={0.2}
              />
              <PathPanel
                variant="app"
                title="FastAPI Application"
                steps={['uvicorn', '127.0.0.1:8090', 'https://<subdomain>.<domain>']}
                target="fastapi"
                delay={0.28}
              />
            </div>
          </section>

          {/* ------------------------ Section 2: Path A ------------------------- */}
          <section id="path-a" className="scroll-mt-24 pt-16 lg:pt-24">
            <SectionHeading eyebrow="// PATH A" title="The CML Model">
              <p>
                A model is a <strong className="text-ink">project file containing a function</strong>{' '}
                (conventionally <code>predict</code>) that takes one JSON-deserialized dict and
                returns a JSON-serializable value. <code>file_path</code> +{' '}
                <code>function_name</code> are registered at build time.
              </p>
            </SectionHeading>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-8"
            >
              <CodeBlock code={PREDICT_PY} language="python" filename="predict.py" />
            </motion.div>

            <ul className="mt-6 space-y-2.5 text-body">
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  Decorator: <code>cml.models_v1.cml_model</code> — legacy engine equivalent:{' '}
                  <code>@cdsw.model_metrics</code>.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  Availability — legacy engine → <code>cdsw</code>; classic runtime → both; PBJ
                  runtime → <code>cml</code> only.
                </span>
              </li>
              <li className="flex gap-2.5">
                <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-hidden="true" />
                <span>
                  With <code>metrics=True</code>, responses are wrapped as{' '}
                  <code>{'{"uuid": …, "prediction": …}'}</code> and metrics are queryable via{' '}
                  <code>cml.metrics_v1</code>.
                </span>
              </li>
            </ul>
          </section>

          {/* --------------------- Section 3: build & deploy --------------------- */}
          <section id="build-deploy" className="scroll-mt-24 pt-16 lg:pt-24">
            <SectionHeading eyebrow="// LIFECYCLE" title="Build & deploy">
              <p>
                <strong className="text-ink">Build</strong> packages the project (git snapshot —
                keep files &gt;50 MB and <code>.git</code> out) into a Docker image with the REST
                wrapper; one model → many versioned builds.{' '}
                <strong className="text-ink">Deployment</strong> runs replicas of one build, sized
                by <code>cpu</code>/<code>memory</code>/<code>nvidia_gpus</code>/
                <code>replicas</code>. Only{' '}
                <strong className="text-ink">one active deployment per model</strong>; redeploying
                causes brief downtime.
              </p>
            </SectionHeading>

            {/* 3-stage flow strip */}
            <div className="mt-8 flex flex-col items-stretch gap-2 lg:flex-row lg:items-center">
              {STAGES.map((s, i) => (
                <div key={s.title} className="flex flex-1 flex-col items-stretch gap-2 lg:flex-row lg:items-center">
                  <motion.div
                    initial={{ opacity: 0, y: 16, scale: 0.97 }}
                    whileInView={{ opacity: 1, y: 0, scale: 1 }}
                    viewport={{ once: true, margin: '-12% 0px' }}
                    transition={{ duration: 0.45, delay: i * 0.15, ease: EASE_OUT }}
                    className="flex-1 rounded-[10px] border border-line bg-raised p-4"
                  >
                    <p className="font-mono text-[13px] font-medium text-accent">{s.title}</p>
                    <p className="mt-0.5 font-mono text-[11px] text-dim">{s.sdk}</p>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.fields.map((f) => (
                        <code key={f} className="text-[11px]">
                          {f}
                        </code>
                      ))}
                    </div>
                    {s.statuses.length > 0 && (
                      <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-line/60 pt-3">
                        <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-dim">
                          poll →
                        </span>
                        {s.statuses.map((st) => (
                          <StatusChip key={st.label} label={st.label} color={st.color} />
                        ))}
                      </div>
                    )}
                  </motion.div>
                  {i < STAGES.length - 1 && (
                    <motion.span
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.4, delay: 0.2 + i * 0.15 }}
                      className="self-center font-mono text-accent lg:px-1"
                      aria-hidden="true"
                    >
                      →
                    </motion.span>
                  )}
                </div>
              ))}
            </div>

            <div className="mt-6 space-y-2">
              <EndpointRow
                method="POST"
                path="/api/v2/projects/{project_id}/models"
                sdk="client.create_model(...)"
              />
              <EndpointRow
                method="POST"
                path="/api/v2/projects/{project_id}/models/{model_id}/builds"
                sdk="client.create_model_build(...)"
              />
              <EndpointRow
                method="POST"
                path="/api/v2/projects/{project_id}/models/{model_id}/builds/{build_id}/deployments"
                sdk="client.create_model_deployment(...)"
              />
            </div>

            <Callout variant="info" className="mt-6">
              JSON request payloads must be <strong className="text-ink">&lt; 5 MB</strong>;
              replicas may restart at any time — keep artifacts in external storage.
            </Callout>
          </section>

          {/* ---------------------- Section 4: call the model ---------------------- */}
          <section id="calling" className="scroll-mt-24 pt-16 lg:pt-24">
            <SectionHeading eyebrow="// INVOKE" title="Calling the model">
              <p>
                Each model has a per-model <strong className="text-ink">access key</strong>{' '}
                (Overview page, or <code>model.access_key</code> from the SDK). Serving lives on the
                dedicated <code>modelservice</code> subdomain:
              </p>
            </SectionHeading>

            <motion.div
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-8 rounded-[10px] border border-line bg-code p-4 font-mono text-[13px] leading-relaxed"
            >
              <p>
                <span
                  className="mr-2 rounded-md px-2 py-0.5 text-[11px] font-bold"
                  style={{ backgroundColor: '#5BA8F526', color: '#5BA8F5' }}
                >
                  POST
                </span>
                <span className="text-ink">https://modelservice.&lt;workspace-domain&gt;/model</span>
              </p>
              <p className="mt-3 text-dim">
                body{' '}
                <span className="text-body">
                  {'{'}<span className="text-blue">"accessKey"</span>: "…",{' '}
                  <span className="text-blue">"request"</span>: {'{…}'}
                  {'}'}
                </span>
              </p>
              <p className="text-dim">
                →{' '}
                <span className="text-body">
                  {'{'}<span className="text-blue">"response"</span>: …{'}'}
                </span>{' '}
                <span className="text-dim">(+ "uuid" with metrics enabled)</span>
              </p>
            </motion.div>

            <div className="mt-6">
              <CodeBlock
                tabs={[
                  { label: 'curl', code: CALL_CURL, language: 'shell' },
                  { label: 'Python (requests)', code: CALL_PYTHON, language: 'python' },
                ]}
                filename="invoke"
              />
            </div>

            <Callout variant="info" className="mt-6">
              If model authentication is not disabled, the Bearer key needs the{' '}
              <strong className="text-ink">Application</strong> audience. Equivalent form:{' '}
              <code>…/model?accessKey=&lt;key&gt;</code> with body{' '}
              <code>{'{"request": …}'}</code>.
            </Callout>

            <div className="mt-6">
              <MiniConsole />
            </div>
          </section>

          {/* ---------------------- Section 5: FastAPI app ---------------------- */}
          <section id="fastapi" className="scroll-mt-24 pt-16 lg:pt-24">
            <SectionHeading eyebrow="// PATH B" title="FastAPI as an Application">
              <p>
                <strong className="text-ink">
                  Yes — FastAPI, Flask, Dash, Streamlit, Gradio all run as CML Applications
                </strong>
                : long-lived web services launched from a project with their own resources, exposed
                at <code>https://&lt;subdomain&gt;.&lt;workspace-domain&gt;</code>.
              </p>
            </SectionHeading>

            {/* rules checklist */}
            <div className="mt-8 rounded-[10px] border border-line bg-raised p-5">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-purple">
                The rules
              </p>
              <ul className="mt-4 space-y-3.5">
                {[
                  <>
                    Bind the server to <code>127.0.0.1</code> on <code>$CDSW_APP_PORT</code>{' '}
                    (default <strong className="text-ink">8090</strong>;{' '}
                    <code>CDSW_READONLY_PORT</code> = 8100 for read-only dashboards).
                  </>,
                  <>
                    <code>subdomain</code> must be workspace-unique, <code>[a-z0-9-]</code>.
                  </>,
                  <>
                    Default access: project collaborators via CML login.{' '}
                    <code>bypass_authentication=True</code> makes it public. API keys with{' '}
                    <code>Application</code> audience also work:{' '}
                    <code>curl -H "authorization: Bearer $API_KEY" https://$CDSW_APP_DOMAIN</code>.
                  </>,
                  <>
                    <code>CDSW_APP_POLLING_ENDPOINT</code> customizes the health-check path
                    (default <code>/</code>).
                  </>,
                  <>
                    Manage via UI (Applications → New Application) or{' '}
                    <code>create_application</code> / <code>stop_application</code> /{' '}
                    <code>restart_application</code> / <code>delete_application</code>.
                  </>,
                ].map((item, i) => (
                  <motion.li
                    key={i}
                    initial={{ opacity: 0, x: -12 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: '-8% 0px' }}
                    transition={{ duration: 0.4, delay: i * 0.1, ease: EASE_OUT }}
                    className="flex gap-3 text-[15px] leading-relaxed text-body"
                  >
                    <motion.span
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true, margin: '-8% 0px' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 20, delay: i * 0.1 + 0.1 }}
                      className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-accent/60 bg-accent-dim"
                    >
                      <Check size={12} className="text-accent" strokeWidth={3} />
                    </motion.span>
                    <span>{item}</span>
                  </motion.li>
                ))}
              </ul>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-6"
            >
              <CodeBlock code={APP_PY} language="python" filename="app.py" />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 0.55, ease: EASE_OUT }}
              className="mt-6"
            >
              <CodeBlock code={CREATE_APP_PY} language="python" filename="create the application" />
            </motion.div>

            <Callout variant="tip" className="mt-6">
              Prototyping inside a session? Anything bound to <code>CDSW_APP_PORT</code> is
              reachable at <code>https://&lt;$CDSW_ENGINE_ID&gt;.&lt;$CDSW_DOMAIN&gt;</code>{' '}
              (read-only servers at{' '}
              <code>https://read-only-&lt;$CDSW_ENGINE_ID&gt;.&lt;$CDSW_DOMAIN&gt;</code>).
            </Callout>
          </section>

          {/* ---------------------- Section 6: comparison ---------------------- */}
          <section id="compare" className="scroll-mt-24 py-16 lg:py-24">
            <SectionHeading eyebrow="// DECIDE" title="Model vs Application" />

            <DataTable
              className="mt-8"
              columns={['', 'CML Model', 'Application (FastAPI)']}
              rows={[
                [
                  'Code contract',
                  <span key="a">
                    <code>predict(args)</code> function in a project file
                  </span>,
                  'Any web framework, any routes',
                ],
                [
                  'Endpoint',
                  <code key="b">https://modelservice.&lt;domain&gt;/model</code>,
                  <code key="c">https://&lt;subdomain&gt;.&lt;domain&gt;</code>,
                ],
                [
                  'Auth',
                  <span key="d">
                    per-model <code>accessKey</code> + optional Bearer
                  </span>,
                  <span key="e">
                    CML login, or <code>bypass_authentication</code> for public
                  </span>,
                ],
                [
                  'Lifecycle',
                  <span key="f">
                    create → build (<code>built</code>) → deploy (<code>deployed</code>)
                  </span>,
                  <span key="g">
                    create → poll <code>status == "Running"</code>
                  </span>,
                ],
                [
                  'Best for',
                  'Managed inference, metrics tracking, versioned builds',
                  'Custom APIs, dashboards, UIs, streaming responses',
                ],
              ]}
            />

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-12% 0px' }}
              transition={{ duration: 0.5, ease: EASE_OUT }}
              className="mt-8 flex flex-col items-start gap-5"
            >
              <p className="text-body">
                Both are API-v2 resources — the walkthrough deploys a model, then points you at the
                app pattern.
              </p>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to="/walkthrough"
                  className={cn(
                    'inline-flex items-center gap-2 rounded-[10px] border border-accent/60 bg-accent-dim',
                    'px-5 py-2.5 font-mono text-sm font-medium text-accent transition-colors hover:border-accent',
                  )}
                >
                  Run the end-to-end walkthrough
                  <ArrowRight size={15} />
                </Link>
              </motion.div>
            </motion.div>
          </section>
        </article>
      </div>
    </div>
  );
}
