import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

export interface PipelineNode {
  id: string;
  label: string;
  /** SVG coordinates */
  x: number;
  y: number;
  /** Small resource spec shown under the label, e.g. "2 vCPU · 4 GB" */
  spec?: string;
  /** Full JSON request body / config shown in the click-through modal. */
  detail?: Record<string, unknown>;
}

export interface PipelineEdge {
  from: string;
  to: string;
}

interface PipelineDiagramProps {
  nodes: PipelineNode[];
  edges: PipelineEdge[];
  width?: number;
  height?: number;
  /** Draw-on animation for edges on first reveal (default true). */
  animated?: boolean;
  className?: string;
}

const NODE_W = 150;
const NODE_H = 52;

function edgePath(x1: number, y1: number, x2: number, y2: number): string {
  const mx = (x1 + x2) / 2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

/**
 * Reusable SVG DAG: rounded-rect nodes (bg-raised, border, mono label + spec),
 * accent edges with draw-on animation + arrowheads, hover tooltip with job
 * config, click → modal with full JSON request body.
 */
export default function PipelineDiagram({
  nodes,
  edges,
  width = 760,
  height = 320,
  animated = true,
  className,
}: PipelineDiagramProps) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [selected, setSelected] = useState<PipelineNode | null>(null);

  const byId = useMemo(() => new Map(nodes.map((n) => [n.id, n])), [nodes]);
  const hoveredNode = hovered ? byId.get(hovered) : undefined;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full"
        role="img"
        aria-label="Pipeline dependency graph"
      >
        <defs>
          <marker
            id="dag-arrow"
            viewBox="0 0 10 10"
            refX="9"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#22D3A7" />
          </marker>
        </defs>

        {/* Edges */}
        {edges.map((e, i) => {
          const from = byId.get(e.from);
          const to = byId.get(e.to);
          if (!from || !to) return null;
          const x1 = from.x + NODE_W;
          const y1 = from.y + NODE_H / 2;
          const x2 = to.x;
          const y2 = to.y + NODE_H / 2;
          const d = edgePath(x1, y1, x2, y2);
          return animated ? (
            <motion.path
              key={`${e.from}-${e.to}`}
              d={d}
              fill="none"
              stroke="#22D3A7"
              strokeWidth={1.6}
              strokeOpacity={0.75}
              markerEnd="url(#dag-arrow)"
              initial={{ pathLength: 0 }}
              whileInView={{ pathLength: 1 }}
              viewport={{ once: true, margin: '-10% 0px' }}
              transition={{ duration: 0.7, delay: 0.25 + i * 0.18, ease: 'easeOut' }}
            />
          ) : (
            <path
              key={`${e.from}-${e.to}`}
              d={d}
              fill="none"
              stroke="#22D3A7"
              strokeWidth={1.6}
              strokeOpacity={0.75}
              markerEnd="url(#dag-arrow)"
            />
          );
        })}

        {/* Nodes */}
        {nodes.map((n) => {
          const isHover = n.id === hovered;
          return (
            <g
              key={n.id}
              transform={`translate(${n.x}, ${n.y + (isHover ? -3 : 0)})`}
              style={{ cursor: 'pointer', transition: 'transform 0.18s ease-out' }}
              onMouseEnter={() => setHovered(n.id)}
              onMouseLeave={() => setHovered(null)}
              onClick={() => setSelected(n)}
            >
              <rect
                width={NODE_W}
                height={NODE_H}
                rx={10}
                fill="#10161E"
                stroke={isHover ? '#22D3A7' : '#1F2B38'}
                strokeWidth={isHover ? 1.6 : 1}
              />
              <text
                x={NODE_W / 2}
                y={n.spec ? 22 : NODE_H / 2 + 4}
                textAnchor="middle"
                fill="#E6EDF3"
                fontSize={13}
                fontFamily="'JetBrains Mono', monospace"
                fontWeight={500}
              >
                {n.label}
              </text>
              {n.spec && (
                <text
                  x={NODE_W / 2}
                  y={39}
                  textAnchor="middle"
                  fill="#7C8A9A"
                  fontSize={10}
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {n.spec}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Hover tooltip */}
      <AnimatePresence>
        {hoveredNode?.detail && !selected && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="pointer-events-none mx-auto mt-2 w-fit max-w-full rounded-md border border-line bg-surface px-3 py-1.5 font-mono text-[11px] text-dim"
          >
            <span className="text-accent">{hoveredNode.label}</span>
            {' · '}click for full CreateJobRequest JSON
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detail modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-base/80 p-4 backdrop-blur-sm"
            onClick={() => setSelected(null)}
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.98 }}
              transition={{ duration: 0.25, ease: 'easeOut' }}
              className="w-full max-w-lg overflow-hidden rounded-[10px] border border-line-bright bg-code"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label={`Job detail: ${selected.label}`}
            >
              <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-2.5">
                <span className="font-mono text-[12px] text-dim">
                  CreateJobRequest · <span className="text-accent">{selected.label}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="rounded p-1 text-dim hover:text-ink"
                  aria-label="Close"
                >
                  <X size={15} />
                </button>
              </div>
              <pre className="max-h-[60vh] overflow-auto p-4 font-mono text-[12.5px] leading-relaxed text-body">
                {selected.detail
                  ? JSON.stringify(selected.detail, null, 2)
                  : `// no detail payload configured for "${selected.label}"`}
              </pre>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
