import React, { useState, useEffect } from 'react';
import { VideoPanel } from '../components/monitor/VideoPanel';
import { SafetyStatusPanel } from '../components/monitor/SafetyStatusPanel';
import { ActiveIncidentsPanel } from '../components/monitor/ActiveIncidentsPanel';
import { BehaviourTimelinePanel } from '../components/monitor/BehaviourTimelinePanel';
import { WorkerDrawer } from '../components/monitor/WorkerDrawer';
import { Toast } from '../components/ui/Toast';
import { useLiveEvents } from '../hooks/useLiveEvents';
import type { Zone } from '../types';
import { api } from '../services/api';

export const MonitorPage: React.FC = () => {
  const { events, workers, toastMessage, clearToast, refreshData } = useLiveEvents();

  const [zones, setZones] = useState<Zone[]>([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState<number | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  useEffect(() => {
    api.getConfig().then((cfg) => setZones(cfg.zones));
  }, []);

  const handleSelectWorker = (workerId: number) => {
    setSelectedWorkerId(workerId);
    setIsDrawerOpen(true);
  };

  const handleAcknowledge = async (eventId: string) => {
    await api.updateEventStatus(eventId, 'acknowledged');
    refreshData();
  };

  const handleResolve = async (eventId: string) => {
    await api.updateEventStatus(eventId, 'resolved');
    refreshData();
  };

  return (
    <div className="space-y-4 pb-8">
      {/* Toast Alert popup if live event fires */}
      {toastMessage && (
        <Toast
          id={toastMessage.id}
          title={toastMessage.title}
          desc={toastMessage.desc}
          severity={toastMessage.severity}
          onClose={clearToast}
        />
      )}

      {/* 2x2 Desktop Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Top-Left: Live Video + Overlays (~65% width = 8 cols) */}
        <div className="lg:col-span-8 min-h-[440px]">
          <VideoPanel
            zones={zones}
            workers={workers}
            onSelectWorker={handleSelectWorker}
            selectedWorkerId={selectedWorkerId}
          />
        </div>

        {/* Top-Right: Safety Status (4 cols) */}
        <div className="lg:col-span-4 min-h-[440px]">
          <SafetyStatusPanel
            workers={workers}
            events={events}
            onSelectWorker={handleSelectWorker}
            selectedWorkerId={selectedWorkerId}
          />
        </div>

        {/* Bottom-Left: Active Incidents (6 cols) */}
        <div className="lg:col-span-6 min-h-[420px]">
          <ActiveIncidentsPanel
            events={events}
            onAcknowledge={handleAcknowledge}
            onResolve={handleResolve}
          />
        </div>

        {/* Bottom-Right: Behaviour Timeline (6 cols) */}
        <div className="lg:col-span-6 min-h-[420px]">
          <BehaviourTimelinePanel selectedWorkerId={selectedWorkerId} />
        </div>
      </div>

      {/* Right-Side Slide-Over Worker Drawer */}
      {isDrawerOpen && (
        <WorkerDrawer
          workerId={selectedWorkerId}
          onClose={() => setIsDrawerOpen(false)}
          events={events}
        />
      )}
    </div>
  );
};
