import { useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, ChevronDown, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';

export type CodeLanguage = 'shell' | 'python' | 'json' | 'text';

export interface CodeTab {
  label: string;
  code: string;
  language: CodeLanguage;
}

interface CodeBlockProps {
  /** Single-snippet mode */
  code?: string;
  language?: CodeLanguage;
  /** Tabbed mode (e.g. curl | Python (cmlapi)) */
  tabs?: CodeTab[];
  filename?: string;
  lineNumbers?: boolean;
  /** Collapse long blocks to this height with a fade mask + Expand toggle. */
  maxHeight?: number;
  className?: string;
}

/* ------------------------------ tokenizer ------------------------------ */

const C = {
  comment: '#7C8A9A',
  string: '#A5D6A7',
  accent: '#22D3A7',
  purple: '#A78BFA',
  blue: '#5BA8F5',
  amber: '#F5A524',
  plain: '#B7C2CE',
};

interface Tok {
  text: string;
  color?: string;
}

const PY_KEYWORDS = new Set([
  'import', 'from', 'as', 'def', 'class', 'return', 'if', 'elif', 'else', 'for',
  'while', 'in', 'not', 'and', 'or', 'is', 'None', 'True', 'False', 'with',
  'try', 'except', 'finally', 'raise', 'pass', 'break', 'continue', 'lambda',
  'yield', 'global', 'assert', 'del', 'print',
]);

function pushGap(out: Tok[], gap: string) {
  if (gap) out.push({ text: gap });
}

function tokenizeLine(line: string, lang: CodeLanguage): Tok[] {
  const out: Tok[] = [];
  let re: RegExp;
  let colorFor: (m: RegExpExecArray) => string | undefined;

  if (lang === 'shell') {
    re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|(\$\{?[A-Za-z_][A-Za-z0-9_]*\}?)|(--?[A-Za-z][A-Za-z0-9-]*)/g;
    colorFor = (m) => (m[1] ? C.comment : m[2] ? C.string : C.accent);
  } else if (lang === 'python') {
    re = /(#.*$)|("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')|\b([A-Za-z_][A-Za-z0-9_]*)\b(\s*\()?|(\b\d+\.?\d*\b)/g;
    colorFor = (m) => {
      if (m[1]) return C.comment;
      if (m[2]) return C.string;
      if (m[3]) {
        if (m[4]) return C.blue; // function call
        if (PY_KEYWORDS.has(m[3])) return C.purple;
        return undefined;
      }
      if (m[5]) return C.amber;
      return undefined;
    };
  } else if (lang === 'json') {
    re = /("(?:[^"\\]|\\.)*")(\s*:)?|\b(true|false|null)\b|(-?\d+\.?\d*)/g;
    colorFor = (m) => {
      if (m[1]) return m[2] ? C.blue : C.string; // key vs value
      if (m[3]) return C.purple;
      if (m[4]) return C.amber;
      return undefined;
    };
  } else {
    return [{ text: line }];
  }

  let last = 0;
  let m: RegExpExecArray | null;
  while ((m = re.exec(line)) !== null) {
    pushGap(out, line.slice(last, m.index));
    const color = colorFor(m);
    const text = m[0];
    if (color) out.push({ text, color });
    else out.push({ text });
    last = m.index + text.length;
    if (text.length === 0) re.lastIndex += 1;
  }
  pushGap(out, line.slice(last));
  return out;
}

function renderCode(code: string, lang: CodeLanguage, lineNumbers: boolean): ReactNode {
  const lines = code.replace(/\n$/, '').split('\n');
  return lines.map((line, i) => (
    <div key={i} className="flex">
      {lineNumbers && (
        <span className="w-8 shrink-0 select-none pr-4 text-right font-mono text-dim/50">
          {i + 1}
        </span>
      )}
      <span className="whitespace-pre">
        {line.length === 0
          ? ' '
          : tokenizeLine(line, lang).map((t, j) =>
              t.color ? (
                <span key={j} style={{ color: t.color }}>
                  {t.text}
                </span>
              ) : (
                <span key={j}>{t.text}</span>
              ),
            )}
      </span>
    </div>
  ));
}

/* ------------------------------ component ------------------------------ */

export default function CodeBlock({
  code,
  language = 'shell',
  tabs,
  filename,
  lineNumbers = false,
  maxHeight,
  className,
}: CodeBlockProps) {
  const effectiveTabs: CodeTab[] = useMemo(
    () => tabs ?? [{ label: filename ?? language, code: code ?? '', language }],
    [tabs, code, language, filename],
  );
  const [activeTab, setActiveTab] = useState(0);
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  const tab = effectiveTabs[Math.min(activeTab, effectiveTabs.length - 1)];
  const isLong = useMemo(() => {
    if (!maxHeight) return false;
    return tab.code.split('\n').length * 23 > maxHeight; // ~23px per line at 13.5px/1.7
  }, [tab.code, maxHeight]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(tab.code);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = tab.code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
    }
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  };

  return (
    <div className={cn('overflow-hidden rounded-[10px] border border-line bg-code', className)}>
      {/* Header bar */}
      <div className="flex h-9 items-center gap-3 border-b border-line bg-surface px-3">
        <span className="flex gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
          <span className="h-2.5 w-2.5 rounded-full bg-line-bright" />
        </span>
        {effectiveTabs.length > 1 ? (
          <div className="flex gap-1" role="tablist">
            {effectiveTabs.map((t, i) => (
              <button
                key={t.label}
                role="tab"
                aria-selected={i === activeTab}
                onClick={() => setActiveTab(i)}
                className={cn(
                  'rounded-md px-2.5 py-1 font-mono text-[11px] transition-colors',
                  i === activeTab
                    ? 'bg-code text-accent'
                    : 'text-dim hover:text-ink',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        ) : (
          filename && (
            <span className="truncate font-mono text-[11px] text-dim">{filename}</span>
          )
        )}
        <button
          type="button"
          onClick={copy}
          className="relative ml-auto flex items-center gap-1.5 rounded-md px-2 py-1 font-mono text-[11px] text-dim transition-colors hover:text-ink"
          aria-label="Copy code"
        >
          <AnimatePresence mode="wait" initial={false}>
            {copied ? (
              <motion.span
                key="check"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5 text-accent"
              >
                <Check size={13} />
                copied
              </motion.span>
            ) : (
              <motion.span
                key="copy"
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center gap-1.5"
              >
                <Copy size={13} />
                copy
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Body */}
      <div className="relative">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.2 }}
          >
            <div
              ref={bodyRef}
              className={cn('overflow-x-auto', isLong && !expanded && 'overflow-y-hidden', isLong && expanded && 'overflow-y-auto')}
              style={isLong && !expanded ? { maxHeight } : maxHeight && isLong ? { maxHeight: Math.max(maxHeight * 2.5, 700) } : undefined}
            >
              <pre className="p-4 font-mono text-[13.5px] leading-[1.7] text-body">
                <code>{renderCode(tab.code, tab.language, lineNumbers)}</code>
              </pre>
            </div>
          </motion.div>
        </AnimatePresence>

        {isLong && !expanded && (
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-code to-transparent" />
        )}
      </div>

      {isLong && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex w-full items-center justify-center gap-1.5 border-t border-line bg-surface/60 py-2 font-mono text-[11px] text-dim transition-colors hover:text-accent"
        >
          {expanded ? 'Collapse' : 'Expand'}
          <ChevronDown
            size={13}
            className={cn('transition-transform duration-200', expanded && 'rotate-180')}
          />
        </button>
      )}
    </div>
  );
}
