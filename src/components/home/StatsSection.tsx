import { useRef } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const STATS = [
  { value: 3, display: '3', caption: 'schedule types: manual · cron · dependent' },
  { value: 9, display: '9', caption: 'run states, from ENGINE_SCHEDULING to ENGINE_TIMEDOUT' },
  { value: 30, suffix: '+', display: '30+', caption: 'methods on one cmlapi.CMLServiceApi client' },
  { value: 5, prefix: '<', unit: ' MB', display: '<5 MB', caption: 'max JSON payload to a deployed model' },
];

/** Numbers band: GSAP count-up numerals when scrolled into view. */
export default function StatsSection() {
  const rootRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const numerals = gsap.utils.toArray<HTMLElement>('[data-stat-value]');
      numerals.forEach((el, i) => {
        const target = Number(el.dataset.statValue);
        const suffix = el.dataset.suffix ?? '';
        const prefix = el.dataset.prefix ?? '';
        const unit = el.dataset.unit ?? '';
        const counter = { v: 0 };
        gsap.to(counter, {
          v: target,
          duration: 1.2,
          ease: 'power2.out',
          scrollTrigger: {
            trigger: rootRef.current,
            start: 'top 80%',
            once: true,
          },
          onUpdate: () => {
            el.textContent = `${prefix}${Math.round(counter.v)}${suffix}${unit}`;
          },
          onComplete: () => {
            el.textContent = `${prefix}${target}${suffix}${unit}`;
          },
        });
        const caption = rootRef.current?.querySelectorAll('[data-stat-caption]')[i];
        if (caption) {
          gsap.from(caption, {
            opacity: 0,
            duration: 0.5,
            delay: 1.0,
            scrollTrigger: { trigger: rootRef.current, start: 'top 80%', once: true },
          });
        }
      });
    },
    { scope: rootRef },
  );

  return (
    <section ref={rootRef} className="border-y border-line bg-raised/50">
      <div className="mx-auto grid max-w-content grid-cols-1 divide-y divide-line px-5 py-16 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x lg:px-8">
        {STATS.map((s) => (
          <div key={s.caption} className="px-2 py-8 text-center lg:px-6 lg:py-4">
            <div
              data-stat-value={s.value}
              data-suffix={s.suffix}
              data-prefix={s.prefix}
              data-unit={s.unit}
              className="font-display text-5xl font-bold text-accent"
            >
              {s.display}
            </div>
            <p data-stat-caption className="mx-auto mt-3 max-w-[220px] font-mono text-xs leading-relaxed text-dim">
              {s.caption}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
