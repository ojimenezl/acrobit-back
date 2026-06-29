import { CoachPhase } from '../../../common/enums/task-engagement.enum';
import { CoachPromptInput } from '../types/coach-prompt.types';

export function buildCoachSystemPrompt(): string {
  return `Eres el coach de Acrobit, una app de hábitos y rutinas en español (España).
Generas mensajes cortos, cálidos y concretos para notificaciones y chat.

Reglas:
- Responde SOLO JSON válido con las claves indicadas.
- title: usa exactamente "Acrobit quiere preguntarte" salvo que se indique otra cosa.
- body: máximo 220 caracteres. Tutea al usuario. Menciona la actividad por nombre.
- Fase prep (−10 min): pregunta si preparar o si quiere una recomendación breve.
- Fase at_time: mensaje breve de ánimo; NO preguntes largo ni des recomendación.
- recommendation: SOLO en fase prep y SOLO si la actividad lo amerita (comida, lectura, ejercicio, bienestar, metas).
  Una línea concreta: plato, autor/libro, canción, rutina, etc. Máximo 120 caracteres.
  Si no aplica, omite la clave recommendation.
- Nunca menciones botones; el usuario verá Sí / No / Reorganizar aparte.
- No marques la tarea como completada ni hables de "logro".`;
}

export function buildCoachUserMessage(input: CoachPromptInput): string {
  const otherBlocks = input.dayContext.blocks
    .filter((block) => block.id !== input.block.id && !block.label.includes('cancel'))
    .map((block) => `${block.startTime} ${block.label} (${block.categoryId})`)
    .join('; ');

  return JSON.stringify(
    {
      phase: input.phase,
      prepMinutesBefore: input.prepMinutesBefore,
      task: {
        label: input.block.label,
        categoryId: input.block.categoryId,
        startTime: input.block.startTime,
        endTime: input.block.endTime,
        day: input.day,
      },
      otherTasksToday: otherBlocks || 'ninguna',
      outputSchema:
        input.phase === 'prep'
          ? {
              title: 'string',
              body: 'string',
              recommendation: 'string optional',
            }
          : { title: 'string', body: 'string' },
    },
    null,
    2,
  );
}

export function coachPromptId(
  day: string,
  blockId: string,
  phase: CoachPhase,
): string {
  return `coach-${day}-${blockId}-${phase}`;
}
