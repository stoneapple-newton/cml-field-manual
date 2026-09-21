import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const LINKS = [
  { label: 'Concepts', to: '/concepts' },
  { label: 'Jobs', to: '/jobs' },
  { label: 'Pipelines', to: '/workflows' },
  { label: 'API v2', to: '/api' },
  { label: 'Serving', to: '/serving' },
  { label: 'Walkthrough', to: '/walkthrough' },
];

export function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 44 44" fill="none" aria-hidden="true">
      <path d="M10 22 L20 10" stroke="#22D3A7" strokeWidth="2" strokeLinecap="round" />
      <path d="M10 22 L20 34" stroke="#22D3A7" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 10 L34 22" stroke="#22D3A7" strokeWidth="2" strokeLinecap="round" />
      <path d="M26 34 L34 22" stroke="#22D3A7" strokeWidth="2" strokeLinecap="round" />
      <rect x="3" y="17" width="10" height="10" rx="2.5" stroke="#22D3A7" strokeWidth="2" />
      <rect x="17" y="5" width="10" height="10" rx="2.5" stroke="#22D3A7" strokeWidth="2" />
      <rect x="17" y="29" width="10" height="10" rx="2.5" stroke="#22D3A7" strokeWidth="2" />
      <rect x="31" y="17" width="10" height="10" rx="2.5" fill="#22D3A7" fillOpacity="0.18" stroke="#22D3A7" strokeWidth="2" />
    </svg>
  );
}

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  // Close drawer on navigation
  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  // Lock scroll when drawer is open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  return (
    <>
      <header className="sticky top-0 z-50 h-16 border-b border-line bg-base/80 backdrop-blur-md">
        <div className="mx-auto flex h-full max-w-content items-center justify-between gap-6 px-5 lg:px-8">
          {/* Brand */}
          <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="CML Field Manual home">
            <LogoMark />
            <span className="font-display text-[15px] font-semibold tracking-[0.06em] text-ink">
              CML FIELD MANUAL
            </span>
            <span className="hidden rounded-md border border-accent/50 px-1.5 py-0.5 font-mono text-[10px] font-medium text-accent sm:inline-block">
              API v2
            </span>
          </Link>

          {/* Desktop links */}
          <nav className="hidden items-center gap-1 lg:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  cn(
                    'relative px-3 py-2 text-[14px] font-medium transition-colors',
                    isActive ? 'text-accent' : 'text-body hover:text-ink',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    {l.label}
                    {isActive && (
                      <motion.span
                        layoutId="nav-underline"
                        className="absolute inset-x-3 -bottom-[1px] h-0.5 rounded-full bg-accent"
                        transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                      />
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <Link
              to="/jobs#cheatsheet"
              className="hidden items-center gap-1.5 rounded-full border border-accent/60 px-3.5 py-1.5 font-mono text-[12px] font-medium text-accent transition-all hover:bg-accent-dim hover:shadow-glow sm:flex"
            >
              <Zap size={13} strokeWidth={2.2} />
              Cheat Sheet
            </Link>
            <button
              type="button"
              className="rounded-md p-2 text-body hover:text-ink lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? 'Close menu' : 'Open menu'}
              aria-expanded={open}
            >
              {open ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-base/97 pt-16 backdrop-blur-sm lg:hidden"
          >
            <nav className="flex flex-col gap-1 px-6 py-8" aria-label="Mobile">
              {LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, x: -18 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.06 * i, duration: 0.3 }}
                >
                  <NavLink
                    to={l.to}
                    className={({ isActive }) =>
                      cn(
                        'block border-b border-line py-4 font-display text-2xl font-semibold',
                        isActive ? 'text-accent' : 'text-ink',
                      )
                    }
                  >
                    {l.label}
                  </NavLink>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.06 * LINKS.length, duration: 0.3 }}
                className="pt-6"
              >
                <Link
                  to="/jobs#cheatsheet"
                  className="inline-flex items-center gap-2 rounded-full border border-accent/60 px-4 py-2 font-mono text-sm text-accent"
                >
                  <Zap size={14} />
                  Cheat Sheet
                </Link>
              </motion.div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
