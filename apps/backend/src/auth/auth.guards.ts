import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ERROR_CODES } from '../contracts/errors.contract';

function assertVerifiedHost(
  user: { emailVerified?: boolean } | null | undefined,
): void {
  if (!user) {
    throw new UnauthorizedException({ code: ERROR_CODES.UNAUTHORIZED });
  }
  if (!user.emailVerified) {
    throw new UnauthorizedException({
      code: ERROR_CODES.HOST_EMAIL_NOT_VERIFIED,
    });
  }
}

@Injectable()
export class VerifiedHostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { emailVerified?: boolean } | null }>();
    assertVerifiedHost(request.user);
    return true;
  }
}

@Injectable()
export class HostSessionGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{
      session?: {
        user?: { emailVerified?: boolean } | null;
      } | null;
    }>();
    assertVerifiedHost(request.session?.user);
    return true;
  }
}
