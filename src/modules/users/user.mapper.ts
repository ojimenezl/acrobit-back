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
    chatHistory: json['chatHistory'],
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
    fcmToken: json['fcmToken'] ?? null,
    createdAt: json['createdAt'] ?? null,
    updatedAt: json['updatedAt'] ?? null,
  };
}

export type UserResponse = ReturnType<typeof toUserResponse>;
