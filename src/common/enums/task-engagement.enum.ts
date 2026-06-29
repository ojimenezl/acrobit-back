/** Fase del ciclo coach (prep −10 min | at_time hora exacta). */
export enum CoachPhase {
  Prep = 'prep',
  AtTime = 'at_time',
}

export const COACH_PHASE_VALUES = Object.values(CoachPhase);

export enum CoachUserResponse {
  Yes = 'yes',
  No = 'no',
  Reorganize = 'reorganize',
}

export const COACH_USER_RESPONSE_VALUES = Object.values(CoachUserResponse);

/**
 * Estado de interacción coach por bloque.
 * Independiente de TaskOutcome.
 */
export enum TaskEngagementState {
  Scheduled = 'scheduled',
  PrepSent = 'prep_sent',
  PrepYes = 'prep_yes',
  PrepNo = 'prep_no',
  PrepReorganizing = 'prep_reorganizing',
  AtTimeSent = 'at_time_sent',
  AtTimeYes = 'at_time_yes',
  AtTimeNo = 'at_time_no',
  AtTimeReorganizing = 'at_time_reorganizing',
  Muted = 'muted',
  Rescheduled = 'rescheduled',
  SkippedCoach = 'skipped_coach',
}

export const TASK_ENGAGEMENT_STATE_VALUES = Object.values(TaskEngagementState);
