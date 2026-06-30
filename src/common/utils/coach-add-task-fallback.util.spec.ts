import { DayOfWeek } from '../enums/day-of-week.enum';
import { parseAddTaskFallback } from './coach-add-task-fallback.util';

describe('coach-add-task-fallback.util', () => {
  it('extracts time and label from natural text', () => {
    const result = parseAddTaskFallback({
      text: 'tarea a las 12:35 hoy, ir a la compra',
      today: DayOfWeek.LUNES,
      currentTimeIso: '2026-06-30T10:00:00.000Z',
    });

    expect(result.label.toLowerCase()).toContain('compra');
    expect(result.startTime).toBe('12:35');
    expect(result.day).toBe(DayOfWeek.LUNES);
  });

  it('resolves weekday from text', () => {
    const result = parseAddTaskFallback({
      text: 'piscina martes 15:00',
      today: DayOfWeek.DOMINGO,
      currentTimeIso: '2026-06-30T10:00:00.000Z',
    });

    expect(result.day).toBe(DayOfWeek.MARTES);
    expect(result.startTime).toBe('15:00');
    expect(result.label.toLowerCase()).toContain('piscina');
    expect(result.categoryId).toBe('bienestar');
  });

  it('uses slot suggestion when no time is given', () => {
    const result = parseAddTaskFallback({
      text: 'ver precio de pantalones',
      today: DayOfWeek.MIERCOLES,
      currentTimeIso: '2026-06-30T10:00:00.000Z',
    });

    expect(result.label.toLowerCase()).toContain('pantalones');
    expect(result.startTime).toBeTruthy();
  });

  it('maps mañana to next day', () => {
    const result = parseAddTaskFallback({
      text: 'correr mañana a las 7:00',
      today: DayOfWeek.VIERNES,
      currentTimeIso: '2026-06-30T10:00:00.000Z',
    });

    expect(result.day).toBe(DayOfWeek.SABADO);
    expect(result.startTime).toBe('07:00');
  });
});
