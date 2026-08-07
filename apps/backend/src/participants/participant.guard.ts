import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ERROR_CODES } from '../contracts/errors.contract';
import type { ParticipantTokenPayload } from './participant.domain';
import { ParticipantTokenService } from './participant-token.service';

@Injectable()
export class ParticipantGuard implements CanActivate {
  constructor(
    @Inject(ParticipantTokenService)
    private readonly tokens: ParticipantTokenService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      headers: Record<string, string | string[] | undefined>;
      participant?: ParticipantTokenPayload;
    }>();
    const header = request.headers.authorization;
    const headerValue = Array.isArray(header) ? header[0] : header;
    const token = headerValue?.startsWith('Bearer ')
      ? headerValue.slice('Bearer '.length)
      : undefined;
    const payload = token ? this.tokens.verify(token) : null;
    if (!payload) {
      throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED });
    }
    request.participant = payload;
    return true;
  }
}
