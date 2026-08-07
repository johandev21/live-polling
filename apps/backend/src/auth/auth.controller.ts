import { Controller, Get, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import { z } from 'zod';

const hostResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  emailVerified: z.boolean(),
});
import { VerifiedHostGuard } from './auth.guards';

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(VerifiedHostGuard)
  me(@Session() session: UserSession) {
    return hostResponseSchema.parse({
      id: session.user.id,
      name: session.user.name,
      email: session.user.email,
      emailVerified: session.user.emailVerified,
    });
  }
}
