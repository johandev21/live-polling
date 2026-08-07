import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Inject,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { AllowAnonymous, Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { HostSessionGuard } from '../auth/auth.guards';
import { ZodValidationPipe } from '../contracts/zod-validation.pipe';
import { uuidSchema } from '../contracts/session.contract';
import {
  createPollRequestSchema,
  pollListResponseSchema,
  reorderPollsRequestSchema,
  updatePollRequestSchema,
} from '../contracts/poll.contract';
import { PollsService } from './polls.service';

@Controller('sessions/:sessionId/polls')
@AllowAnonymous()
@UseGuards(HostSessionGuard)
export class PollsController {
  constructor(@Inject(PollsService) private readonly polls: PollsService) {}

  @Post()
  create(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Body(new ZodValidationPipe(createPollRequestSchema))
    body: {
      type: 'single_choice' | 'multiple_choice' | 'open_ended';
      text: string;
      options?: string[];
      maxSelections?: number | null;
    },
  ) {
    return this.polls.create(session.user.id, sessionId, body);
  }

  @Get()
  async list(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
  ) {
    return pollListResponseSchema.parse({
      polls: await this.polls.list(session.user.id, sessionId),
    });
  }

  @Post('reorder')
  @HttpCode(HttpStatus.OK)
  async reorder(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Body(new ZodValidationPipe(reorderPollsRequestSchema))
    body: { pollIds: string[] },
  ) {
    return pollListResponseSchema.parse({
      polls: await this.polls.reorder(session.user.id, sessionId, body.pollIds),
    });
  }

  @Get(':pollId')
  get(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
  ) {
    return this.polls.get(session.user.id, sessionId, pollId);
  }

  @Patch(':pollId')
  update(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
    @Body(new ZodValidationPipe(updatePollRequestSchema))
    body: { text: string; options?: string[]; maxSelections?: number | null },
  ) {
    return this.polls.update(session.user.id, sessionId, pollId, body);
  }

  @Delete(':pollId')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
  ) {
    return this.polls.remove(session.user.id, sessionId, pollId);
  }

  @Post(':pollId/open')
  @HttpCode(HttpStatus.OK)
  open(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
  ) {
    return this.polls.open(session.user.id, sessionId, pollId);
  }

  @Post(':pollId/close')
  @HttpCode(HttpStatus.OK)
  close(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
  ) {
    return this.polls.close(session.user.id, sessionId, pollId);
  }

  @Post(':pollId/reveal')
  @HttpCode(HttpStatus.OK)
  reveal(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
  ) {
    return this.polls.reveal(session.user.id, sessionId, pollId);
  }

  @Post(':pollId/hide')
  @HttpCode(HttpStatus.OK)
  hide(
    @Session() session: UserSession,
    @Param('sessionId', new ZodValidationPipe(uuidSchema))
    sessionId: string,
    @Param('pollId', new ZodValidationPipe(uuidSchema))
    pollId: string,
  ) {
    return this.polls.hide(session.user.id, sessionId, pollId);
  }
}
