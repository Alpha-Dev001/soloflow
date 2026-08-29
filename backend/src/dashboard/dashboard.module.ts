import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';
import { Project, ProjectSchema } from '../projects/project.schema';
import { Client, ClientSchema } from '../clients/client.schema';
import { CalendarEvent, CalendarEventSchema } from '../calendar/calendar-event.schema';
import { ActivitiesModule } from '../activities/activities.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Invoice.name, schema: InvoiceSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Client.name, schema: ClientSchema },
      { name: CalendarEvent.name, schema: CalendarEventSchema },
    ]),
    ActivitiesModule,
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
