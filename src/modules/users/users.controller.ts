import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import { FirebaseUser } from '../../common/decorators/firebase-user.decorator';
import { DayOfWeek } from '../../common/enums/day-of-week.enum';
import { FirebaseAuthGuard } from '../../common/guards/firebase-auth.guard';
import {
  AppendChatMessageDto,
  PatchDayBlockDto,
  ReplaceDayBlocksDto,
  ReorderDayBlocksDto,
  UpdateFlowStateDto,
  UpdateSelectedActivitiesDto,
  UpdateWeekInputsDto,
} from './dto/user-flow.dto';
import { toUserResponse } from './user.mapper';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @UseGuards(FirebaseAuthGuard)
  async getMe(@FirebaseUser() firebaseUser: Express.FirebaseUser) {
    const user = await this.usersService.requireUser(firebaseUser.uid);
    return { user: toUserResponse(user) };
  }

  @Put('me/flow-state')
  @UseGuards(FirebaseAuthGuard)
  async updateFlowState(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: UpdateFlowStateDto,
  ) {
    const user = await this.usersService.updateFlowState(firebaseUser.uid, dto);
    return { user: toUserResponse(user) };
  }

  @Put('me/week-inputs')
  @UseGuards(FirebaseAuthGuard)
  async updateWeekInputs(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: UpdateWeekInputsDto,
  ) {
    const user = await this.usersService.updateWeekInputs(firebaseUser.uid, dto);
    return { user: toUserResponse(user) };
  }

  @Put('me/selected-activities')
  @UseGuards(FirebaseAuthGuard)
  async updateSelectedActivities(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: UpdateSelectedActivitiesDto,
  ) {
    const user = await this.usersService.updateSelectedActivities(
      firebaseUser.uid,
      dto,
    );
    return { user: toUserResponse(user) };
  }

  @Post('me/organize')
  @UseGuards(FirebaseAuthGuard)
  async organizeWeek(@FirebaseUser() firebaseUser: Express.FirebaseUser) {
    const result = await this.usersService.organizeWeek(firebaseUser.uid);
    return {
      user: toUserResponse(result.user),
      usedAi: result.usedAi,
      aiSummary: result.aiSummary ?? null,
      skipped: result.skipped,
    };
  }

  @Get('me/week-plan')
  @UseGuards(FirebaseAuthGuard)
  async getWeekPlan(@FirebaseUser() firebaseUser: Express.FirebaseUser) {
    const weekPlan = await this.usersService.getWeekPlan(firebaseUser.uid);
    return { weekPlan };
  }

  @Patch('me/week-plan/days/:day/reorder')
  @UseGuards(FirebaseAuthGuard)
  async reorderDayBlocks(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Param('day', new ParseEnumPipe(DayOfWeek)) day: DayOfWeek,
    @Body() dto: ReorderDayBlocksDto,
  ) {
    const weekPlan = await this.usersService.reorderDayBlocks(
      firebaseUser.uid,
      day,
      dto,
    );
    return { weekPlan };
  }

  @Patch('me/week-plan/days/:day/blocks')
  @UseGuards(FirebaseAuthGuard)
  async patchDayBlock(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Param('day', new ParseEnumPipe(DayOfWeek)) day: DayOfWeek,
    @Body() dto: PatchDayBlockDto,
  ) {
    const weekPlan = await this.usersService.patchDayBlock(
      firebaseUser.uid,
      day,
      dto,
    );
    return { weekPlan };
  }

  @Put('me/week-plan/days/:day/blocks')
  @UseGuards(FirebaseAuthGuard)
  async replaceDayBlocks(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Param('day', new ParseEnumPipe(DayOfWeek)) day: DayOfWeek,
    @Body() dto: ReplaceDayBlocksDto,
  ) {
    const weekPlan = await this.usersService.replaceDayBlocks(
      firebaseUser.uid,
      day,
      dto,
    );
    return { weekPlan };
  }

  @Get('me/chat')
  @UseGuards(FirebaseAuthGuard)
  async getChat(@FirebaseUser() firebaseUser: Express.FirebaseUser) {
    const messages = await this.usersService.getChatHistory(firebaseUser.uid);
    return { messages };
  }

  @Post('me/chat/messages')
  @UseGuards(FirebaseAuthGuard)
  async appendChatMessage(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: AppendChatMessageDto,
  ) {
    const user = await this.usersService.appendChatMessage(
      firebaseUser.uid,
      dto,
    );
    return {
      messages: user.chatHistory,
      user: toUserResponse(user),
    };
  }
}
