import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class VerifiedHostGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context
      .switchToHttp()
      .getRequest<{ user?: { emailVerified?: boolean } }>();
    if (!request.user?.emailVerified) {
      throw new UnauthorizedException({ code: 'HOST_EMAIL_NOT_VERIFIED' });
    }
    return true;
  }
}
