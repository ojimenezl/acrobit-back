import { CoachPhase } from '../enums/task-engagement.enum';
import {
  buildMotivationalFallback,
  detectCoachTaskIntent,
} from './coach-fallback.util';

describe('coach-fallback.util', () => {
  it('detects reading from label', () => {
    expect(detectCoachTaskIntent('Leer un rato')).toBe('reading');
  });

  it('detects running from label', () => {
    expect(detectCoachTaskIntent('Correr')).toBe('running');
  });

  it('detects calling from label', () => {
    expect(detectCoachTaskIntent('Llamar al seguro')).toBe('calling');
  });

  it('prep reading includes author suggestion', () => {
    const result = buildMotivationalFallback({
      label: 'Leer',
      phase: CoachPhase.Prep,
      minutesBefore: 10,
      startTime: '19:00',
      endTime: '19:30',
      categoryId: 'practica',
    });

    expect(result.body).toContain('10 min');
    expect(result.body.toLowerCase()).toContain('leemos');
    expect(result.recommendation).toBeTruthy();
  });

  it('prep running suggests concrete action', () => {
    const result = buildMotivationalFallback({
      label: 'Correr',
      phase: CoachPhase.Prep,
      minutesBefore: 10,
      startTime: '07:00',
      endTime: '07:30',
    });

    expect(result.body).toContain('Correr');
    expect(result.body.toLowerCase()).toMatch(/cuadras|trote|ritmo|series|caminando/);
  });

  it('prep cooking suggests a dish', () => {
    const result = buildMotivationalFallback({
      label: 'Comer',
      phase: CoachPhase.Prep,
      minutesBefore: 10,
      startTime: '13:00',
      endTime: '13:30',
    });

    expect(result.body.toLowerCase()).toMatch(/pollo|pasta|tortilla|comer/);
  });

  it('at_time is brief encouragement without new recipe', () => {
    const result = buildMotivationalFallback({
      label: 'Comer',
      phase: CoachPhase.AtTime,
      minutesBefore: 10,
      startTime: '13:00',
    });

    expect(result.body.toLowerCase()).toContain('hora');
    expect(result.body.toLowerCase()).not.toContain('champi');
    expect(result.recommendation).toBeUndefined();
  });
});
