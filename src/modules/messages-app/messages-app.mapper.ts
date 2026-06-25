import { MessagesAppDocument } from './schemas/messages-app.schema';

export function toDailyMessageResponse(message: MessagesAppDocument) {
  const json = message.toObject({ versionKey: false }) as Record<
    string,
    unknown
  >;

  return {
    dayOfYear: json['dayOfYear'],
    title: json['title'],
    message: json['message'],
  };
}
