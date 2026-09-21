import { useState } from 'react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

/** Method chip colors per design.md §1. */
const METHOD_COLORS: Record<string, string> = {
  GET: '#22D3A7',
  POST: '#5BA8F5',
  PATCH: '#A78BFA',
  DELETE: '#F5675B',
};

interface EndpointRowProps {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  /** SDK method, e.g. "client.create_job(...)" — shown dimmed on the right. */
  sdk?: string;
  className?: string;
}

export default function EndpointRow({ method, path, sdk, className }: EndpointRowProps) {
  const [copied, setCopied] = useState(false);
  const color = METHOD_COLORS[method] ?? '#7C8A9A';

  const copyPath = async () => {
    try {
      await navigator.clipboard.writeText(path);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1200);
    } catch {
      /* clipboard unavailable */
    }
  };

  return (
    <button
      type="button"
      onClick={copyPath}
      title="Click to copy path"
      className={cn(
        'flex w-full cursor-pointer items-center gap-3 rounded-[10px] border border-line bg-raised px-4 py-3 text-left transition-colors hover:border-line-bright',
        className,
      )}
    >
      <span
        className="shrink-0 rounded-md px-2 py-0.5 font-mono text-[11px] font-bold"
        style={{ backgroundColor: `${color}26`, color }}
      >
        {method}
      </span>
      <span className="min-w-0 flex-1 truncate font-mono text-[13px] text-ink">{path}</span>
      {copied ? (
        <Check size={14} className="shrink-0 text-accent" />
      ) : (
        sdk && (
          <span className="hidden shrink-0 font-mono text-[12px] text-dim md:inline">{sdk}</span>
        )
      )}
    </button>
  );
}
