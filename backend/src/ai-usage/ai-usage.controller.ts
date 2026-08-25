import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { AiUsageService } from './ai-usage.service';

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiUsageController {
  constructor(private readonly aiUsageService: AiUsageService) {}

  /** GET /api/ai/usage — current user's AI usage for today. */
  @Get('usage')
  getUsage(@CurrentUser() user: UserDocument) {
    return this.aiUsageService.getUsage(user);
  }
}