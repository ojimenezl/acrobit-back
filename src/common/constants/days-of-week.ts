import { DayOfWeek } from '../enums/day-of-week.enum';

export const DAYS_OF_WEEK: DayOfWeek[] = [
  DayOfWeek.DOMINGO,
  DayOfWeek.LUNES,
  DayOfWeek.MARTES,
  DayOfWeek.MIERCOLES,
  DayOfWeek.JUEVES,
  DayOfWeek.VIERNES,
  DayOfWeek.SABADO,
];

export const MAX_DAILY_BLOCKS = 6;

export function getTodayDayOfWeek(): DayOfWeek {
  return DAYS_OF_WEEK[new Date().getDay()];
}
