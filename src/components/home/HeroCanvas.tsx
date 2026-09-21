import { memo, useEffect, useRef } from 'react';

interface Node {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface Packet {
  a: number;
  b: number;
  t: number;
  speed: number;
}

const NODE_COUNT = 60;
const LINK_DIST = 140;
const ACCENT = '34, 211, 167';

/**
 * 2D canvas particle-network forming DAG-like edges. ~60 faint nodes, edges
 * when distance < 140px, and every ~1.2s a 2px accent "packet" travels along
 * an edge like a job trigger firing. Paused when offscreen.
 */
const HeroCanvas = memo(function HeroCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let running = true;
    let visible = true;
    let w = 0;
    let h = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const nodes: Node[] = [];
    const packets: Packet[] = [];
    let edges: [number, number][] = [];
    let lastPacketAt = 0;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const seed = () => {
      nodes.length = 0;
      for (let i = 0; i < NODE_COUNT; i++) {
        nodes.push({
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.22,
          vy: (Math.random() - 0.5) * 0.22,
        });
      }
    };

    const computeEdges = () => {
      edges = [];
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const dx = nodes[i].x - nodes[j].x;
          const dy = nodes[i].y - nodes[j].y;
          if (dx * dx + dy * dy < LINK_DIST * LINK_DIST) edges.push([i, j]);
        }
      }
    };

    const frame = (now: number) => {
      if (!running) return;
      raf = requestAnimationFrame(frame);
      if (!visible || w === 0) return;

      // move
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > w) n.vx *= -1;
        if (n.y < 0 || n.y > h) n.vy *= -1;
      }
      computeEdges();

      // spawn packets ~ every 1.2s
      if (now - lastPacketAt > 1200 && edges.length > 0) {
        lastPacketAt = now;
        const [a, b] = edges[Math.floor(Math.random() * edges.length)];
        // bias left -> right
        const [from, to] = nodes[a].x <= nodes[b].x ? [a, b] : [b, a];
        packets.push({ a: from, b: to, t: 0, speed: 0.012 + Math.random() * 0.008 });
      }

      ctx.clearRect(0, 0, w, h);

      // edges
      ctx.lineWidth = 1;
      for (const [i, j] of edges) {
        const dx = nodes[i].x - nodes[j].x;
        const dy = nodes[i].y - nodes[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const alpha = (1 - dist / LINK_DIST) * 0.16;
        ctx.strokeStyle = `rgba(${ACCENT}, ${alpha.toFixed(3)})`;
        ctx.beginPath();
        ctx.moveTo(nodes[i].x, nodes[i].y);
        ctx.lineTo(nodes[j].x, nodes[j].y);
        ctx.stroke();
      }

      // nodes
      for (const n of nodes) {
        ctx.fillStyle = `rgba(${ACCENT}, 0.35)`;
        ctx.beginPath();
        ctx.arc(n.x, n.y, 1.4, 0, Math.PI * 2);
        ctx.fill();
      }

      // packets
      for (let i = packets.length - 1; i >= 0; i--) {
        const p = packets[i];
        p.t += p.speed;
        if (p.t >= 1) {
          packets.splice(i, 1);
          continue;
        }
        const a = nodes[p.a];
        const b = nodes[p.b];
        const x = a.x + (b.x - a.x) * p.t;
        const y = a.y + (b.y - a.y) * p.t;
        ctx.fillStyle = `rgba(${ACCENT}, 0.95)`;
        ctx.shadowColor = `rgba(${ACCENT}, 0.9)`;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(x, y, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }
    };

    resize();
    seed();
    raf = requestAnimationFrame(frame);

    const onResize = () => {
      resize();
      seed();
    };
    window.addEventListener('resize', onResize);

    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
      },
      { threshold: 0 },
    );
    io.observe(canvas);

    return () => {
      running = false;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1 }}
    />
  );
});

export default HeroCanvas;
