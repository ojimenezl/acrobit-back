import { UserDocument } from '../users/schemas/user.schema';

export function toUserResponse(user: UserDocument) {
  const json = user.toObject({ versionKey: false }) as Record<string, unknown>;

  return {
    id: String(json['_id']),
    firebaseUid: json['firebaseUid'],
    email: json['email'],
    displayName: json['displayName'],
    photoUrl: json['photoUrl'] ?? null,
    provider: json['provider'],
    suscrito: json['suscrito'],
    flow: json['flow'],
    selectedActivities: json['selectedActivities'],
    weekInputs: json['weekInputs'],
    weekPlan: json['weekPlan'],
    chatHistory:
      (json['chatHistory'] as unknown[] | undefined)?.map((item) => {
        const message = item as Record<string, unknown>;
        return {
          ...message,
          timestamp: message['timestamp']
            ? new Date(String(message['timestamp'])).toISOString()
            : new Date().toISOString(),
        };
      }) ?? [],
    notifications: json['notifications'],
    achievements: json['achievements'],
    stats: json['stats'],
    coachEngagements: (json['coachEngagements'] as unknown[] | undefined)?.map(
      (item) => {
        const engagement = item as Record<string, unknown>;
        return {
          ...engagement,
          updatedAt: engagement['updatedAt']
            ? new Date(String(engagement['updatedAt'])).toISOString()
            : new Date().toISOString(),
        };
      },
    ) ?? [],
    coachPrompts: (json['coachPrompts'] as unknown[] | undefined)?.map((item) => {
      const prompt = item as Record<string, unknown>;
      return {
        ...prompt,
        generatedAt: prompt['generatedAt']
          ? new Date(String(prompt['generatedAt'])).toISOString()
          : new Date().toISOString(),
      };
    }) ?? [],
    coachChatLocked: Boolean(json['coachChatLocked']),
    coachChatLockedAt: json['coachChatLockedAt']
      ? new Date(String(json['coachChatLockedAt'])).toISOString()
      : null,
    fcmToken: json['fcmToken'] ?? null,
    createdAt: json['createdAt'] ?? null,
    updatedAt: json['updatedAt'] ?? null,
  };
}

export type UserResponse = ReturnType<typeof toUserResponse>;
