import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Response } from 'express';
import { z } from 'zod';

import { VerifiedHostGuard } from './auth.guards';

const hostResponseSchema = z.object({
  email: z.string().email(),
  emailVerified: z.boolean(),
  id: z.string(),
  name: z.string(),
});

@Controller('auth')
export class AuthController {
  @Get('me')
  @UseGuards(VerifiedHostGuard)
  me(@Session() session: UserSession) {
    return hostResponseSchema.parse({
      email: session.user.email,
      emailVerified: session.user.emailVerified,
      id: session.user.id,
      name: session.user.name,
    });
  }

  @Get('callback')
  callback(@Res() res: Response) {
    const frontendOrigin = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173')
      .split(',')[0]
      ?.trim() || 'http://localhost:5173';
    return res.redirect(302, `${frontendOrigin}/host/dashboard`);
  }
}
