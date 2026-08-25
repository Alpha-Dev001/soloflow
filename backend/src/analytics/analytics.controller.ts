import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureGuard } from '../entitlements/guards/feature.guard';
import { RequireFeature } from '../entitlements/decorators/require-feature.decorator';
import { Feature } from '../entitlements/plan.constants';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
@UseGuards(JwtAuthGuard, FeatureGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** GET /api/analytics — Pro feature */
  @Get()
  @RequireFeature(Feature.ADVANCED_ANALYTICS)
  getMetrics(@CurrentUser() user: UserDocument) {
    return this.analyticsService.getMetrics(String(user._id));
  }
}
