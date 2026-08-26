import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { InjectConnection } from '@nestjs/mongoose';
import { Connection } from 'mongoose';

import { runSeed } from './seed';

/**
 * Development-only demo reset.
 *
 * The Settings page exposes a "Reset to demo data" action that calls
 * POST /api/seed/reset. This endpoint re-runs the controlled development
 * seed (same logic as `npm run seed`) against the connected database.
 *
 * It is hard-disabled in production — the handler rejects with 403 when
 * NODE_ENV=production so it can never wipe real data.
 */
@Controller('seed')
export class SeedController {
  // Injected so we use the SAME connection MongooseModule opened
  // (@nestjs/mongoose uses createConnection, not the default).
  constructor(
    @InjectConnection() private readonly connection: Connection,
  ) {}

  @Post('reset')
  @HttpCode(HttpStatus.OK)
  async reset(): Promise<{ success: boolean; message: string }> {
    if ((process.env.NODE_ENV || 'development') === 'production') {
      throw new ForbiddenException(
        'Demo reset is only available outside production',
      );
    }

    const db = this.connection.db;
    if (!db) {
      throw new ServiceUnavailableException(
        'Database not connected — try again shortly',
      );
    }

    await runSeed(db);
    return { success: true, message: 'Workspace reset to demo data' };
  }
}
