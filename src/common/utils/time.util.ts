const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

export function isValidTime(value: string): boolean {
  return TIME_PATTERN.test(value);
}

export function toMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function addMinutes(time: string, minutes: number): string {
  const total = toMinutes(time) + minutes;
  const normalized = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hours = Math.floor(normalized / 60);
  const mins = normalized % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

export function timesOverlap(
  startA: string,
  endA: string,
  startB: string,
  endB: string,
  gapMinutes = 15,
): boolean {
  const aStart = toMinutes(startA);
  const aEnd = toMinutes(endA);
  const bStart = toMinutes(startB);
  const bEnd = toMinutes(endB);
  if (aEnd <= aStart || bEnd <= bStart) {
    return true;
  }
  return aStart < bEnd + gapMinutes && aEnd > bStart - gapMinutes;
}
