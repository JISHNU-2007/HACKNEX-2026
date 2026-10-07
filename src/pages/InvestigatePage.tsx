import type { FilterState } from '../components/investigate/EventFilterBar';
import { EventFilterBar } from '../components/investigate/EventFilterBar';
import { EventTable } from '../components/investigate/EventTable';
import { IncidentDetailPage } from './IncidentDetailPage';
import { Dialog } from '../components/ui/Dialog';
import type { SafetyEvent } from '../types';
import { api } from '../services/api';
import { ShieldAlert, Download } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const InvestigatePage: React.FC = () => {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [filters, setFilters] = useState<FilterState>({
    search: '',
    eventType: 'all',
    severity: 'all',
    zone: 'all',
  });

  const [selectedEvent, setSelectedEvent] = useState<SafetyEvent | null>(null);

  const loadFilteredEvents = async () => {
    setLoading(true);
    const fetched = await api.getEvents(filters);
    setEvents(fetched);
    setLoading(false);
  };

  useEffect(() => {
    loadFilteredEvents();
  }, [filters]);

  const handleResetFilters = () => {
    setFilters({
      search: '',
      eventType: 'all',
      severity: 'all',
      zone: 'all',
    });
  };

  const handleExportAllJSON = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(events, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `SentinelVision_Incident_Audit_Log.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#121821] border border-[#243041] p-5 rounded-xl">
        <div>
          <h2 className="text-lg font-bold text-[#E6EDF3] tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-teal-400" />
            Safety Incident Investigation &amp; Forensic Log
          </h2>
          <p className="text-xs text-[#8B98A9] mt-0.5">
            Audit historic safety incidents, examine WHO/WHAT/WHERE/WHEN/WHY explanations and export compliance records
          </p>
        </div>

        <Button variant="outline" size="md" onClick={handleExportAllJSON}>
          <Download className="w-4 h-4 text-teal-400" /> Export Audit Log (JSON)
        </Button>
      </div>

      {/* Filter Bar */}
      <EventFilterBar
        filters={filters}
        onFilterChange={setFilters}
        onReset={handleResetFilters}
      />

      {/* Event Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px] text-xs font-mono text-[#8B98A9]">
          Loading incident records...
        </div>
      ) : (
        <EventTable events={events} onSelectEvent={setSelectedEvent} />
      )}

      {/* Modal Dialog for Incident Detail */}
      {selectedEvent && (
        <Dialog
          isOpen={!!selectedEvent}
          onClose={() => setSelectedEvent(null)}
          title={`Incident Audit: ${selectedEvent.event_id}`}
          subtitle={`Worker #${selectedEvent.worker_id} · ${selectedEvent.event_type.replace(/_/g, ' ')}`}
          maxWidth="4xl"
        >
          <IncidentDetailPage
            eventIdParam={selectedEvent.event_id}
            onCloseModal={() => {
              setSelectedEvent(null);
              loadFilteredEvents();
            }}
          />
        </Dialog>
      )}
    </div>
  );
};
