import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DecodedIdToken } from 'firebase-admin/auth';

import { AuthenticatedRequest } from '../guards/firebase-auth.guard';

export const FirebaseUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DecodedIdToken => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.firebaseUser as DecodedIdToken;
  },
);
