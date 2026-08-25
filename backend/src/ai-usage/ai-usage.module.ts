import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AiUsage, AiUsageSchema } from './ai-usage.schema';
import { AiUsageService } from './ai-usage.service';
import { AiUsageController } from './ai-usage.controller';
import { EntitlementsModule } from '../entitlements/entitlements.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiUsage.name, schema: AiUsageSchema },
    ]),
    EntitlementsModule,
  ],
  controllers: [AiUsageController],
  providers: [AiUsageService],
  exports: [AiUsageService, MongooseModule],
})
export class AiUsageModule {}
