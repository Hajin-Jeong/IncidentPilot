import { Clock, ChevronRight, AlertOctagon, AlertTriangle, Info } from 'lucide-react';
import clsx from 'clsx';
import type { Incident } from '../types';

interface RecentIncidentsProps {
  incidents: Incident[];
}

const severityConfig = {
  P1: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/20', Icon: AlertOctagon },
  P2: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20', Icon: AlertTriangle },
  P3: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/20', Icon: Info },
  P4: { color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20', Icon: Info },
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function RecentIncidents({ incidents }: RecentIncidentsProps) {
  const recent = incidents.slice(0, 5);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
        <h2 className="text-sm font-semibold text-slate-200">최근 장애 이력</h2>
        <span className="text-xs text-slate-500">{incidents.length}건 전체</span>
      </div>
      <div className="divide-y divide-slate-800/50">
        {recent.map((incident) => {
          const cfg = severityConfig[incident.severity];
          const { Icon } = cfg;
          return (
            <div key={incident.id} className="px-6 py-4 hover:bg-slate-800/30 transition-colors group">
              <div className="flex items-start gap-3">
                <div className={clsx('mt-0.5 p-1.5 rounded-lg', cfg.bg, `border ${cfg.border}`)}>
                  <Icon size={13} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={clsx('text-xs font-bold', cfg.color)}>{incident.severity}</span>
                    <span className="text-xs font-medium text-slate-300">{incident.service}</span>
                    <span className="text-xs text-slate-500 ml-auto flex items-center gap-1">
                      <Clock size={11} />
                      {formatDate(incident.date)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 truncate">{incident.symptom}</p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    해결: {incident.durationMinutes}분
                  </p>
                </div>
                <ChevronRight size={14} className="text-slate-600 group-hover:text-slate-400 transition-colors shrink-0 mt-1" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
