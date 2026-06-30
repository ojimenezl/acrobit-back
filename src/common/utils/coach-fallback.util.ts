import { CoachPhase } from '../enums/task-engagement.enum';

export type CoachTaskIntent =
  | 'reading'
  | 'running'
  | 'calling'
  | 'cooking'
  | 'shopping'
  | 'swimming'
  | 'wellness'
  | 'generic';

export interface MotivationalFallbackInput {
  label: string;
  phase: CoachPhase;
  minutesBefore: number;
  startTime: string;
  endTime?: string;
  categoryId?: string;
}

export interface MotivationalFallbackResult {
  body: string;
  recommendation?: string;
}

const READING_ITEMS = [
  'un relato corto de Julio Cortázar',
  '«El aleph» de Borges',
  'un capítulo de «Cien años de soledad»',
];

const COOKING_ITEMS = [
  'pollo con champiñones y ensalada de tomate y lechuga',
  'pasta al pesto con cherrys',
  'tortilla francesa con ensalada verde',
];

const RUNNING_ITEMS = [
  'contar 5 cuadras a buen ritmo',
  '20 min de trote suave y estirar al final',
  '3 series de 2 minutos caminando rápido',
];

export function detectCoachTaskIntent(
  label: string,
  categoryId?: string,
): CoachTaskIntent {
  const text = label.toLowerCase();

  if (/leer|lectura|libro|relato|novela/.test(text)) {
    return 'reading';
  }
  if (/correr|carrera|trotar|gym|gimnasio|ejercicio|deporte|entren/.test(text)) {
    return 'running';
  }
  if (/llamar|llama|tel[eé]fono|seguro|banco|gestor|doctor|m[eé]dico/.test(text)) {
    return 'calling';
  }
  if (/comer|comida|cocinar|almuerzo|cena|desayuno|merienda/.test(text)) {
    return 'cooking';
  }
  if (/compra|supermercado|mercad/.test(text)) {
    return 'shopping';
  }
  if (/piscina|nadar|nataci[oó]n|baño/.test(text)) {
    return 'swimming';
  }
  if (/meditar|respir|yoga|bienestar|descanso/.test(text)) {
    return 'wellness';
  }

  if (categoryId === 'practica') {
    return 'reading';
  }
  if (categoryId === 'rutinas') {
    return 'cooking';
  }
  if (categoryId === 'bienestar') {
    return 'wellness';
  }

  return 'generic';
}

export function estimateTaskDurationMinutes(
  startTime: string,
  endTime?: string,
): number {
  if (!endTime) {
    return 30;
  }

  const start = parseTimeToMinutes(startTime);
  const end = parseTimeToMinutes(endTime);
  const diff = end - start;

  return diff > 0 ? diff : 30;
}

export function buildMotivationalFallback(
  input: MotivationalFallbackInput,
): MotivationalFallbackResult {
  const intent = detectCoachTaskIntent(input.label, input.categoryId);
  const duration = estimateTaskDurationMinutes(input.startTime, input.endTime);
  const minutes = input.minutesBefore;
  const label = input.label.trim() || 'tu tarea';

  if (input.phase === CoachPhase.AtTime) {
    return { body: buildAtTimeBody(intent, label) };
  }

  return buildPrepBody(intent, label, minutes, duration);
}

function buildPrepBody(
  intent: CoachTaskIntent,
  label: string,
  minutes: number,
  duration: number,
): MotivationalFallbackResult {
  switch (intent) {
    case 'reading': {
      const item = pickRandom(READING_ITEMS);
      return {
        body: `En ${minutes} min leemos. ¿Te apetece empezar con ${item}? Te tomará unos ${duration} min.`,
        recommendation: `Empieza con ${item}.`,
      };
    }
    case 'running': {
      const item = pickRandom(RUNNING_ITEMS);
      return {
        body: `Tu tarea «${label}» se acerca. ¿Qué te parece si ${item} y cerramos la sesión?`,
        recommendation: `Hoy toca ${item}.`,
      };
    }
    case 'calling':
      return {
        body: `En ${minutes} min: ${label}. Ten a mano lo que necesites y anota las preguntas para no olvidar nada.`,
        recommendation: 'Revisa datos y preguntas antes de marcar.',
      };
    case 'cooking': {
      const item = pickRandom(COOKING_ITEMS);
      return {
        body: `En ${minutes} min debes comer. ¿Te parece ${item}?`,
        recommendation: item,
      };
    }
    case 'shopping':
      return {
        body: `En ${minutes} min toca ${label}. Haz una lista rápida de lo esencial y evita distracciones.`,
        recommendation: 'Lleva lista y un tope de gasto.',
      };
    case 'swimming':
      return {
        body: `En ${minutes} min vas a ${label}. Prepara bañador, toalla y agua — ${duration} min te van a sentar bien.`,
        recommendation: 'Calienta hombros 2 min antes de entrar.',
      };
    case 'wellness':
      return {
        body: `En ${minutes} min: ${label}. Regálate ${duration} min sin prisas; empieza con 3 respiraciones profundas.`,
        recommendation: '3 min de respiración 4-7-8.',
      };
    default:
      return {
        body: `En ${minutes} min toca «${label}». ¿Le damos con calma y lo sacamos adelante?`,
      };
  }
}

function buildAtTimeBody(intent: CoachTaskIntent, label: string): string {
  switch (intent) {
    case 'reading':
      return `¡Hora de leer! Sumérgete en «${label}» — unas páginas y listo.`;
    case 'running':
      return `¡Es hora de ${label}! Calienta 1 minuto y arranca — tú puedes.`;
    case 'calling':
      return `¡Hora de ${label}! Respira hondo y marca con confianza.`;
    case 'cooking':
      return `¡Hora de comer! Disfruta «${label}» sin prisas.`;
    case 'shopping':
      return `¡Vamos a ${label}! Lista en mano y al grano.`;
    case 'swimming':
      return `¡Hora de ${label}! Al agua — disfruta el movimiento.`;
    case 'wellness':
      return `Momento de ${label}. Cierra ojos, respira y suelta el día.`;
    default:
      return `¡Hora de ${label}! Un paso y lo tienes.`;
  }
}

function parseTimeToMinutes(time: string): number {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + (minutes ?? 0);
}

function pickRandom(items: string[]): string {
  return items[Math.floor(Math.random() * items.length)];
}
