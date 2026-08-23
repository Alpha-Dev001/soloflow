import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { CalendarEvent, CalendarEventSchema } from './calendar-event.schema';
import { CalendarController } from './calendar.controller';
import { CalendarService } from './calendar.service';
import { Project, ProjectSchema } from '../projects/project.schema';
import { Invoice, InvoiceSchema } from '../invoices/invoice.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CalendarEvent.name, schema: CalendarEventSchema },
      { name: Project.name, schema: ProjectSchema },
      { name: Invoice.name, schema: InvoiceSchema },
    ]),
  ],
  controllers: [CalendarController],
  providers: [CalendarService],
  exports: [CalendarService],
})
export class CalendarModule {}
