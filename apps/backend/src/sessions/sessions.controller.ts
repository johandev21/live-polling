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
import {
  createSessionRequestSchema,
  deleteSessionRequestSchema,
  invitationLinkResponseSchema,
  sessionIdSchema,
  sessionListResponseSchema,
  updateSessionRequestSchema,
} from '../contracts/session.contract';
import { SessionsService } from './sessions.service';

@Controller('sessions')
@AllowAnonymous()
@UseGuards(HostSessionGuard)
export class SessionsController {
  constructor(
    @Inject(SessionsService) private readonly sessions: SessionsService,
  ) {}

  @Post()
  create(
    @Session() session: UserSession,
    @Body(new ZodValidationPipe(createSessionRequestSchema))
    body: { name: string },
  ) {
    return this.sessions.create(session.user.id, body.name);
  }

  @Get()
  async list(@Session() session: UserSession) {
    return sessionListResponseSchema.parse({
      sessions: await this.sessions.list(session.user.id),
    });
  }

  @Get(':id')
  get(
    @Session() session: UserSession,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
  ) {
    return this.sessions.get(session.user.id, id);
  }

  @Patch(':id')
  updateName(
    @Session() session: UserSession,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
    @Body(new ZodValidationPipe(updateSessionRequestSchema))
    body: { name: string },
  ) {
    return this.sessions.updateName(session.user.id, id, body.name);
  }

  @Post(':id/start')
  @HttpCode(HttpStatus.OK)
  start(
    @Session() session: UserSession,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
  ) {
    return this.sessions.start(session.user.id, id);
  }

  @Post(':id/end')
  @HttpCode(HttpStatus.OK)
  end(
    @Session() session: UserSession,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
  ) {
    return this.sessions.end(session.user.id, id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(
    @Session() session: UserSession,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
    @Body(new ZodValidationPipe(deleteSessionRequestSchema))
    body: { confirm: boolean },
  ) {
    return this.sessions.delete(session.user.id, id, body.confirm);
  }

  @Get(':id/invitation')
  async invitation(
    @Session() session: UserSession,
    @Param('id', new ZodValidationPipe(sessionIdSchema)) id: string,
  ) {
    return invitationLinkResponseSchema.parse(
      await this.sessions.invitation(session.user.id, id),
    );
  }
}
