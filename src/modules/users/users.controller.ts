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
  SetBlockOutcomeDto,
  UpdateFlowStateDto,
  UpdateSelectedActivitiesDto,
  UpdateWeekInputsDto,
} from './dto/user-flow.dto';
import {
  GenerateCoachDayDto,
  GenerateCoachPromptDto,
  GenerateCoachRecommendationDto,
  CoachRespondDto,
  PatchCoachEngagementDto,
  RescheduleCoachBlockDto,
} from './dto/coach.dto';
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

  @Patch('me/week-plan/days/:day/blocks/outcome')
  @UseGuards(FirebaseAuthGuard)
  async setBlockOutcome(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Param('day', new ParseEnumPipe(DayOfWeek)) day: DayOfWeek,
    @Body() dto: SetBlockOutcomeDto,
  ) {
    const weekPlan = await this.usersService.setBlockOutcome(
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

  @Post('me/coach/generate-prompt')
  @UseGuards(FirebaseAuthGuard)
  async generateCoachPrompt(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: GenerateCoachPromptDto,
  ) {
    return this.usersService.generateCoachPrompt(firebaseUser.uid, dto);
  }

  @Post('me/coach/generate-recommendation')
  @UseGuards(FirebaseAuthGuard)
  async generateCoachRecommendation(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: GenerateCoachRecommendationDto,
  ) {
    return this.usersService.generateCoachRecommendation(
      firebaseUser.uid,
      dto,
    );
  }

  @Post('me/coach/generate-day')
  @UseGuards(FirebaseAuthGuard)
  async generateCoachDay(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: GenerateCoachDayDto,
  ) {
    return this.usersService.generateCoachDay(firebaseUser.uid, dto);
  }

  @Post('me/coach/reschedule')
  @UseGuards(FirebaseAuthGuard)
  async rescheduleCoachBlock(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: RescheduleCoachBlockDto,
  ) {
    return this.usersService.rescheduleCoachBlock(firebaseUser.uid, dto);
  }

  @Get('me/coach/engagement')
  @UseGuards(FirebaseAuthGuard)
  async getCoachEngagements(@FirebaseUser() firebaseUser: Express.FirebaseUser) {
    return this.usersService.getCoachEngagements(firebaseUser.uid);
  }

  @Patch('me/coach/engagement')
  @UseGuards(FirebaseAuthGuard)
  async patchCoachEngagement(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: PatchCoachEngagementDto,
  ) {
    return this.usersService.patchCoachEngagement(firebaseUser.uid, dto);
  }

  @Post('me/coach/respond')
  @UseGuards(FirebaseAuthGuard)
  async respondToCoach(
    @FirebaseUser() firebaseUser: Express.FirebaseUser,
    @Body() dto: CoachRespondDto,
  ) {
    return this.usersService.respondToCoach(firebaseUser.uid, dto);
  }
}
