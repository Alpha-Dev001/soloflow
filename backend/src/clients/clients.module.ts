import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './client.schema';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ActivitiesModule } from '../activities/activities.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { Project, ProjectSchema } from '../projects/project.schema';
import { Proposal, ProposalSchema } from '../proposals/proposal.schema';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';
// Resource modules provide the services used for client-scoped creation
import { ProjectsModule } from '../projects/projects.module';
import { ProposalsModule } from '../proposals/proposals.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Proposal.name, schema: ProposalSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    ActivitiesModule,
    EntitlementsModule,
    ProjectsModule,
    ProposalsModule,
    InvoicesModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService, MongooseModule],
})
export class ClientsModule {}
