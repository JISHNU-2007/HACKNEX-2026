import React, { useState, useEffect } from 'react';
import type { FilterState } from '../components/investigate/EventFilterBar';
import { EventFilterBar }   from '../components/investigate/EventFilterBar';
import { EventTable }       from '../components/investigate/EventTable';
import { IncidentDetailPage } from './IncidentDetailPage';
import { Dialog }           from '../components/ui/Dialog';
import type { SafetyEvent } from '../types';
import { api }              from '../services/api';
import { ShieldAlert, Download, RefreshCw, Brain } from 'lucide-react';
import { Button }           from '../components/ui/Button';

export const InvestigatePage: React.FC = () => {
  const [events,  setEvents]  = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({
    search: '', eventType: 'all', severity: 'all', zone: 'all',
  });
  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);

  const loadEvents = async () => {
    setLoading(true);
    const fetched = await api.getEvents(filters as any);
    setEvents(fetched);
    setLoading(false);
  };

  useEffect(() => { loadEvents(); }, [filters]);

  // Auto-refresh every 5s (catches events that come in from background YOLO)
  useEffect(() => {
    const id = setInterval(loadEvents, 5000);
    return () => clearInterval(id);
  }, [filters]);

  const handleExportAllJSON = () => {
    const blob = new Blob([JSON.stringify(events, null, 2)], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `SentinelVision_Incident_Audit_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Stats
  const critical = events.filter(e => e.severity === 'critical').length;
  const high     = events.filter(e => e.severity === 'high').length;
  const medium   = events.filter(e => e.severity === 'medium').length;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121821] border border-[#243041] p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-[#E6EDF3] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-400" />
            Safety Incident Investigation &amp; Forensic Log
          </h2>
          <p className="text-xs text-[#8B98A9] mt-0.5">
            Audit YOLO-detected safety incidents · WHO / WHAT / WHERE / WHEN / WHY explainability
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadEvents}
            className="p-2.5 rounded-lg bg-[#0B0F14] border border-[#243041] text-[#8B98A9] hover:text-teal-400 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button variant="outline" size="md" onClick={handleExportAllJSON}>
            <Download className="w-4 h-4 text-teal-400" /> Export Audit Log
          </Button>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: events.length, color: 'text-[#E6EDF3]', border: 'border-[#243041]' },
          { label: 'Critical',     value: critical,       color: 'text-red-400',    border: 'border-red-500/20' },
          { label: 'High Risk',    value: high,           color: 'text-orange-400', border: 'border-orange-500/20' },
          { label: 'Medium',       value: medium,         color: 'text-amber-400',  border: 'border-amber-500/20' },
        ].map(s => (
          <div key={s.label} className={`bg-[#0B0F14] border ${s.border} rounded-xl p-4 flex flex-col`}>
            <span className="text-[10px] font-mono text-[#8B98A9] uppercase">{s.label}</span>
            <span className={`text-2xl font-bold font-mono mt-1 ${s.color}`}>{s.value}</span>
          </div>
        ))}
      </div>

      {/* Model info banner */}
      <div className="flex items-center gap-3 bg-teal-500/5 border border-teal-500/20 rounded-xl px-4 py-3">
        <Brain className="w-4 h-4 text-teal-400 shrink-0" />
        <p className="text-xs font-mono text-teal-400">
          Detections powered by <strong>YOLOv8 · best.pt</strong> — trained classes:
          Hardhat · Mask · NO-Hardhat · NO-Mask · NO-Safety Vest · Person · Safety Cone · Safety Vest · machinery · vehicle
        </p>
      </div>

      {/* Filters */}
      <EventFilterBar filters={filters} onFilterChange={setFilters} onReset={() => setFilters({ search: '', eventType: 'all', severity: 'all', zone: 'all' })} />

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-xs font-mono text-[#8B98A9] gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          Loading incident records from backend…
        </div>
      ) : events.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[300px] text-center gap-4 bg-[#121821] border border-[#243041] rounded-xl p-8">
          <ShieldAlert className="w-10 h-10 text-emerald-400/40" />
          <div>
            <p className="text-sm font-bold font-mono text-[#8B98A9]">No incidents found</p>
            <p className="text-xs text-[#8B98A9]/60 mt-1">
              Upload a construction video on the Configure page to start YOLO analysis
            </p>
          </div>
        </div>
      ) : (
        <EventTable events={events} onSelectEvent={setSelectedEvent} />
      )}

      {/* Incident Detail Modal */}
      {selectedEvent && (
        <Dialog
          isOpen
          onClose={() => setSelectedEvent(null)}
          title={`Incident: ${selectedEvent.event_id}`}
          subtitle={`Worker #${selectedEvent.worker_id} · ${selectedEvent.event_type.replace(/_/g, ' ')}`}
          maxWidth="4xl"
        >
          <IncidentDetailPage
            eventIdParam={selectedEvent.event_id}
            onCloseModal={() => { setSelectedEvent(null); loadEvents(); }}
          />
        </Dialog>
      )}
    </div>
  );
};
