import { useEffect, useRef, useState } from 'react';

type Particle = {
  x: number; y: number; vx: number; vy: number;
  life: number; maxLife: number; color: string; size: number;
};

type Burst = { x: number; y: number; color: string; count: number };

const PALETTES = [
  ['#fb7185', '#f472b6', '#facc15', '#fde047'],
  ['#34d399', '#10b981', '#22d3ee', '#a7f3d0'],
  ['#a78bfa', '#c084fc', '#f0abfc', '#fbcfe8'],
  ['#fbbf24', '#fb923c', '#f87171', '#fdba74'],
];

function randomPalette() {
  return PALETTES[Math.floor(Math.random() * PALETTES.length)];
}

export type FireworksDetail = { intensity?: 'normal' | 'mega'; message?: string };

export function fireFireworks(detail: FireworksDetail = {}) {
  window.dispatchEvent(new CustomEvent<FireworksDetail>('app:fireworks', { detail }));
}

export default function Fireworks() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const burstsRef = useRef<Burst[]>([]);
  const rafRef = useRef<number | null>(null);
  const activeUntilRef = useRef<number>(0);
  const [banner, setBanner] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      canvas.width = window.innerWidth * dpr;
      canvas.height = window.innerHeight * dpr;
      canvas.style.width = `${window.innerWidth}px`;
      canvas.style.height = `${window.innerHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const spawnBurst = (x: number, y: number, palette: string[], count: number) => {
      for (let i = 0; i < count; i++) {
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.25;
        const speed = 2 + Math.random() * 4;
        particlesRef.current.push({
          x, y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life: 0,
          maxLife: 60 + Math.random() * 30,
          color: palette[Math.floor(Math.random() * palette.length)],
          size: 2 + Math.random() * 2,
        });
      }
    };

    const tick = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);

      // dequeue pending bursts gradually
      if (burstsRef.current.length && Math.random() < 0.4) {
        const b = burstsRef.current.shift()!;
        spawnBurst(b.x, b.y, [b.color, b.color, '#fff'], b.count);
      }

      const arr = particlesRef.current;
      for (let i = arr.length - 1; i >= 0; i--) {
        const p = arr[i];
        p.life += 1;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // gravity
        p.vx *= 0.99;
        const alpha = Math.max(0, 1 - p.life / p.maxLife);
        ctx.beginPath();
        ctx.fillStyle = p.color;
        ctx.globalAlpha = alpha;
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        // trailing glow
        ctx.globalAlpha = alpha * 0.35;
        ctx.arc(p.x, p.y, p.size * 2.5, 0, Math.PI * 2);
        ctx.fill();
        if (p.life >= p.maxLife) arr.splice(i, 1);
      }
      ctx.globalAlpha = 1;

      if (arr.length > 0 || burstsRef.current.length > 0 || Date.now() < activeUntilRef.current) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    const start = () => {
      if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
    };

    const onFire = (e: Event) => {
      const detail = (e as CustomEvent<FireworksDetail>).detail || {};
      const w = window.innerWidth;
      const h = window.innerHeight;
      const mega = detail.intensity === 'mega';
      const palette = randomPalette();
      const shots = mega ? 8 : 4;
      for (let i = 0; i < shots; i++) {
        burstsRef.current.push({
          x: w * (0.15 + Math.random() * 0.7),
          y: h * (0.18 + Math.random() * 0.35),
          color: palette[i % palette.length],
          count: mega ? 50 : 36,
        });
      }
      activeUntilRef.current = Date.now() + (mega ? 2800 : 1800);
      if (detail.message) {
        setBanner(detail.message);
        setTimeout(() => setBanner(null), mega ? 2800 : 2000);
      }
      start();
    };

    window.addEventListener('app:fireworks', onFire);
    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('app:fireworks', onFire);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <>
      <canvas
        ref={canvasRef}
        className="pointer-events-none fixed inset-0 z-[9998]"
        aria-hidden
      />
      {banner && (
        <div className="pointer-events-none fixed inset-x-0 top-[18%] z-[9999] flex justify-center px-4 animate-scale-in">
          <div className="px-6 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 text-white font-bold text-base sm:text-lg shadow-[0_20px_50px_-12px_rgba(16,185,129,0.6)] backdrop-blur-sm">
            🎉 {banner}
          </div>
        </div>
      )}
    </>
  );
}
