import type { Worker } from '../types';

export const mockWorkers: Worker[] = [
  {
    worker_id: 1,
    first_seen: '10:15:00',
    last_seen: '10:44:12',
    status: 'safe',
    risk_score: 12,
    current_zone: 'General Work Area',
    ppe: { helmet: true, vest: true },
  },
  {
    worker_id: 2,
    first_seen: '10:16:30',
    last_seen: '10:44:10',
    status: 'safe',
    risk_score: 18,
    current_zone: 'Machine Assembly Area',
    ppe: { helmet: true, vest: true },
  },
  {
    worker_id: 17,
    first_seen: '10:21:03',
    last_seen: '10:44:18',
    status: 'high_risk',
    risk_score: 91,
    current_zone: 'Welding Area (Restricted)',
    ppe: { helmet: false, vest: true },
  },
];
