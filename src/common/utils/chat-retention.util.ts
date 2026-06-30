import { CHAT_RETENTION_DAYS } from '../constants/chat.constants';

export interface ChatMessageWithTimestamp {
  timestamp: Date | string;
}

export function pruneChatHistory<T extends ChatMessageWithTimestamp>(
  messages: T[],
  now: Date = new Date(),
  retentionDays = CHAT_RETENTION_DAYS,
): T[] {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - retentionDays);
  const cutoffMs = cutoff.getTime();

  return messages.filter((message) => {
    const ts =
      message.timestamp instanceof Date
        ? message.timestamp.getTime()
        : new Date(String(message.timestamp)).getTime();

    return !Number.isNaN(ts) && ts >= cutoffMs;
  });
}
