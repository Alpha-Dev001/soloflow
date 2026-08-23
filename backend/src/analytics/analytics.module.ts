import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';
import { Project, ProjectSchema } from '../projects/project.schema';
import { Client, ClientSchema } from '../clients/client.schema';
import { Proposal, ProposalSchema } from '../proposals/proposal.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Client.name, schema: ClientSchema },
      { name: Proposal.name, schema: ProposalSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
