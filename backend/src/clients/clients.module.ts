import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Client, ClientSchema } from './client.schema';
import { ClientsController } from './clients.controller';
import { ClientsService } from './clients.service';
import { ActivitiesModule } from '../activities/activities.module';
import { EntitlementsModule } from '../entitlements/entitlements.module';
import { Project, ProjectSchema } from '../projects/project.schema';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';
// Resource modules provide the services used for client-scoped creation
import { ProjectsModule } from '../projects/projects.module';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Client.name, schema: ClientSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
    ActivitiesModule,
    EntitlementsModule,
    ProjectsModule,
    InvoicesModule,
  ],
  controllers: [ClientsController],
  providers: [ClientsService],
  exports: [ClientsService, MongooseModule],
})
export class ClientsModule {}
