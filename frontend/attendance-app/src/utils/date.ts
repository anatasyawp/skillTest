export function formatDateId(dateStr: string, withWeekday = false): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('id-ID', {
    ...(withWeekday ? { weekday: 'long' } : {}),
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatTimeId(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}
