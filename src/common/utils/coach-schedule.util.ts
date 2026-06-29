import { COACH_PREP_MINUTES_BEFORE } from '../constants/coach.constants';
import { getTodayDayOfWeek, DAYS_OF_WEEK } from '../constants/days-of-week';
import { DayOfWeek } from '../enums/day-of-week.enum';

/** Combina día de la semana + HH:mm en Date (offset desde `now`). */
export function combineDayAndTime(
  day: DayOfWeek,
  startTime: string,
  now: Date = new Date(),
): Date {
  const dayOrder = DAYS_OF_WEEK;
  const currentDay = dayOrder[now.getDay()];
  const offset =
    (dayOrder.indexOf(day) - dayOrder.indexOf(currentDay) + 7) % 7;
  const [hours, minutes] = startTime.split(':').map(Number);
  const date = new Date(now);
  date.setDate(now.getDate() + offset);
  date.setHours(hours, minutes, 0, 0);
  return date;
}

export function resolvePrepAt(
  day: DayOfWeek,
  startTime: string,
  now: Date = new Date(),
): Date {
  const taskAt = combineDayAndTime(day, startTime, now);
  return new Date(taskAt.getTime() - COACH_PREP_MINUTES_BEFORE * 60_000);
}

export function resolveTaskAt(
  day: DayOfWeek,
  startTime: string,
  now: Date = new Date(),
): Date {
  return combineDayAndTime(day, startTime, now);
}

export function resolvePrepFireAt(
  day: DayOfWeek,
  startTime: string,
  now: Date = new Date(),
): Date | null {
  const taskAt = combineDayAndTime(day, startTime, now);
  const prepAt = new Date(
    taskAt.getTime() - COACH_PREP_MINUTES_BEFORE * 60_000,
  );
  return prepAt.getTime() > now.getTime() ? prepAt : null;
}

export function resolveAtTimeFireAt(
  day: DayOfWeek,
  startTime: string,
  now: Date = new Date(),
): Date | null {
  const taskAt = combineDayAndTime(day, startTime, now);
  return taskAt.getTime() > now.getTime() ? taskAt : null;
}

/** Ventana de cron: hasta 90s antes y 30s después del minuto objetivo. */
export function isDueForDispatch(fireAt: Date, now: Date = new Date()): boolean {
  const diffMs = fireAt.getTime() - now.getTime();
  return diffMs <= 90_000 && diffMs >= -30_000;
}

export { getTodayDayOfWeek };
