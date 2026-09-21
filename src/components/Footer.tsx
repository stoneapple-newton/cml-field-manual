import { Link } from 'react-router-dom';
import { LogoMark } from '@/components/Navbar';

const PAGE_LINKS = [
  { label: 'Concepts', to: '/concepts' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Pipelines & Workflows', to: '/workflows' },
  { label: 'API v2', to: '/api' },
  { label: 'Serving', to: '/serving' },
  { label: 'Walkthrough', to: '/walkthrough' },
];

const SOURCES = [
  {
    label: 'Managing Jobs and Pipelines in Cloudera AI',
    href: 'https://docs.cloudera.com/machine-learning/cloud/jobs-pipelines/index.html',
  },
  {
    label: 'CML REST API v2 Reference',
    href: 'https://docs.cloudera.com/machine-learning/cloud/rest-api-reference/index.html',
  },
  {
    label: 'API v2 usage (Cloudera docs)',
    href: 'https://docs.cloudera.com/machine-learning/cloud/api/topics/ml-api-v2-usage.html',
  },
  {
    label: 'Apache Airflow in CDE',
    href: 'https://docs.cloudera.com/data-engineering/cloud/orchestrate-workflows/topics/cde-apache-airflow-introduction.html',
  },
];

export default function Footer() {
  return (
    <footer className="border-t border-line bg-raised">
      <div className="mx-auto max-w-content px-5 py-14 lg:px-8">
        <div className="grid gap-10 md:grid-cols-3">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2.5">
              <LogoMark size={20} />
              <span className="font-display text-[14px] font-semibold tracking-[0.06em] text-ink">
                CML FIELD MANUAL
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-dim">
              An independent engineering guide to Cloudera AI / CML. Not affiliated with Cloudera.
            </p>
          </div>

          {/* Pages */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-dim">
              Guide
            </h4>
            <ul className="mt-4 space-y-2.5">
              {PAGE_LINKS.map((l) => (
                <li key={l.to}>
                  <Link to={l.to} className="text-sm text-body transition-colors hover:text-accent">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Sources */}
          <div>
            <h4 className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-dim">
              Sources
            </h4>
            <ul className="mt-4 space-y-2.5">
              {SOURCES.map((s) => (
                <li key={s.href}>
                  <a
                    href={s.href}
                    target="_blank"
                    rel="noreferrer"
                    className="text-sm text-body transition-colors hover:text-accent"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-12 border-t border-line pt-6">
          <p className="font-mono text-xs text-dim">
            Built with the CML API v2 · statuses polled until{' '}
            <span className="text-accent">ENGINE_SUCCEEDED</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
