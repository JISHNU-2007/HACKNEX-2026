import type { SafetyEvent, TimelineItem } from '../types';

export const mockEvents: SafetyEvent[] = [
  {
    event_id: 'EVT-2026-0891',
    worker_id: 17,
    event_type: 'prolonged_presence',
    start_time: '10:21:18',
    end_time: '10:22:26',
    duration: 68,
    zone: 'Welding Area (Restricted)',
    risk_score: 91,
    severity: 'critical',
    confidence: 0.94,
    evidence_path: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80',
    reason: 'Worker entered a restricted zone without a detected safety helmet and remained stationary for over 60 seconds near active machinery.',
    risk_breakdown: [
      { label: 'Restricted Zone', points: 35 },
      { label: 'No Helmet', points: 25 },
      { label: 'Long Duration', points: 15 },
      { label: 'Machine Proximity', points: 16 },
    ],
    risk_history: [
      { t: 0, score: 15 },
      { t: 18, score: 30 },
      { t: 25, score: 50 },
      { t: 45, score: 75 },
      { t: 103, score: 91 },
    ],
    status: 'new',
  },
  {
    event_id: 'EVT-2026-0888',
    worker_id: 2,
    event_type: 'restricted_zone_entry',
    start_time: '10:18:12',
    end_time: '10:19:05',
    duration: 53,
    zone: 'Machine Assembly Area',
    risk_score: 45,
    severity: 'medium',
    confidence: 0.89,
    evidence_path: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
    reason: 'Worker approached heavy machinery perimeter during active operation cycle.',
    risk_breakdown: [
      { label: 'Machine Proximity', points: 25 },
      { label: 'Fast Movement', points: 20 },
    ],
    risk_history: [
      { t: 0, score: 10 },
      { t: 20, score: 35 },
      { t: 40, score: 45 },
    ],
    status: 'acknowledged',
  },
  {
    event_id: 'EVT-2026-0875',
    worker_id: 1,
    event_type: 'ppe_violation',
    start_time: '10:10:00',
    end_time: '10:10:18',
    duration: 18,
    zone: 'General Work Area',
    risk_score: 22,
    severity: 'low',
    confidence: 0.91,
    evidence_path: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b7?auto=format&fit=crop&w=800&q=80',
    reason: 'Temporary unstrapped helmet detected during routine transit.',
    risk_breakdown: [
      { label: 'Unstrapped Helmet', points: 22 },
    ],
    risk_history: [
      { t: 0, score: 10 },
      { t: 10, score: 22 },
    ],
    status: 'resolved',
  },
];

export const mockTimelines: Record<number, TimelineItem[]> = {
  17: [
    { worker_id: 17, timestamp: '10:21:03', label: 'Entered workplace', severity: 'low' },
    { worker_id: 17, timestamp: '10:21:18', label: 'Entered restricted zone (Welding Area)', severity: 'medium' },
    { worker_id: 17, timestamp: '10:21:25', label: 'Helmet not detected', severity: 'medium' },
    { worker_id: 17, timestamp: '10:21:45', label: 'Stationary in restricted zone (>30s)', severity: 'high' },
    { worker_id: 17, timestamp: '10:22:18', label: 'HIGH-RISK EVENT (Prolonged presence 63s)', severity: 'critical' },
    { worker_id: 17, timestamp: '10:22:26', label: 'Exited restricted zone', severity: 'low' },
  ],
  2: [
    { worker_id: 2, timestamp: '10:16:30', label: 'Entered workplace', severity: 'low' },
    { worker_id: 2, timestamp: '10:18:12', label: 'Approached Machine Area', severity: 'medium' },
    { worker_id: 2, timestamp: '10:19:05', label: 'Returned to General Work Area', severity: 'low' },
  ],
  1: [
    { worker_id: 1, timestamp: '10:15:00', label: 'Entered workplace', severity: 'low' },
    { worker_id: 1, timestamp: '10:10:00', label: 'Brief PPE adjustment', severity: 'low' },
    { worker_id: 1, timestamp: '10:40:00', label: 'Normal walking pattern', severity: 'low' },
  ]
};
