import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * Apply to any controller or route that requires a valid JWT.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   getProfile() { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
