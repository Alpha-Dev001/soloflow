import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { CalendarService } from './calendar.service';
import { CreateCalendarEventDto, UpdateCalendarEventDto } from './dto/create-event.dto';

@Controller('calendar')
@UseGuards(JwtAuthGuard)
export class CalendarController {
  constructor(private readonly calendarService: CalendarService) {}

  /** GET /api/calendar */
  @Get()
  findAll(@CurrentUser() user: UserDocument) {
    return this.calendarService.findAll(String(user._id));
  }

  /** POST /api/calendar */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateCalendarEventDto,
  ) {
    return this.calendarService.create(String(user._id), dto);
  }

  /** PATCH /api/calendar/:id */
  @Patch(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateCalendarEventDto,
  ) {
    return this.calendarService.update(String(user._id), id, dto);
  }

  /** DELETE /api/calendar/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    await this.calendarService.remove(String(user._id), id);
    return { success: true };
  }
}
