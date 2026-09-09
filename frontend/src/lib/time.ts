export function formatRelativeTime(dateStr: string): string {
  const diffMs = Date.now() - new Date(dateStr).getTime();
  const sec = Math.max(0, Math.floor(diffMs / 1000));

  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 7) return `${day}d ago`;

  const week = Math.floor(day / 7);
  if (week < 4) return `${week}w ago`;

  const month = Math.floor(day / 30);
  if (month < 12) return `${month}mo ago`;

  const year = Math.floor(day / 365);
  return `${year}y ago`;
}