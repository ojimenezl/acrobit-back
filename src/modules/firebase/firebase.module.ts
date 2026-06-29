import { Global, Module } from '@nestjs/common';

import { FirebaseAuthService } from './firebase-auth.service';
import { FirebaseMessagingService } from './firebase-messaging.service';

@Global()
@Module({
  providers: [FirebaseAuthService, FirebaseMessagingService],
  exports: [FirebaseAuthService, FirebaseMessagingService],
})
export class FirebaseModule {}
