import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  Subscription,
  SubscriptionSchema,
} from './subscription.schema';
import { SubscriptionsService } from './subscriptions.service';
import { SubscriptionsController } from './subscriptions.controller';
import { UsersModule } from '../users/users.module';
import { PaymentsModule } from '../payments/payments.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { Client, ClientSchema } from '../clients/client.schema';
import { Project, ProjectSchema } from '../projects/project.schema';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    UsersModule,
    PaymentsModule,
    EntitlementsModule,
    AiUsageModule,
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
