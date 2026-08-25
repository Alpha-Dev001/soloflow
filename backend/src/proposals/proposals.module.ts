import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Proposal, ProposalSchema } from './proposal.schema';
import { ProposalsController } from './proposals.controller';
import { ProposalsService } from './proposals.service';
import { ActivitiesModule } from '../activities/activities.module';
import { Client, ClientSchema } from '../clients/client.schema';
import { AiModule } from '../ai/ai.module';
import { AiUsageModule } from '../ai-usage/ai-usage.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Proposal.name, schema: ProposalSchema },
      { name: Client.name, schema: ClientSchema },
    ]),
    ActivitiesModule,
    AiModule,
    AiUsageModule,
  ],
  controllers: [ProposalsController],
  providers: [ProposalsService],
  exports: [ProposalsService, MongooseModule],
})
export class ProposalsModule {}
