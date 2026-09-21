import { motion } from 'framer-motion';

/**
 * Placeholder page for routes owned by page agents. Replaced per-page.
 */
export default function Stub({ title, eyebrow }: { title: string; eyebrow: string }) {
  return (
    <section className="mx-auto max-w-content px-5 py-24 lg:px-8">
      <motion.p
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="font-mono text-xs font-semibold uppercase tracking-[0.14em] text-accent"
      >
        {eyebrow}
      </motion.p>
      <motion.h1
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.08 }}
        className="mt-3 font-display text-5xl font-bold text-ink"
      >
        {title}
      </motion.h1>
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.45, delay: 0.2 }}
        className="mt-4 font-mono text-sm text-dim"
      >
        // section under construction
      </motion.p>
    </section>
  );
}
