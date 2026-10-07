import React, { useState, useEffect } from 'react';
import { VideoPanel }            from '../components/monitor/VideoPanel';
import { SafetyStatusPanel }     from '../components/monitor/SafetyStatusPanel';
import { ActiveIncidentsPanel }  from '../components/monitor/ActiveIncidentsPanel';
import { BehaviourTimelinePanel }from '../components/monitor/BehaviourTimelinePanel';
import { ThermalPanel }          from '../components/monitor/ThermalPanel';
import { WorkerDrawer }          from '../components/monitor/WorkerDrawer';
import { Toast }                 from '../components/ui/Toast';
import { useLiveEvents }         from '../hooks/useLiveEvents';
import type { Zone }             from '../types';
import { api }                   from '../services/api';
import { Brain, Activity, Thermometer } from 'lucide-react';

export const MonitorPage: React.FC = () => {
  const { events, workers, toastMessage, clearToast, refreshData } = useLiveEvents();
  const [zones,            setZones]            = useState<Zone[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [isDrawerOpen,     setIsDrawerOpen]     = useState(false);

  useEffect(() => { api.getConfig().then(cfg => setZones(cfg.zones)); }, []);

  const handleSelectWorker = (id: number) => { setSelectedWorkerId(id); setIsDrawerOpen(true); };
  const handleAcknowledge  = async (id: string) => { await api.updateEventStatus(id, 'acknowledged'); refreshData(); };
  const handleResolve      = async (id: string) => { await api.updateEventStatus(id, 'resolved'); refreshData(); };

  const criticalCount  = events.filter(e => e.severity === 'critical' && e.status !== 'resolved').length;
  const highRiskCount  = workers.filter(w => w.status === 'high_risk').length;

  return (
    <div className="space-y-4 pb-8">

      {/* Toast */}
      {toastMessage && (
        <Toast
          id={toastMessage.id}
          title={toastMessage.title}
          desc={toastMessage.desc}
          severity={toastMessage.severity}
          onClose={clearToast}
        />
      )}

      {/* Live status ribbon */}
      <div className="flex items-center justify-between bg-[#121821] border border-[#243041] px-4 py-2.5 rounded-xl">
        <div className="flex items-center gap-3">
          <Brain className="w-4 h-4 text-teal-400" />
          <span className="text-xs font-bold font-mono text-teal-400">YOLOv8 · best.pt · Live Intelligence</span>
          <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
          <span className="mx-1 text-[#243041]">|</span>
          <Thermometer className="w-4 h-4 text-orange-400" />
          <span className="text-xs font-bold font-mono text-orange-400">Thermal IR · Active</span>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
        </div>
        <div className="flex items-center gap-4 text-xs font-mono">
          <span className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-[#8B98A9]" />
            <span className="text-[#8B98A9]">{workers.length} Workers</span>
          </span>
          {criticalCount > 0 && (
            <span className="flex items-center gap-1.5 text-red-400 animate-pulse">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              {criticalCount} CRITICAL
            </span>
          )}
          {highRiskCount > 0 && (
            <span className="text-orange-400 font-bold">{highRiskCount} High Risk</span>
          )}
          <span className="text-[#8B98A9]">{events.length} Events</span>
        </div>
      </div>

      {/* ── DUAL FEED ROW: RGB + Thermal ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="min-h-[460px]">
          <VideoPanel zones={zones} workers={workers} onSelectWorker={handleSelectWorker} selectedWorkerId={selectedWorkerId} />
        </div>
        <div className="min-h-[460px]">
          <ThermalPanel workers={workers} onSelectWorker={handleSelectWorker} selectedWorkerId={selectedWorkerId} />
        </div>
      </div>

      {/* ── SAFETY STATUS PANEL (full width below feeds) ── */}
      <div>
        <SafetyStatusPanel workers={workers} events={events} onSelectWorker={handleSelectWorker} selectedWorkerId={selectedWorkerId} />
      </div>

      {/* ── INCIDENTS + TIMELINE ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-6 min-h-[420px]">
          <ActiveIncidentsPanel events={events} onAcknowledge={handleAcknowledge} onResolve={handleResolve} />
        </div>
        <div className="lg:col-span-6 min-h-[420px]">
          <BehaviourTimelinePanel selectedWorkerId={selectedWorkerId} />
        </div>
      </div>

      {/* Worker drawer */}
      {isDrawerOpen && (
        <WorkerDrawer workerId={selectedWorkerId} onClose={() => setIsDrawerOpen(false)} events={events} />
      )}
    </div>
  );
};

