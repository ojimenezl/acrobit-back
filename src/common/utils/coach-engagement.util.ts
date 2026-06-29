import {
  CoachPhase,
  CoachUserResponse,
  TaskEngagementState,
} from '../enums/task-engagement.enum';

const TERMINAL_STATES = new Set<TaskEngagementState>([
  TaskEngagementState.Muted,
  TaskEngagementState.PrepNo,
  TaskEngagementState.AtTimeNo,
]);

export function nextEngagementState(
  current: TaskEngagementState,
  event:
    | { type: 'phase_sent'; phase: CoachPhase }
    | {
        type: 'user_response';
        phase: CoachPhase;
        response: CoachUserResponse;
      }
    | { type: 'reschedule_confirmed' }
    | { type: 'reschedule_cancelled' }
    | { type: 'phase_timeout'; phase: CoachPhase },
): TaskEngagementState {
  switch (event.type) {
    case 'phase_sent':
      return event.phase === CoachPhase.Prep
        ? TaskEngagementState.PrepSent
        : TaskEngagementState.AtTimeSent;

    case 'user_response': {
      const { phase, response } = event;
      if (response === CoachUserResponse.No) {
        return TaskEngagementState.Muted;
      }
      if (response === CoachUserResponse.Reorganize) {
        return phase === CoachPhase.Prep
          ? TaskEngagementState.PrepReorganizing
          : TaskEngagementState.AtTimeReorganizing;
      }
      return phase === CoachPhase.Prep
        ? TaskEngagementState.PrepYes
        : TaskEngagementState.AtTimeYes;
    }

    case 'reschedule_confirmed':
      return TaskEngagementState.Rescheduled;

    case 'reschedule_cancelled':
      return TaskEngagementState.Muted;

    case 'phase_timeout':
      if (
        event.phase === CoachPhase.Prep &&
        current === TaskEngagementState.PrepSent
      ) {
        return current;
      }
      return current;

    default:
      return current;
  }
}

export function isCoachMuted(state: TaskEngagementState): boolean {
  return TERMINAL_STATES.has(state) || state === TaskEngagementState.Muted;
}

export function coachEngagementKey(day: string, blockId: string): string {
  return `${day}:${blockId}`;
}
