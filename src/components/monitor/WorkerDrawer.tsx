import React, { useState, useEffect } from 'react';
import { X, HardHat, ShieldCheck, Check, Clock, MapPin, Gauge, Footprints, ShieldAlert } from 'lucide-react';
import type { Worker, SafetyEvent, TimelineItem } from '../../types';
import { api } from '../../services/api';
import { Badge } from '../ui/Badge';
import { formatDuration } from '../../lib/format';
import { getWorkerStatusStyle } from '../../lib/severity';

export interface WorkerDrawerProps {
  workerId: number | null;
  onClose: () => void;
  events: SafetyEvent[];
}

export const WorkerDrawer: React.FC<WorkerDrawerProps> = ({
  workerId,
  onClose,
  events,
}) => {
  const [worker, setWorker] = useState<Worker | null>(null);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!workerId) return;
    let isMounted = true;
    setLoading(true);

    Promise.all([api.getWorker(workerId), api.getTimeline(workerId)]).then(
      ([w, t]) => {
        if (isMounted) {
          setWorker(w);
          setTimeline(t);
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
    };
  }, [workerId]);

  if (!workerId) return null;

  const workerEvents = events.filter((e) => e.worker_id === workerId);
  const statusStyle = getWorkerStatusStyle(worker?.status || 'safe');

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-xs flex justify-end animate-fade-in">
      <div className="w-full max-w-md bg-[#121821] border-l border-[#243041] h-full flex flex-col shadow-2xl animate-slide-in-right">
        {/* Drawer Header */}
        <div className="p-4 border-b border-[#243041] bg-[#0B0F14] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center font-mono font-bold text-teal-400">
              #{workerId}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#E6EDF3] font-mono">
                Worker #{workerId} Details
              </h3>
              <p className="text-xs text-[#8B98A9]">
                First Seen: {worker?.first_seen || '10:15:00'} · Last Seen: {worker?.last_seen || 'Active'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#8B98A9] hover:text-[#E6EDF3] hover:bg-[#18202B] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-4 flex-1 overflow-y-auto space-y-5 text-xs font-mono">
          {/* Status & PPE Cards */}
          <div className="grid grid-cols-2 gap-3">
            {/* Status Card */}
            <div className={`p-3 rounded-xl border ${statusStyle.bg} ${statusStyle.border} flex flex-col justify-between`}>
              <span className="text-[10px] text-[#8B98A9] uppercase font-sans">Current Status</span>
              <span className={`text-sm font-bold mt-1 ${statusStyle.text}`}>{statusStyle.label}</span>
              <span className="text-[11px] text-[#8B98A9] mt-1">Risk Score: {worker?.risk_score || 0}/100</span>
            </div>

            {/* PPE Status */}
            <div className="p-3 bg-[#0B0F14] border border-[#243041] rounded-xl flex flex-col justify-between">
              <span className="text-[10px] text-[#8B98A9] uppercase font-sans">PPE Compliance</span>
              <div className="space-y-1 mt-1">
                <div className="flex items-center justify-between text-[#E6EDF3]">
                  <span className="flex items-center gap-1 font-sans">
                    <HardHat className="w-3.5 h-3.5 text-teal-400" /> Helmet
                  </span>
                  {worker?.ppe.helmet ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> YES</span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-0.5"><X className="w-3 h-3" /> NO</span>
                  )}
                </div>
                <div className="flex items-center justify-between text-[#E6EDF3]">
                  <span className="flex items-center gap-1 font-sans">
                    <ShieldCheck className="w-3.5 h-3.5 text-teal-400" /> Safety Vest
                  </span>
                  {worker?.ppe.vest ? (
                    <span className="text-emerald-400 font-bold flex items-center gap-0.5"><Check className="w-3 h-3" /> YES</span>
                  ) : (
                    <span className="text-red-400 font-bold flex items-center gap-0.5"><X className="w-3 h-3" /> NO</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Movement Stats */}
          <div className="bg-[#0B0F14] border border-[#243041] rounded-xl p-3.5 space-y-2.5">
            <h4 className="text-[11px] text-[#8B98A9] uppercase tracking-wider font-sans">
              Movement Analytics &amp; Dynamics
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-[#18202B]/60 p-2 rounded-lg">
                <span className="text-[#8B98A9] block text-[10px]">Distance Travelled</span>
                <span className="text-[#E6EDF3] font-bold text-sm">
                  {workerId === 17 ? '142.5 m' : '84.2 m'}
                </span>
              </div>
              <div className="bg-[#18202B]/60 p-2 rounded-lg">
                <span className="text-[#8B98A9] block text-[10px]">Average Speed</span>
                <span className="text-[#E6EDF3] font-bold text-sm">
                  {workerId === 17 ? '0.6 m/s' : '1.2 m/s'}
                </span>
              </div>
              <div className="bg-[#18202B]/60 p-2 rounded-lg">
                <span className="text-[#8B98A9] block text-[10px]">Stationary Duration</span>
                <span className="text-amber-400 font-bold text-sm">
                  {workerId === 17 ? '63 sec' : '12 sec'}
                </span>
              </div>
              <div className="bg-[#18202B]/60 p-2 rounded-lg">
                <span className="text-[#8B98A9] block text-[10px]">Zones Entered</span>
                <span className="text-teal-400 font-bold text-sm">
                  {workerId === 17 ? '2 (Welding)' : '1 (General)'}
                </span>
              </div>
            </div>
          </div>

          {/* Mini Trajectory SVG Plot */}
          <div className="bg-[#0B0F14] border border-[#243041] rounded-xl p-3 space-y-2">
            <h4 className="text-[11px] text-[#8B98A9] uppercase tracking-wider font-sans flex items-center justify-between">
              <span>Mini Trajectory Plot</span>
              <span className="text-teal-400 font-normal">0-1 Normalised</span>
            </h4>
            <div className="relative w-full h-36 bg-[#18202B]/40 rounded-lg border border-[#243041] overflow-hidden flex items-center justify-center">
              <svg className="w-full h-full" viewBox="0 0 100 60">
                {/* General Zone */}
                <rect x="5" y="6" width="45" height="48" fill="rgba(20,184,166,0.1)" stroke="#14B8A6" strokeWidth="0.5" />
                <text x="8" y="14" fill="#14B8A6" fontSize="4" fontWeight="bold">General</text>

                {/* Restricted Welding Zone */}
                <rect x="55" y="30" width="40" height="24" fill="rgba(239,68,68,0.15)" stroke="#EF4444" strokeWidth="0.5" strokeDasharray="1,1" />
                <text x="58" y="38" fill="#EF4444" fontSize="4" fontWeight="bold">Welding (Restricted)</text>

                {/* Path Polyline */}
                {workerId === 17 ? (
                  <>
                    <polyline
                      points="15,20 25,35 45,45 68,42 68,42"
                      fill="none"
                      stroke="#EF4444"
                      strokeWidth="1.5"
                      strokeDasharray="2,1"
                    />
                    <circle cx="68" cy="42" r="3" fill="#EF4444" className="animate-ping" />
                    <circle cx="68" cy="42" r="2" fill="#EF4444" />
                  </>
                ) : (
                  <>
                    <polyline
                      points="10,15 25,25 35,15 45,30"
                      fill="none"
                      stroke="#22C55E"
                      strokeWidth="1.5"
                    />
                    <circle cx="45" cy="30" r="2" fill="#22C55E" />
                  </>
                )}
              </svg>
            </div>
          </div>

          {/* Timeline History */}
          <div className="space-y-2">
            <h4 className="text-[11px] text-[#8B98A9] uppercase tracking-wider font-sans">
              Worker Timeline History
            </h4>
            <div className="space-y-2">
              {timeline.map((t, idx) => (
                <div key={idx} className="p-2.5 bg-[#0B0F14] border border-[#243041] rounded-lg flex items-start justify-between">
                  <div>
                    <span className="text-[10px] text-[#8B98A9]">{t.timestamp}</span>
                    <p className="text-xs font-semibold text-[#E6EDF3] mt-0.5">{t.label}</p>
                  </div>
                  <Badge variant={t.severity}>{t.severity}</Badge>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
