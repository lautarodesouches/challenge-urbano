import { Injectable, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class LoginThrottlerGuard extends ThrottlerGuard {
  protected async throwThrottlingException(context: ExecutionContext): Promise<void> {
    throw new HttpException(
      'Demasiados intentos de inicio de sesión. Por favor, espere 15 minutos antes de intentar nuevamente.',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}
