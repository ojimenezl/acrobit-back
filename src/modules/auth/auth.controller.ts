import { Body, Controller, Post, UseGuards } from '@nestjs/common';

import { FirebaseUser } from '../../common/decorators/firebase-user.decorator';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import { toUserResponse } from '../users/user.mapper';
import { UsersService } from '../users/users.service';
import { SyncUserDto } from './dto/sync-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly usersService: UsersService) {}

  @Post('sync-user')
  @UseGuards(FirebaseAuthGuard)
  async syncUser(@FirebaseUser() firebaseUser: Express.FirebaseUser, @Body() body: SyncUserDto) {
    const user = await this.usersService.syncFromFirebase(firebaseUser, body);
    return {
      user: toUserResponse(user),
      isNewUser: user.isNew,
    };
  }
}
