/**
 * SentinelVision AI — API Service Layer v2
 * Connects to FastAPI/YOLOv8 backend. Falls back to mock data when backend unavailable.
 * Model classes: Hardhat, Mask, NO-Hardhat, NO-Mask, NO-Safety Vest, Person, Safety Cone, Safety Vest, machinery, vehicle
 */
import type {
  Worker,
  TrajectoryPoint,
  Zone,
  SafetyEvent,
  TimelineItem,
  SafetyConfig,
} from '../types';
import { mockWorkers }                          from '../mocks/workers';
import { mockZones }                            from '../mocks/zones';
import { mockEvents, mockTimelines }            from '../mocks/events';
import { mockTracks, getTrajectoryPointsAtTime }from '../mocks/tracks';

export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000/api';

// ── Local fallback config ─────────────────────────────────────────────────
let currentConfig: SafetyConfig = {
  scenario: 'Construction',
  zones:    [...mockZones],
  rules:    { helmet: true, vest: true, restricted: true, max_idle_sec: 60, crowd_limit: 5 },
  thresholds: { low: [0,30], medium: [31,60], high: [61,80], critical: [81,100] },
};

let _uploadedVideoId:  string | null = null;
let _uploadedVideoUrl: string | null = null;
let _backendOnline = false;

// ── HTTP helper ────────────────────────────────────────────────────────────
async function get<T>(path: string): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`);
    if (!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}
async function post<T>(path: string, body?: unknown): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}
async function patch<T>(path: string, body: unknown): Promise<T | null> {
  try {
    const r = await fetch(`${API_BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!r.ok) return null;
    return await r.json() as T;
  } catch { return null; }
}

// ── Check backend health ───────────────────────────────────────────────────
async function checkBackend(): Promise<boolean> {
  try {
    const r = await fetch(API_BASE.replace('/api', '/'));
    _backendOnline = r.ok;
  } catch { _backendOnline = false; }
  return _backendOnline;
}

// ── API Object ─────────────────────────────────────────────────────────────
export const api = {

  // ── Upload Video ──────────────────────────────────────────────────────
  async uploadVideo(file: File): Promise<{ video_id: string; url: string; duration: number }> {
    const form = new FormData();
    form.append('file', file);
    try {
      const r = await fetch(`${API_BASE}/video/upload`, { method: 'POST', body: form });
      if (r.ok) {
        const d = await r.json();
        _uploadedVideoId  = d.video_id;
        _uploadedVideoUrl = d.url;
        _backendOnline = true;
        return { video_id: d.video_id, url: d.url, duration: d.duration ?? 0 };
      }
    } catch { /* fall through */ }
    // Fallback
    _backendOnline = false;
    const url = URL.createObjectURL(file);
    _uploadedVideoUrl = url;
    _uploadedVideoId  = `vid_mock_${Date.now()}`;
    return { video_id: _uploadedVideoId, url, duration: 120 };
  },

  // ── Video Analysis Status ─────────────────────────────────────────────
  async getVideoStatus(videoId: string): Promise<{ status: string; event_count?: number; worker_count?: number; annotated_url?: string } | null> {
    return get(`/video/${videoId}/status`);
  },

  // ── Config ────────────────────────────────────────────────────────────
  async getConfig(): Promise<SafetyConfig> {
    const d = await get<SafetyConfig>('/config');
    if (d) { currentConfig = d; return d; }
    return { ...currentConfig };
  },

  async saveConfig(config: SafetyConfig): Promise<{ success: boolean }> {
    const d = await post<{ success: boolean }>('/config', config);
    currentConfig = { ...config };
    return d ?? { success: true };
  },

  // ── Workers ───────────────────────────────────────────────────────────
  async getWorkers(): Promise<Worker[]> {
    const d = await get<Worker[]>('/workers');
    if (d && d.length > 0) return d;
    return [...mockWorkers];
  },

  async getWorker(id: number): Promise<Worker | null> {
    const d = await get<Worker>(`/workers/${id}`);
    if (d) return d;
    return mockWorkers.find(w => w.worker_id === id) ?? null;
  },

  // ── Tracks ────────────────────────────────────────────────────────────
  async getTracks(_videoId?: string): Promise<TrajectoryPoint[]> {
    return [];
  },
  getTracksForTime(t: number): TrajectoryPoint[] {
    return [];
  },

  // ── Events ────────────────────────────────────────────────────────────
  async getEvents(filters?: {
    worker_id?: number; event_type?: string;
    severity?: string; zone?: string; search?: string;
  }): Promise<SafetyEvent[]> {
    const p = new URLSearchParams();
    if (filters?.worker_id)  p.set('worker_id',  String(filters.worker_id));
    if (filters?.event_type) p.set('event_type', filters.event_type);
    if (filters?.severity)   p.set('severity',   filters.severity);
    if (filters?.zone)       p.set('zone',        filters.zone);
    if (filters?.search)     p.set('search',      filters.search);
    const qs   = p.toString() ? `?${p}` : '';
    const data = await get<SafetyEvent[]>(`/events${qs}`);
    if (data && data.length > 0) return data;

    // fallback mock with filter
    let r = [...mockEvents] as SafetyEvent[];
    if (filters?.worker_id) r = r.filter(e => e.worker_id === filters.worker_id);
    if (filters?.event_type && filters.event_type !== 'all') r = r.filter(e => e.event_type === filters.event_type);
    if (filters?.severity   && filters.severity   !== 'all') r = r.filter(e => e.severity   === filters.severity);
    if (filters?.zone       && filters.zone       !== 'all') r = r.filter(e => e.zone.toLowerCase().includes(filters.zone!.toLowerCase()));
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      r = r.filter(e => e.event_id.toLowerCase().includes(q) || `worker #${e.worker_id}`.includes(q) || e.reason.toLowerCase().includes(q));
    }
    return r;
  },

  async getEvent(eventId: string): Promise<SafetyEvent | null> {
    const d = await get<SafetyEvent>(`/events/${eventId}`);
    if (d) return d;
    return (mockEvents as SafetyEvent[]).find(e => e.event_id === eventId) ?? null;
  },

  async updateEventStatus(eventId: string, status: 'new' | 'acknowledged' | 'resolved'): Promise<SafetyEvent | null> {
    return patch<SafetyEvent>(`/events/${eventId}`, { status });
  },

  // ── Timeline ──────────────────────────────────────────────────────────
  async getTimeline(workerId: number): Promise<TimelineItem[]> {
    const d = await get<TimelineItem[]>(`/timeline/${workerId}`);
    if (d && d.length > 0) return d;
    return (mockTimelines as Record<number, TimelineItem[]>)[workerId] ?? [];
  },

  // ── Live SSE stream ───────────────────────────────────────────────────
  subscribeLive(
    callback: (event: { type: string; payload: any }) => void
  ): () => void {
    let es: EventSource | null = null;
    let fallbackInterval: ReturnType<typeof setInterval> | null = null;

    try {
      es = new EventSource(`${API_BASE}/live`);
      es.onmessage = (e) => {
        try { callback(JSON.parse(e.data)); } catch { /* ignore */ }
      };
      es.onerror = () => {
        es?.close();
        // Switch to polling fallback
        fallbackInterval = setInterval(() => {
          callback({ type: 'status_updated', payload: { timestamp: new Date().toLocaleTimeString() } });
        }, 4000);
      };
      return () => { es?.close(); if (fallbackInterval) clearInterval(fallbackInterval); };
    } catch {
      fallbackInterval = setInterval(() => {
        callback({ type: 'status_updated', payload: { timestamp: new Date().toLocaleTimeString() } });
      }, 4000);
      return () => { if (fallbackInterval) clearInterval(fallbackInterval); };
    }
  },

  // ── Utilities ─────────────────────────────────────────────────────────
  getUploadedVideoUrl(): string | null { return _uploadedVideoUrl; },
  getUploadedVideoId():  string | null { return _uploadedVideoId;  },
  isBackendOnline():     boolean       { return _backendOnline;     },
  checkBackend,
};
