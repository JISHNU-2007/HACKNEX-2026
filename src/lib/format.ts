export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${Math.round(seconds)}s`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.round(seconds % 60);
  return `${mins}m ${secs < 10 ? '0' : ''}${secs}s`;
}

export function formatVideoTime(seconds: number): string {
  if (isNaN(seconds)) return '00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
  
  if (hrs > 0) {
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  }
  return `00:${pad(mins)}:${pad(secs)}`;
}

export function formatTimestamp(isoOrTime: string): string {
  if (!isoOrTime) return '--:--:--';
  if (isoOrTime.includes('T')) {
    const d = new Date(isoOrTime);
    return d.toTimeString().split(' ')[0];
  }
  return isoOrTime;
}
