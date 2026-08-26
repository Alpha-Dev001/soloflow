import { Module } from '@nestjs/common';
import { SeedController } from './seed/seed.controller';

/**
 * Database utilities module.
 *
 * Currently hosts the development-only seed reset controller
 * (POST /api/seed/reset). The Mongoose connection itself is opened by
 * MongooseModule.forRootAsync in AppModule, so nothing else is needed here.
 */
@Module({
  controllers: [SeedController],
})
export class DatabaseModule {}
