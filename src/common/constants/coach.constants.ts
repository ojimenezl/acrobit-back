/** Minutos antes de la tarea para fase prep (alineado con front). */
export const COACH_PREP_MINUTES_BEFORE = 10;

/** Ventana prep/at_time (min) — alineado con front. */
export const COACH_PREP_RESPONSE_WINDOW_MIN = 25;
export const COACH_AT_TIME_RESPONSE_WINDOW_MIN = 20;

/** Espera tras hora local antes de enviar FCM fallback (ms). */
export const COACH_LOCAL_FALLBACK_GRACE_MS = 2 * 60_000;

export const MAX_COACH_NOTIFICATIONS_PER_DAY = 12;

export const FCM_DATA_TYPES = {
  scheduleSync: 'SCHEDULE_SYNC',
  taskReminder: 'TASK_REMINDER',
} as const;
