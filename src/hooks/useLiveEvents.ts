import { useState, useEffect } from 'react';
import type { SafetyEvent, Worker } from '../types';
import { api } from '../services/api';

export function useLiveEvents() {
  const [events, setEvents] = useState<SafetyEvent[]>([]);
  const [workers, setWorkers] = useState<Worker[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<{ id: string; title: string; desc: string; severity: string } | null>(null);

  const fetchInitialData = async () => {
    try {
      const [fetchedEvents, fetchedWorkers] = await Promise.all([
        api.getEvents(),
        api.getWorkers(),
      ]);
      setEvents(fetchedEvents);
      setWorkers(fetchedWorkers);
    } catch (err) {
      console.error('Failed to load initial live data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInitialData();

    const unsubscribe = api.subscribeLive(() => {
      // Refresh events & workers periodically to reflect changes
      api.getEvents().then(setEvents);
      api.getWorkers().then(setWorkers);
    });

    return () => unsubscribe();
  }, []);

  const triggerMockIncident = (event: SafetyEvent) => {
    setEvents((prev) => [event, ...prev]);
    setToastMessage({
      id: event.event_id,
      title: `[${event.severity.toUpperCase()}] ${event.event_type.replace(/_/g, ' ')}`,
      desc: `Worker #${event.worker_id} in ${event.zone}. Risk Score ${event.risk_score}/100`,
      severity: event.severity,
    });
  };

  const clearToast = () => setToastMessage(null);

  return {
    events,
    workers,
    loading,
    toastMessage,
    clearToast,
    triggerMockIncident,
    refreshData: fetchInitialData,
  };
}
