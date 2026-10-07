import { useState, useEffect, useCallback, useRef } from 'react';
import type { SafetyEvent, Worker } from '../types';
import { api } from '../services/api';

export function useLiveEvents() {
  const [events, setEvents]               = useState<SafetyEvent[]>([]);
  const [workers, setWorkers]             = useState<Worker[]>([]);
  const [loading, setLoading]             = useState(true);
  const [toastMessage, setToastMessage]   = useState<{ id: string; title: string; desc: string; severity: string } | null>(null);
  const seenEventIds                      = useRef<Set<string>>(new Set());

  const fetchAll = useCallback(async () => {
    const [evts, wrks] = await Promise.all([api.getEvents(), api.getWorkers()]);
    setEvents(evts);
    setWorkers(wrks);
    evts.forEach(e => seenEventIds.current.add(e.event_id));
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));

    const unsub = api.subscribeLive((msg) => {
      if (msg.type === 'snapshot') {
        // Full snapshot on SSE connect
        const { events: evts, workers: wrks } = msg.payload;
        if (Array.isArray(evts))  { setEvents(evts); evts.forEach((e: SafetyEvent) => seenEventIds.current.add(e.event_id)); }
        if (Array.isArray(wrks))  setWorkers(wrks);
        setLoading(false);
      } else if (msg.type === 'event_created') {
        const ev: SafetyEvent = msg.payload;
        if (!seenEventIds.current.has(ev.event_id)) {
          seenEventIds.current.add(ev.event_id);
          setEvents(prev => [ev, ...prev]);
          setToastMessage({
            id:       ev.event_id,
            title:    `[${ev.severity.toUpperCase()}] ${ev.event_type.replace(/_/g, ' ')}`,
            desc:     `Worker #${ev.worker_id} · ${ev.reason.slice(0, 80)}`,
            severity: ev.severity,
          });
          // Also refresh workers list
          api.getWorkers().then(setWorkers);
        }
      } else if (msg.type === 'heartbeat' || msg.type === 'status_updated') {
        // Re-fetch events+workers on every heartbeat to stay in sync
        fetchAll();
      }
    });

    // Also poll every 5s for updates after video analysis completes
    const pollInterval = setInterval(fetchAll, 5000);

    return () => { unsub(); clearInterval(pollInterval); };
  }, [fetchAll]);

  const clearToast = () => setToastMessage(null);

  return {
    events,
    workers,
    loading,
    toastMessage,
    clearToast,
    refreshData: fetchAll,
  };
}
