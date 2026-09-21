import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STATIONS = [
  { n: '01', title: 'Concepts', desc: 'Workspace, projects, env vars', to: '/concepts' },
  { n: '02', title: 'Jobs', desc: 'Engines, scripts, cron', to: '/jobs' },
  { n: '03', title: 'Pipelines', desc: 'parent_job_id chains', to: '/workflows' },
  { n: '04', title: 'API v2', desc: 'Bearer auth, endpoints', to: '/api' },
  { n: '05', title: 'Serving', desc: 'Model builds + FastAPI apps', to: '/serving' },
  { n: '06', title: 'Walkthrough', desc: 'The full run, end to end', to: '/walkthrough' },
  { n: '07', title: 'Cheat sheet', desc: 'One table to rule it', to: '/jobs#cheatsheet' },
];

/**
 * Scroll-driven horizontal timeline of the guide's 7 stations.
 * Desktop: pinned for ~180vh, accent line draws left→right with scroll.
 * Mobile: plain vertical stack (no pin).
 */
export default function TimelineSection() {
  const rootRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add('(min-width: 1024px)', () => {
        const track = trackRef.current;
        if (!track) return;
        const getDistance = () => Math.max(0, track.scrollWidth - window.innerWidth + 96);

        gsap.to(track, {
          x: () => -getDistance(),
          ease: 'none',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 15%',
            end: '+=180%',
            pin: true,
            scrub: 0.6,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              const idx = Math.min(
                STATIONS.length - 1,
                Math.floor(self.progress * STATIONS.length),
              );
              setActiveIdx((prev) => (prev === idx ? prev : idx));
              if (lineRef.current) {
                lineRef.current.style.transform = `scaleX(${self.progress})`;
              }
            },
          },
        });

        gsap.utils.toArray<HTMLElement>('[data-station]').forEach((el, i) => {
          gsap.from(el, {
            opacity: 0,
            y: 24,
            duration: 0.5,
            ease: 'power2.out',
            delay: i * 0.05,
            scrollTrigger: {
              trigger: rootRef.current,
              start: 'top 15%',
              toggleActions: 'play none none none',
            },
          });
        });
      });
      return () => mm.revert();
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="relative overflow-hidden py-24 lg:py-0">
      <div className="mx-auto max-w-content px-5 lg:px-8">
        <p className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent">
          // 01 — THE SHAPE OF THE ANSWER
        </p>
        <h2 className="mt-3 font-display text-4xl font-semibold text-ink">
          One project. Three mechanisms.
        </h2>
        <p className="mt-4 max-w-2xl text-[17px] text-body">
          Everything in CML hangs off a project. This guide walks the full path — from a
          script in your project tree to a scheduled pipeline and a live prediction endpoint.
        </p>
      </div>

      {/* progress line (desktop) */}
      <div className="mx-auto mt-12 hidden max-w-content px-5 lg:block lg:px-8">
        <div className="h-px w-full bg-line">
          <div
            ref={lineRef}
            className="h-px origin-left bg-accent"
            style={{ transform: 'scaleX(0)' }}
          />
        </div>
      </div>

      {/* stations */}
      <div className="mt-10 lg:mt-14 lg:min-h-[320px]">
        <div
          ref={trackRef}
          className="flex flex-col gap-4 px-5 lg:w-max lg:flex-row lg:gap-6 lg:pl-8"
        >
          {STATIONS.map((s, i) => (
            <Link
              key={s.n}
              to={s.to}
              data-station
              className={cn(
                'group relative w-full rounded-[10px] border bg-raised p-6 transition-all duration-300 lg:w-[240px] lg:shrink-0',
                i === activeIdx
                  ? 'border-accent/60 shadow-glow lg:scale-[1.06]'
                  : 'border-line hover:border-line-bright',
              )}
            >
              <span
                className={cn(
                  'font-mono text-4xl font-bold transition-colors',
                  i === activeIdx ? 'text-accent' : 'text-line-bright',
                )}
              >
                {s.n}
              </span>
              <h3 className="mt-4 font-display text-xl font-semibold text-ink">{s.title}</h3>
              <p className="mt-1.5 text-sm text-dim">{s.desc}</p>
              <ArrowRight
                size={16}
                className="mt-4 text-dim transition-all group-hover:translate-x-1 group-hover:text-accent"
              />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
