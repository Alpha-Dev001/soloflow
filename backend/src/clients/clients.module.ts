import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './client.schema';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ActivitiesModule } from '../activities/activities.module';
// Forward references for the detail endpoint
import { Project, ProjectSchema } from '../projects/project.schema';
import { Proposal, ProposalSchema } from '../proposals/proposal.schema';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Proposal.name, schema: ProposalSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService, MongooseModule],
})
export class ClientsModule {}
