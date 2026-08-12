import { Controller, Get, Req, Res, UseGuards } from '@nestjs/common';
import { Session } from '@thallesp/nestjs-better-auth';
import type { UserSession } from '@thallesp/nestjs-better-auth';
import type { Request, Response } from 'express';
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
  callback(@Req() req: Request, @Res() res: Response) {
    const origins = (process.env.FRONTEND_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173')
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);
    const referer = req.headers.referer || req.headers.origin;
    const matched = referer ? origins.find((o) => referer.startsWith(o)) : null;
    const targetOrigin = matched || origins[0] || 'http://localhost:5173';
    return res.redirect(302, `${targetOrigin}/host/dashboard`);
  }
}
