import { Activity, Zap } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-screen-2xl mx-auto px-6 h-14 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="relative">
              <Activity size={22} className="text-red-400" />
              <Zap size={10} className="text-yellow-400 absolute -top-1 -right-1" />
            </div>
            <span className="font-bold text-lg tracking-tight text-white">
              Incident<span className="text-red-400">Pilot</span>
            </span>
          </div>
          <div className="h-4 w-px bg-slate-700 ml-2" />
          <span className="text-xs text-slate-400 font-medium tracking-wide uppercase">
            AI-Powered Incident Response
          </span>
        </div>
      </header>
      <main className="max-w-screen-2xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
