import { CoachPhase } from '../../../common/enums/task-engagement.enum';
import { CoachRescheduleInput } from '../types/coach-reschedule.types';

export function buildCoachRescheduleSystemPrompt(): string {
  return `Eres el coach de Acrobit. Propones un nuevo horario para UNA tarea del día del usuario.

Reglas:
- Responde SOLO JSON válido.
- proposedStartTime y proposedEndTime en formato HH:mm (24h).
- Mantén la duración original de la tarea salvo que no quepa; entonces ajusta endTime.
- Propón un horario posterior razonable según la hora actual y las demás tareas.
- Nunca propongas un horario absurdo (ej. comida a las 22:00 si son las 11:00).
- reason: una frase corta en español explicando por qué ese horario encaja (máx. 160 caracteres).
- No menciones botones ni confirmación; el usuario verá Sí / Cancelar aparte.`;
}

export function buildCoachRescheduleUserMessage(
  input: CoachRescheduleInput,
  minShiftMinutes: number,
  durationMinutes: number,
): string {
  const otherBlocks = input.dayBlocks
    .filter((block) => block.id !== input.block.id)
    .map((block) => `${block.startTime}-${block.endTime} ${block.label}`)
    .join('; ');

  const phaseHint =
    input.phase === 'prep'
      ? 'El usuario pidió reorganizar en la preparación (−10 min).'
      : 'El usuario pidió reorganizar en la hora exacta de la tarea.';

  return JSON.stringify(
    {
      phaseHint,
      currentTimeIso: input.currentTimeIso,
      minShiftMinutes,
      taskDurationMinutes: durationMinutes,
      task: {
        label: input.block.label,
        categoryId: input.block.categoryId,
        startTime: input.block.startTime,
        endTime: input.block.endTime,
        day: input.day,
      },
      otherTasksToday: otherBlocks || 'ninguna',
      weekSummary: input.weekPlanSummary.days,
      outputSchema: {
        proposedStartTime: 'HH:mm',
        proposedEndTime: 'HH:mm optional',
        reason: 'string',
      },
    },
    null,
    2,
  );
}
