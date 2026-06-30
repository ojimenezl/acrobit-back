import { pruneChatHistory } from './chat-retention.util';

describe('pruneChatHistory', () => {
  const now = new Date('2026-06-30T12:00:00.000Z');

  it('keeps messages within retention window', () => {
    const messages = [
      { id: '1', timestamp: new Date('2026-06-29T10:00:00.000Z') },
      { id: '2', timestamp: '2026-06-28T08:00:00.000Z' },
    ];

    expect(pruneChatHistory(messages, now, 5).map((m) => m.id)).toEqual(['1', '2']);
  });

  it('removes messages older than retention days', () => {
    const messages = [
      { id: 'old', timestamp: new Date('2026-06-20T10:00:00.000Z') },
      { id: 'recent', timestamp: new Date('2026-06-29T10:00:00.000Z') },
    ];

    expect(pruneChatHistory(messages, now, 5).map((m) => m.id)).toEqual(['recent']);
  });

  it('drops messages with invalid timestamps', () => {
    const messages = [
      { id: 'bad', timestamp: 'not-a-date' },
      { id: 'ok', timestamp: new Date('2026-06-29T10:00:00.000Z') },
    ];

    expect(pruneChatHistory(messages, now, 5).map((m) => m.id)).toEqual(['ok']);
  });
});
