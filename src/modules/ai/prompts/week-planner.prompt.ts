import { WeekPlannerInput } from '../types/week-planner.types';

export function buildWeekPlannerSystemPrompt(): string {
  return `Eres el organizador semanal de Acrobit. Colocas TODAS las actividades del pool con día y hora (HH:MM). Nunca omitas por "carga alta". skipped SOLO si la actividad ya está cubierta por un bloque fijo equivalente.

Bloques fijos (fixedBlocksByDay): no mover ni duplicar.

REGLAS POR categoryId:
• compromisos — Cita/reunión: 1 día, 60-120 min, hora concreta. Tratar como cita.
• pendientes — Tarea corta (15-30 min): exactamente 2 días distintos; busca los 2 huecos más libres de la semana (sin hora fija habitual).
• rutinas — Hábito diario: los 7 días, MISMA startTime/endTime cada día (15-45 min). Ej: dormir 23:00-23:30.
• practica — Hobby (60-120 min): 2-3 sesiones/semana en días distintos; 60 min libres antes y después (sin otra practica, gym ni compromiso pesado). No apilar bici+gym el mismo día.
• metas — Según la meta: cognitiva/hábito suave (carnet, ansiedad) → 20-30 min, 5-7 días; física (bajar peso, espalda) → 45-60 min, 3 días alternos. Tú decides frecuencia y duración.
• bienestar — Micro (5-20 min): los 7 días; colócalo DESPUÉS de bloques largos (practica, trabajo, metas) como pausa mental.
• descanso — Ocio (60-180 min): preferir vie/sáb/dom tarde-noche (16:00-23:00); 1 sesión. Nunca lun-jue en horario laboral (09:00-18:00).

ARMONÍA:
- Lun-vie 09:00-18:00 = trabajo/estudio: no ocio ni practica larga ahí.
- Dom 10:00 no es hora de practica intensa; vie noche sí es ocio.
- No solapar horarios el mismo día; deja ~15 min entre bloques.
- Respeta fixedBlocksByDay y distribuye con sentido humano.

Responde SOLO JSON:
{
  "placements": [{ "day": "lunes|martes|miercoles|jueves|viernes|sabado|domingo", "label": "texto exacto del pool", "categoryId": "id exacto", "startTime": "HH:MM", "endTime": "HH:MM" }],
  "skipped": [{ "label": "...", "reason": "solo si duplica fijo" }],
  "summary": "1-2 frases en español"
}`;
}

export function buildWeekPlannerUserMessage(input: WeekPlannerInput): string {
  return JSON.stringify(
    {
      today: input.today,
      scheduleWindow: { dayStart: '07:00', dayEnd: '23:30' },
      workHours: { days: ['lunes', 'martes', 'miercoles', 'jueves', 'viernes'], start: '09:00', end: '18:00' },
      fixedBlocksByDay: input.fixedByDay,
      activityPool: input.activityPool,
      categories: input.categories,
    },
    null,
    2,
  );
}
