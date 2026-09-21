import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';

export interface DocsSection {
  id: string;
  label: string;
}

interface DocsSidebarProps {
  sections: DocsSection[];
  className?: string;
}

function scrollToSection(id: string) {
  const el = document.getElementById(id);
  if (el) {
    const y = el.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }
}

/**
 * Sticky docs sidebar with scroll-spy. Page agents pass their section list.
 * Desktop: vertical mono links with a 2px left rail (accent on active).
 * Mobile: horizontal chip scroller rendered under the nav (use <DocsSidebar/> at
 * the top of the article column — the vertical variant hides below lg).
 */
export default function DocsSidebar({ sections, className }: DocsSidebarProps) {
  const [active, setActive] = useState<string>(sections[0]?.id ?? '');

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(entry.target.id);
        }
      },
      { rootMargin: '-96px 0px -65% 0px', threshold: 0 },
    );
    for (const s of sections) {
      const el = document.getElementById(s.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [sections]);

  return (
    <>
      {/* Desktop rail */}
      <nav aria-label="Page sections" className={cn('hidden lg:block', className)}>
        <div className="sticky top-24">
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.14em] text-dim">
            On this page
          </p>
          <ul className="space-y-0.5">
            {sections.map((s) => {
              const isActive = s.id === active;
              return (
                <li key={s.id} className="relative">
                  <span
                    aria-hidden="true"
                    className={cn(
                      'absolute inset-y-1 left-0 w-0.5 rounded-full transition-colors',
                      isActive ? 'bg-accent' : 'bg-line',
                    )}
                  />
                  <button
                    type="button"
                    onClick={() => scrollToSection(s.id)}
                    className={cn(
                      'block w-full py-1.5 pl-4 text-left font-mono text-[13px] transition-colors',
                      isActive ? 'text-accent' : 'text-dim hover:text-ink',
                    )}
                  >
                    {s.label}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      </nav>

      {/* Mobile chip scroller */}
      <nav
        aria-label="Page sections"
        className="sticky top-16 z-30 -mx-5 flex gap-2 overflow-x-auto border-b border-line bg-base/90 px-5 py-2.5 backdrop-blur-md lg:hidden"
      >
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            onClick={() => scrollToSection(s.id)}
            className={cn(
              'shrink-0 rounded-full border px-3 py-1 font-mono text-[12px] transition-colors',
              s.id === active
                ? 'border-accent/60 bg-accent-dim text-accent'
                : 'border-line text-dim hover:text-ink',
            )}
          >
            {s.label}
          </button>
        ))}
      </nav>
    </>
  );
}
