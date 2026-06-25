export const MAX_TASKS_PER_DAY_INPUT = 3;

export function parseTasksFromInput(value: string | undefined): string[] {
  if (!value?.trim()) {
    return [];
  }

  return value
    .split(/[,·]/)
    .map((task) => task.trim())
    .filter(Boolean)
    .slice(0, MAX_TASKS_PER_DAY_INPUT);
}

export function hasRequiredWeekInputs(
  inputs: Record<string, string> | undefined,
): boolean {
  const data = inputs ?? {};
  return (
    parseTasksFromInput(data['today']).length > 0 &&
    parseTasksFromInput(data['tomorrow']).length > 0
  );
}
