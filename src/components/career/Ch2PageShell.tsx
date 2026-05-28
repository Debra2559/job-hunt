import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  emoji: string;
  title: string;
  subtitle: string;
  /** Tailwind gradient classes, e.g. 'from-sky-400 via-cyan-500 to-blue-500' */
  gradient?: string;
  children: ReactNode;
  /** Fixed bottom CTA bar content */
  footer?: ReactNode;
};

export default function Ch2PageShell({
  emoji, title, subtitle,
  gradient = 'from-sky-400 via-cyan-500 to-blue-500',
  children, footer,
}: Props) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-gradient-to-b from-sky-100 via-cyan-50 to-emerald-50">
      {/* drifting cloud decoration */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[6%] left-[8%] text-3xl opacity-40">☁️</div>
        <div className="absolute top-[12%] right-[10%] text-4xl opacity-35">☁️</div>
        <div className="absolute bottom-[8%] left-[10%] text-2xl opacity-30">🌿</div>
      </div>

      <header className="sticky top-0 z-30 backdrop-blur-2xl bg-white/65 border-b border-white/40">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
          <Link
            to="/"
            className="w-9 h-9 rounded-xl bg-white/80 border border-white flex items-center justify-center text-foreground hover:scale-105 active:scale-95 transition-all shadow-sm"
            aria-label="返回地图"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-lg bg-gradient-to-br', gradient)}>
            <span className="drop-shadow-sm">{emoji}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-sm sm:text-base font-bold leading-tight">{title}</h1>
            <p className="text-[11px] text-muted-foreground truncate">{subtitle}</p>
          </div>
          <span className="hidden sm:inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-gradient-to-r from-sky-500 to-cyan-500 text-white font-bold tracking-wide">第二章</span>
        </div>
      </header>

      <main className="relative max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-40 sm:pb-32">
        {children}
      </main>

      {footer && (
        <div className="fixed bottom-0 left-0 right-0 z-20 px-3 sm:px-4 py-2.5 sm:py-3 backdrop-blur-2xl bg-white/75 border-t border-white/40">
          <div className="max-w-3xl mx-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            {footer}
          </div>
        </div>
      )}
    </div>
  );
}
