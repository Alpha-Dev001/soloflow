import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../users/users.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscriptions/subscription.schema';
import { AiUsage, AiUsageSchema } from '../ai-usage/ai-usage.schema';

@Module({
  imports: [
    UsersModule,
    SubscriptionsModule,
    EntitlementsModule,
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: AiUsage.name, schema: AiUsageSchema },
    ]),
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
