import { DecodedIdToken } from 'firebase-admin/auth';

declare global {
  namespace Express {
    type FirebaseUser = DecodedIdToken;
  }
}

export {};
