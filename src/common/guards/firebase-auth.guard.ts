import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { DecodedIdToken } from 'firebase-admin/auth';

import { FirebaseAuthService } from '../../modules/firebase/firebase-auth.service';

export interface AuthenticatedRequest extends Request {
  firebaseUser?: DecodedIdToken;
}

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(private readonly firebaseAuth: FirebaseAuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractBearerToken(request);

    if (!token) {
      throw new UnauthorizedException('Falta el token de Firebase (Authorization: Bearer).');
    }

    try {
      request.firebaseUser = await this.firebaseAuth.verifyIdToken(token);
      return true;
    } catch {
      throw new UnauthorizedException('Token de Firebase inválido o expirado.');
    }
  }

  private extractBearerToken(request: Request): string | null {
    const header = request.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return null;
    }

    const token = header.slice('Bearer '.length).trim();
    return token.length ? token : null;
  }
}
