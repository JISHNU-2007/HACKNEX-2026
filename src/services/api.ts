import type {
  Worker,
  TrajectoryPoint,
  Zone,
  SafetyEvent,
  TimelineItem,
  SafetyConfig,
} from '../types';
import { mockWorkers } from '../mocks/workers';
import { mockZones } from '../mocks/zones';
import { mockEvents, mockTimelines } from '../mocks/events';
import { mockTracks, getTrajectoryPointsAtTime } from '../mocks/tracks';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

let currentConfig: SafetyConfig = {
  scenario: 'Factory',
  zones: [...mockZones],
  rules: {
    helmet: true,
    vest: true,
    restricted: true,
    max_idle_sec: 60,
    crowd_limit: 5,
  },
  thresholds: {
    low: [0, 30],
    medium: [31, 60],
    high: [61, 80],
    critical: [81, 100],
  },
};

let activeEvents: SafetyEvent[] = [...mockEvents];
let currentWorkers: Worker[] = [...mockWorkers];
let uploadedVideoUrl: string | null = null;

const delay = (ms: number = 100) => new Promise((resolve) => setTimeout(resolve, ms));

export const api = {
  async uploadVideo(file: File): Promise<{ video_id: string; url: string; duration: number }> {
    await delay(300);
    const url = URL.createObjectURL(file);
    uploadedVideoUrl = url;
    return {
      video_id: `vid_${Date.now()}`,
      url,
      duration: 120,
    };
  },

  async getConfig(): Promise<SafetyConfig> {
    await delay(100);
    return { ...currentConfig };
  },

  async saveConfig(config: SafetyConfig): Promise<{ success: boolean }> {
    await delay(200);
    currentConfig = { ...config };
    return { success: true };
  },

  async getWorkers(): Promise<Worker[]> {
    await delay(100);
    return [...currentWorkers];
  },

  async getWorker(id: number): Promise<Worker | null> {
    await delay(100);
    return currentWorkers.find((w) => w.worker_id === id) || null;
  },

  async getTracks(_videoId?: string): Promise<TrajectoryPoint[]> {
    await delay(50);
    return mockTracks;
  },

  getTracksForTime(t: number): TrajectoryPoint[] {
    return getTrajectoryPointsAtTime(t);
  },

  async getEvents(filters?: {
    worker_id?: number;
    event_type?: string;
    severity?: string;
    zone?: string;
    search?: string;
  }): Promise<SafetyEvent[]> {
    await delay(100);
    let result = [...activeEvents];

    if (filters) {
      if (filters.worker_id) {
        result = result.filter((e) => e.worker_id === filters.worker_id);
      }
      if (filters.event_type && filters.event_type !== 'all') {
        result = result.filter((e) => e.event_type === filters.event_type);
      }
      if (filters.severity && filters.severity !== 'all') {
        result = result.filter((e) => e.severity === filters.severity);
      }
      if (filters.zone && filters.zone !== 'all') {
        result = result.filter((e) => e.zone.toLowerCase().includes(filters.zone!.toLowerCase()));
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        result = result.filter(
          (e) =>
            e.event_id.toLowerCase().includes(query) ||
            `worker #${e.worker_id}`.includes(query) ||
            e.reason.toLowerCase().includes(query) ||
            e.zone.toLowerCase().includes(query)
        );
      }
    }

    return result;
  },

  async getEvent(eventId: string): Promise<SafetyEvent | null> {
    await delay(100);
    return activeEvents.find((e) => e.event_id === eventId) || null;
  },

  async updateEventStatus(
    eventId: string,
    status: 'new' | 'acknowledged' | 'resolved'
  ): Promise<SafetyEvent | null> {
    await delay(150);
    const event = activeEvents.find((e) => e.event_id === eventId);
    if (event) {
      event.status = status;
      return { ...event };
    }
    return null;
  },

  async getTimeline(workerId: number): Promise<TimelineItem[]> {
    await delay(100);
    return mockTimelines[workerId] || [];
  },

  subscribeLive(
    callback: (event: { type: 'event_created' | 'status_updated'; payload: any }) => void
  ): () => void {
    const interval = setInterval(() => {
      callback({
        type: 'status_updated',
        payload: { timestamp: new Date().toLocaleTimeString() },
      });
    }, 4000);

    return () => clearInterval(interval);
  },

  getUploadedVideoUrl(): string | null {
    return uploadedVideoUrl;
  },
};
