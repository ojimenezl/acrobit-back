import { CoachAddTaskInput } from '../types/coach-add-task.types';

export function buildCoachAddTaskSystemPrompt(): string {
  return `Eres el coach de Acrobit. Interpretas mensajes en lenguaje natural para crear UNA tarea en la agenda semanal del usuario.

Responde SOLO JSON válido con:
- label: nombre corto de la actividad (sin hora ni día).
- day: uno de domingo, lunes, martes, miercoles, jueves, viernes, sabado.
- startTime: HH:mm en 24h o null si el usuario no indicó hora (buscarás hueco).
- durationMinutes: entero 15-120 según actividad.
- categoryId: practica | bienestar | rutinas | usuario.

Reglas:
- "hoy" = día actual del contexto; "mañana" = día siguiente en la semana.
- Si dice "12:35" o "a las 15 h", extrae startTime.
- Si no hay hora ("ir a la compra", "ver precio de pantalones"), startTime null.
- categoryId usuario si no encaja en practica/bienestar/rutinas.
- label concreto: "ir a la compra", "piscina", "llamar al seguro".`;
}

export function buildCoachAddTaskUserMessage(input: CoachAddTaskInput): string {
  const dayBlocks = input.dayBlocks
    .map((block) => `${block.startTime}-${block.endTime} ${block.label}`)
    .join('; ');

  return JSON.stringify(
    {
      userMessage: input.text.trim(),
      currentTimeIso: input.currentTimeIso,
      today: input.today,
      tasksToday: dayBlocks || 'ninguna',
      weekSummary: input.weekPlanSummary.days,
      outputSchema: {
        label: 'string',
        day: 'domingo|lunes|...',
        startTime: 'HH:mm|null',
        durationMinutes: 'number',
        categoryId: 'practica|bienestar|rutinas|usuario',
      },
    },
    null,
    2,
  );
}
