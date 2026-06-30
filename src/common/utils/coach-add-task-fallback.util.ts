import { DayOfWeek } from '../enums/day-of-week.enum';
import {
  CoachTaskIntent,
  detectCoachTaskIntent,
} from './coach-fallback.util';

export interface AddTaskFallbackInput {
  text: string;
  today: DayOfWeek;
  currentTimeIso: string;
}

export interface AddTaskFallbackResult {
  label: string;
  day: DayOfWeek;
  startTime: string | null;
  durationMinutes: number;
  categoryId: string;
}

const DAY_ORDER: DayOfWeek[] = [
  DayOfWeek.DOMINGO,
  DayOfWeek.LUNES,
  DayOfWeek.MARTES,
  DayOfWeek.MIERCOLES,
  DayOfWeek.JUEVES,
  DayOfWeek.VIERNES,
  DayOfWeek.SABADO,
];

const DAY_ALIASES: Record<string, DayOfWeek> = {
  domingo: DayOfWeek.DOMINGO,
  lunes: DayOfWeek.LUNES,
  martes: DayOfWeek.MARTES,
  miercoles: DayOfWeek.MIERCOLES,
  miércoles: DayOfWeek.MIERCOLES,
  jueves: DayOfWeek.JUEVES,
  viernes: DayOfWeek.VIERNES,
  sabado: DayOfWeek.SABADO,
  sábado: DayOfWeek.SABADO,
};

const DEFAULT_DURATION = 30;

export function parseAddTaskFallback(
  input: AddTaskFallbackInput,
): AddTaskFallbackResult {
  const raw = input.text.trim();
  const normalized = raw.toLowerCase();

  const day = resolveDay(normalized, input.today);
  const startTime = extractStartTime(normalized, input.currentTimeIso);
  const label = extractLabel(raw, normalized);
  const intent = detectCoachTaskIntent(label);

  return {
    label: label || 'Nueva tarea',
    day,
    startTime,
    durationMinutes: defaultDurationForIntent(intent),
    categoryId: inferCategoryId(intent),
  };
}

export function inferCategoryId(intent: CoachTaskIntent): string {
  switch (intent) {
    case 'reading':
      return 'practica';
    case 'running':
    case 'wellness':
    case 'swimming':
      return 'bienestar';
    case 'cooking':
      return 'rutinas';
    default:
      return 'usuario';
  }
}

function resolveDay(text: string, today: DayOfWeek): DayOfWeek {
  if (/\bhoy\b/.test(text)) {
    return today;
  }

  if (/\bmañana\b|\bmanana\b/.test(text)) {
    return nextDay(today);
  }

  for (const [alias, day] of Object.entries(DAY_ALIASES)) {
    if (new RegExp(`\\b${alias}\\b`, 'i').test(text)) {
      return day;
    }
  }

  return today;
}

function nextDay(today: DayOfWeek): DayOfWeek {
  const index = DAY_ORDER.indexOf(today);
  return DAY_ORDER[(index + 1) % DAY_ORDER.length];
}

function extractStartTime(
  text: string,
  currentTimeIso: string,
): string | null {
  const hhmm = text.match(
    /(?:a las|las|)\s*(\d{1,2})[:h](\d{2})\b/i,
  );
  if (hhmm) {
    return formatTime(Number(hhmm[1]), Number(hhmm[2]));
  }

  const hourOnly = text.match(/(?:a las|las|)\s*(\d{1,2})\s*(?:h|horas?)\b/i);
  if (hourOnly) {
    return formatTime(Number(hourOnly[1]), 0);
  }

  if (/\b(esta tarde|por la tarde)\b/i.test(text)) {
    return '17:00';
  }

  if (/\b(esta mañana|por la mañana|por la manana)\b/i.test(text)) {
    return '09:00';
  }

  if (/\b(esta noche|por la noche)\b/i.test(text)) {
    return '20:00';
  }

  const now = new Date(currentTimeIso);
  if (!Number.isNaN(now.getTime())) {
    const minutes = now.getHours() * 60 + now.getMinutes() + 30;
    const rounded = Math.ceil(minutes / 15) * 15;
    return formatTime(Math.floor(rounded / 60) % 24, rounded % 60);
  }

  return null;
}

function extractLabel(raw: string, normalized: string): string {
  let label = raw;

  label = label.replace(
    /\b(tarea|añadir|agregar|pon|programar|recordar)\b/gi,
    ' ',
  );
  label = label.replace(
    /\b(hoy|mañana|manana|domingo|lunes|martes|miercoles|miércoles|jueves|viernes|sabado|sábado)\b/gi,
    ' ',
  );
  label = label.replace(
    /\b(a las|las|)\s*\d{1,2}[:h]\d{2}\b/gi,
    ' ',
  );
  label = label.replace(
    /\b(a las|las|)\s*\d{1,2}\s*(?:h|horas?)\b/gi,
    ' ',
  );
  label = label.replace(
    /\b(esta tarde|por la tarde|esta mañana|por la mañana|por la manana|esta noche|por la noche)\b/gi,
    ' ',
  );
  label = label.replace(/[,;]+/g, ' ');
  label = label.replace(/\s+/g, ' ').trim();

  if (!label && normalized) {
    return raw.trim();
  }

  return label;
}

function defaultDurationForIntent(intent: CoachTaskIntent): number {
  switch (intent) {
    case 'reading':
    case 'wellness':
      return 30;
    case 'running':
    case 'swimming':
      return 45;
    case 'calling':
    case 'shopping':
      return 30;
    case 'cooking':
      return 45;
    default:
      return DEFAULT_DURATION;
  }
}

function formatTime(hours: number, minutes: number): string {
  const normalizedHours = ((hours % 24) + 24) % 24;
  const normalizedMinutes = ((minutes % 60) + 60) % 60;
  return `${String(normalizedHours).padStart(2, '0')}:${String(normalizedMinutes).padStart(2, '0')}`;
}
