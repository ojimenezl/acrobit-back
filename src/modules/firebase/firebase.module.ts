import { Global, Module } from '@nestjs/common';

import { FirebaseAuthService } from './firebase-auth.service';

@Global()
@Module({
  providers: [FirebaseAuthService],
  exports: [FirebaseAuthService],
})
export class FirebaseModule {}
