/** Desplazamiento mínimo razonable al reorganizar (minutos). */
export const COACH_RESCHEDULE_MIN_SHIFT: Record<string, number> = {
  comida: 30,
  rutinas: 30,
  practica: 60,
  bienestar: 30,
  metas: 30,
  usuario: 15,
};

export const COACH_RESCHEDULE_DEFAULT_SHIFT = 30;

/** Máximo de horas hacia adelante en el mismo día (evita mover comida a las 22:00). */
export const COACH_RESCHEDULE_MAX_HOURS_AHEAD = 4;
