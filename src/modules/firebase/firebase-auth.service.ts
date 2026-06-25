import {
  Global,
  Injectable,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { cert, getApps, initializeApp, ServiceAccount } from 'firebase-admin/app';
import { DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { readFileSync } from 'node:fs';
import { isAbsolute, join } from 'node:path';

@Global()
@Injectable()
export class FirebaseAuthService implements OnModuleInit {
  private readonly logger = new Logger(FirebaseAuthService.name);
  private ready = false;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    if (getApps().length) {
      this.ready = true;
      return;
    }

    const serviceAccount = this.loadServiceAccount();
    if (!serviceAccount) {
      this.logger.warn(
        'Firebase Admin no configurado (FIREBASE_SERVICE_ACCOUNT_JSON o GOOGLE_APPLICATION_CREDENTIALS).',
      );
      return;
    }

    try {
      initializeApp({
        credential: cert(serviceAccount),
        projectId:
          this.config.get<string>('firebaseProjectId') ??
          serviceAccount.projectId,
      });

      this.ready = true;
      this.logger.log('Firebase Admin inicializado.');
    } catch (error) {
      this.logger.error(
        'No se pudo inicializar Firebase Admin.',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async verifyIdToken(idToken: string): Promise<DecodedIdToken> {
    if (!this.ready) {
      throw new Error('Firebase Admin no está configurado.');
    }

    return getAuth().verifyIdToken(idToken);
  }

  private loadServiceAccount(): ServiceAccount | null {
    const jsonEnv = this.config.get<string>('firebaseServiceAccountJson');
    if (jsonEnv?.trim()) {
      try {
        const parsed = JSON.parse(jsonEnv) as ServiceAccount & {
          private_key?: string;
        };
        if (parsed.private_key?.includes('\\n')) {
          parsed.private_key = parsed.private_key.replace(/\\n/g, '\n');
        }
        return parsed;
      } catch {
        this.logger.error('FIREBASE_SERVICE_ACCOUNT_JSON no es JSON válido.');
        return null;
      }
    }

    const credentialsPath = this.config.get<string>('firebaseCredentialsPath');
    if (!credentialsPath?.trim()) {
      return null;
    }

    const absolutePath = isAbsolute(credentialsPath)
      ? credentialsPath
      : join(process.cwd(), credentialsPath);

    try {
      return JSON.parse(readFileSync(absolutePath, 'utf8')) as ServiceAccount;
    } catch (error) {
      this.logger.error(
        `No se pudo leer Firebase credentials (${absolutePath}).`,
        error instanceof Error ? error.stack : undefined,
      );
      return null;
    }
  }
}
