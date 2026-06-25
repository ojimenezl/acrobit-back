/** Reglas de colocación por categoría (compartidas prompt + validador + fallback). */
export const CATEGORY_PLACEMENT_RULES: Record<
  string,
  {
    perWeek: number;
    defaultDurationMin: number;
    sameTimeEveryDay: boolean;
    defaultStartTime: string;
    preferWeekend?: boolean;
    avoidWorkHours?: boolean;
  }
> = {
  compromisos: {
    perWeek: 1,
    defaultDurationMin: 90,
    sameTimeEveryDay: false,
    defaultStartTime: '19:00',
    avoidWorkHours: true,
  },
  pendientes: {
    perWeek: 2,
    defaultDurationMin: 20,
    sameTimeEveryDay: false,
    defaultStartTime: '11:00',
  },
  rutinas: {
    perWeek: 7,
    defaultDurationMin: 30,
    sameTimeEveryDay: true,
    defaultStartTime: '22:00',
  },
  practica: {
    perWeek: 3,
    defaultDurationMin: 60,
    sameTimeEveryDay: false,
    defaultStartTime: '17:00',
    avoidWorkHours: true,
  },
  metas: {
    perWeek: 5,
    defaultDurationMin: 25,
    sameTimeEveryDay: false,
    defaultStartTime: '08:30',
  },
  bienestar: {
    perWeek: 7,
    defaultDurationMin: 10,
    sameTimeEveryDay: false,
    defaultStartTime: '12:30',
  },
  descanso: {
    perWeek: 1,
    defaultDurationMin: 120,
    sameTimeEveryDay: false,
    defaultStartTime: '18:00',
    preferWeekend: true,
    avoidWorkHours: true,
  },
};

export const WEEKEND_DAYS = new Set(['viernes', 'sabado', 'domingo']);
export const WORK_DAYS = new Set([
  'lunes',
  'martes',
  'miercoles',
  'jueves',
  'viernes',
]);
