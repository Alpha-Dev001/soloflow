import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { SubscriptionsService } from './subscriptions.service';
import { PLAN_DEFINITIONS } from '../entitlements/plan.constants';
import { ConfirmCheckoutDto, CreateCheckoutDto } from './dto/checkout.dto';

@Controller('subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  /** GET /api/subscriptions/me — current plan, entitlements, usage */
  @Get('me')
  async getMine(@CurrentUser() user: UserDocument) {
    const info = await this.subscriptionsService.getSubscriptionInfo(
      String(user._id),
    );
    return {
      ...info,
      plans: {
        starter: PLAN_DEFINITIONS.free,
        pro: PLAN_DEFINITIONS.pro,
      },
    };
  }

  /** GET /api/subscriptions/plans */
  @Get('plans')
  getPlans() {
    return {
      starter: PLAN_DEFINITIONS.free,
      pro: PLAN_DEFINITIONS.pro,
    };
  }

  /** POST /api/subscriptions/checkout — start simulated Pro upgrade */
  @Post('checkout')
  @HttpCode(HttpStatus.OK)
  async checkout(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateCheckoutDto,
  ) {
    return this.subscriptionsService.createUpgradeCheckout(user, dto.simulate);
  }

  /** POST /api/subscriptions/confirm — complete simulated payment */
  @Post('confirm')
  @HttpCode(HttpStatus.OK)
  async confirm(
    @CurrentUser() user: UserDocument,
    @Body() dto: ConfirmCheckoutDto,
  ) {
    return this.subscriptionsService.completeUpgrade(
      user,
      dto.sessionId,
      dto.simulate,
    );
  }
}
