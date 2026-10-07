export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type WorkerStatus = 'safe' | 'warning' | 'high_risk';
export type EventType = 'restricted_zone_entry' | 'prolonged_presence' | 'ppe_violation';
export type ZoneType = 'general' | 'restricted' | 'danger' | 'machine' | 'ppe_required';

export interface Worker {
  worker_id: number;
  first_seen: string;
  last_seen: string;
  status: WorkerStatus;
  risk_score: number;
  current_zone: string | null;
  ppe: {
    helmet: boolean;
    vest: boolean;
  };
}

export interface TrajectoryPoint {
  worker_id: number;
  timestamp: number; // seconds into video
  x: number;
  y: number; // normalised 0-1
  w: number;
  h: number; // normalised 0-1
  zone: string | null;
  speed: number;
}

export interface Zone {
  zone_id: string;
  zone_name: string;
  zone_type: ZoneType;
  coordinates: { x: number; y: number; w: number; h: number }; // normalised 0-1
  ppe_required: { helmet: boolean; vest: boolean };
  duration_threshold: number; // seconds
}

export interface RiskFactor {
  label: string;
  points: number;
}

export interface SafetyEvent {
  event_id: string;
  worker_id: number;
  event_type: EventType;
  start_time: string;
  end_time: string | null;
  duration: number;
  zone: string;
  risk_score: number;
  severity: Severity;
  confidence: number;
  evidence_path: string;
  reason: string;
  risk_breakdown: RiskFactor[];
  risk_history: { t: number; score: number }[];
  status: 'new' | 'acknowledged' | 'resolved';
}

export interface TimelineItem {
  worker_id: number;
  timestamp: string;
  label: string;
  severity: Severity;
}

export interface SafetyConfig {
  scenario: string;
  zones: Zone[];
  rules: {
    helmet: boolean;
    vest: boolean;
    restricted: boolean;
    max_idle_sec: number;
    crowd_limit: number;
  };
  thresholds: {
    low: [number, number];
    medium: [number, number];
    high: [number, number];
    critical: [number, number];
  };
}
