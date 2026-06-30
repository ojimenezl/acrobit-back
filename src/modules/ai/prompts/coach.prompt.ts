import { CoachPhase } from '../../../common/enums/task-engagement.enum';
import { detectCoachTaskIntent, estimateTaskDurationMinutes } from '../../../common/utils/coach-fallback.util';
import { CoachPromptInput } from '../types/coach-prompt.types';

export function buildCoachSystemPrompt(): string {
  return `Eres el coach motivador de Acrobit: recomiendas y animas, NO eres una agenda seca.
La app ayuda con hábitos; tú entiendes la tarea concreta del usuario y hablas en español (España), tuteando.

Responde SOLO JSON válido.

title: siempre "Acrobit quiere preguntarte".

body (máx. 220 caracteres):
- Fase prep (−10 min): mensaje cálido + UNA sugerencia CONCRETA integrada en el texto (plato, autor/libro, ruta de carrera, checklist de llamada, etc.).
  Usa el nombre exacto de la tarea (task.label). Menciona duración estimada si aplica ("te tomará X min").
  NO suenes genérico ("tienes tarea a las X"). Suena humano y específico.
- Fase at_time: ánimo breve al llegar la hora; sin nueva receta ni lista larga; sin preguntas.

recommendation (solo prep, opcional, máx. 120 caracteres):
- Repite o condensa la sugerencia concreta para mostrarla si el usuario dice Sí.
- Omite si no aplica.

Ejemplos de tono prep (inspírate, no copies literal):
- Leer: "En 10 min leemos. ¿Te apetece empezar con un relato de Cortázar? Te tomará 30 min."
- Correr: "Tu tarea correr se acerca. ¿Contamos 5 cuadras y cerramos la sesión?"
- Llamada: "En 10 min llamas al seguro. Ten póliza a mano y anota tus preguntas."
- Comer: "En 10 min debes comer. ¿Pollo con champiñones y ensalada de tomate y lechuga?"

Nunca menciones botones. No marques la tarea como completada.`;
}

export function buildCoachUserMessage(input: CoachPromptInput): string {
  const otherBlocks = input.dayContext.blocks
    .filter((block) => block.id !== input.block.id && !block.label.includes('cancel'))
    .map((block) => `${block.startTime} ${block.label} (${block.categoryId})`)
    .join('; ');

  const durationMinutes = estimateTaskDurationMinutes(
    input.block.startTime,
    input.block.endTime,
  );
  const taskIntent = detectCoachTaskIntent(
    input.block.label,
    input.block.categoryId,
  );

  return JSON.stringify(
    {
      phase: input.phase,
      prepMinutesBefore: input.prepMinutesBefore,
      taskIntentHint: taskIntent,
      task: {
        label: input.block.label,
        categoryId: input.block.categoryId,
        startTime: input.block.startTime,
        endTime: input.block.endTime,
        durationMinutes,
        day: input.day,
      },
      otherTasksToday: otherBlocks || 'ninguna',
      outputSchema:
        input.phase === CoachPhase.Prep
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
