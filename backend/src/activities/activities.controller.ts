import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { ActivitiesService } from './activities.service';

@Controller('activities')
@UseGuards(JwtAuthGuard)
export class ActivitiesController {
  constructor(private readonly activitiesService: ActivitiesService) {}

  /** GET /api/activities?clientId= */
  @Get()
  async findAll(
    @CurrentUser() user: UserDocument,
    @Query('clientId') clientId?: string,
  ) {
    const activities = await this.activitiesService.findRecent(String(user._id), 50);
    const filtered = clientId
      ? activities.filter((a: any) => a.clientId && String(a.clientId) === clientId)
      : activities;
    return { activities: filtered.map(a => this.activitiesService.toActivityItem(a)) };
  }
}
