import type { Zone } from '../types';

export const mockZones: Zone[] = [
  {
    zone_id: 'zone_general',
    zone_name: 'General Work Area',
    zone_type: 'general',
    coordinates: { x: 0.05, y: 0.1, w: 0.45, h: 0.8 },
    ppe_required: { helmet: false, vest: false },
    duration_threshold: 120,
  },
  {
    zone_id: 'zone_machine',
    zone_name: 'Machine Assembly Area',
    zone_type: 'machine',
    coordinates: { x: 0.55, y: 0.08, w: 0.4, h: 0.38 },
    ppe_required: { helmet: true, vest: true },
    duration_threshold: 90,
  },
  {
    zone_id: 'zone_welding',
    zone_name: 'Welding Area (Restricted)',
    zone_type: 'restricted',
    coordinates: { x: 0.55, y: 0.52, w: 0.4, h: 0.4 },
    ppe_required: { helmet: true, vest: true },
    duration_threshold: 60,
  },
];
