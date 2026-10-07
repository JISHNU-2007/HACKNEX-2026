import type { TrajectoryPoint } from '../types';

/**
 * Generates smooth trajectory points for workers dynamically based on timestamp `t` in seconds.
 */
export function getTrajectoryPointsAtTime(t: number): TrajectoryPoint[] {
  const points: TrajectoryPoint[] = [];

  // Worker #01 - Safe worker walking back & forth in General Work Area
  const w1X = 0.12 + 0.25 * Math.sin(t * 0.1);
  const w1Y = 0.25 + 0.3 * Math.cos(t * 0.08);
  points.push({
    worker_id: 1,
    timestamp: t,
    x: Math.min(Math.max(w1X, 0.06), 0.45),
    y: Math.min(Math.max(w1Y, 0.12), 0.82),
    w: 0.08,
    h: 0.22,
    zone: 'General Work Area',
    speed: 1.2,
  });

  // Worker #02 - Machine area worker
  const w2X = 0.62 + 0.15 * Math.cos(t * 0.15);
  const w2Y = 0.18 + 0.1 * Math.sin(t * 0.12);
  points.push({
    worker_id: 2,
    timestamp: t,
    x: Math.min(Math.max(w2X, 0.56), 0.90),
    y: Math.min(Math.max(w2Y, 0.10), 0.42),
    w: 0.08,
    h: 0.22,
    zone: 'Machine Assembly Area',
    speed: 0.9,
  });

  // Worker #17 - The high-risk worker demo scenario
  let w17X = 0.25;
  let w17Y = 0.60;
  let zoneName: string | null = 'General Work Area';
  let speed = 1.1;

  if (t < 18) {
    const progress = t / 18;
    w17X = 0.25 + progress * (0.68 - 0.25);
    w17Y = 0.60 + progress * (0.70 - 0.60);
    zoneName = 'General Work Area';
    speed = 1.2;
  } else if (t >= 18 && t < 105) {
    w17X = 0.68 + 0.02 * Math.sin((t - 18) * 0.2);
    w17Y = 0.70 + 0.02 * Math.cos((t - 18) * 0.2);
    zoneName = 'Welding Area (Restricted)';
    speed = t > 25 ? 0.05 : 0.4;
  } else {
    const progress = Math.min(1, (t - 105) / 15);
    w17X = 0.68 - progress * (0.40);
    w17Y = 0.70 - progress * (0.20);
    zoneName = 'General Work Area';
    speed = 1.4;
  }

  points.push({
    worker_id: 17,
    timestamp: t,
    x: w17X,
    y: w17Y,
    w: 0.08,
    h: 0.22,
    zone: zoneName,
    speed,
  });

  return points;
}

export const mockTracks: TrajectoryPoint[] = (() => {
  const tracks: TrajectoryPoint[] = [];
  for (let t = 0; t <= 120; t += 0.2) {
    const roundedT = Math.round(t * 10) / 10;
    tracks.push(...getTrajectoryPointsAtTime(roundedT));
  }
  return tracks;})();
