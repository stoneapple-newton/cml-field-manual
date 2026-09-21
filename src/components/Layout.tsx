import { useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { useLocation } from 'react-router-dom';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

gsap.registerPlugin(ScrollTrigger);

/**
 * Shared layout. Children pattern: Layout renders {children} and App.tsx wraps
 * <Routes> with <Layout> — do NOT mix with <Outlet/> nested routes.
 *
 * Navbar is `sticky top-0` (normal flow), so pages need no nav-height offset.
 */
export default function Layout({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const { pathname, hash } = useLocation();

  // Site-wide Lenis smooth scrolling (lerp 0.1), synced with GSAP ScrollTrigger.
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1 });
    lenisRef.current = lenis;
    lenis.on('scroll', ScrollTrigger.update);
    const tick = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(tick);
    gsap.ticker.lagSmoothing(0);
    return () => {
      gsap.ticker.remove(tick);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // Scroll to top on route change; honor #hash anchors.
  useEffect(() => {
    if (hash) {
      // Wait a tick for the target page to render.
      const id = hash.slice(1);
      const t = window.setTimeout(() => {
        const el = document.getElementById(id);
        if (el) lenisRef.current?.scrollTo(el, { offset: -80 });
      }, 60);
      return () => window.clearTimeout(t);
    }
    lenisRef.current?.scrollTo(0, { immediate: true });
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <div className="flex min-h-[100dvh] flex-col bg-base">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
