import React from 'react';
import type { SafetyEvent } from '../../types';
import { IncidentCard } from '../incidents/IncidentCard';
import { ShieldAlert } from 'lucide-react';

export interface ActiveIncidentsPanelProps {
  events: SafetyEvent[];
  onAcknowledge: (eventId: string) => void;
  onResolve: (eventId: string) => void;
}

export const ActiveIncidentsPanel: React.FC<ActiveIncidentsPanelProps> = ({
  events,
  onAcknowledge,
  onResolve,
}) => {
  // Pin critical to top, then newest first
  const sortedEvents = [...events].sort((a, b) => {
    if (a.severity === 'critical' && b.severity !== 'critical') return -1;
    if (b.severity === 'critical' && a.severity !== 'critical') return 1;
    return new Date(`1970/01/01 ${b.start_time}`).getTime() - new Date(`1970/01/01 ${a.start_time}`).getTime();
  });

  return (
    <div className="flex flex-col bg-[#121821] border border-[#243041] rounded-xl overflow-hidden h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#243041] bg-[#0B0F14]/60 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <h3 className="text-xs font-bold font-mono tracking-wider uppercase text-[#E6EDF3]">
            Active Incident Stream
          </h3>
        </div>
        <span className="text-xs font-mono text-[#8B98A9]">
          {events.length} Total ({events.filter((e) => e.severity === 'critical').length} Critical Pinned)
        </span>
      </div>

      {/* Incident List */}
      <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-[460px]">
        {sortedEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center text-[#8B98A9] space-y-2">
            <ShieldAlert className="w-8 h-8 text-emerald-400 opacity-60" />
            <p className="text-xs font-mono">No active safety incidents detected.</p>
          </div>
        ) : (
          sortedEvents.map((event) => (
            <IncidentCard
              key={event.event_id}
              event={event}
              onAcknowledge={onAcknowledge}
              onResolve={onResolve}
            />
          ))
        )}
      </div>
    </div>
  );
};
