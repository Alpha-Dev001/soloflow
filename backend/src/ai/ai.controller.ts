import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FeatureGuard } from '../entitlements/guards/feature.guard';
import { RequireFeature } from '../entitlements/decorators/require-feature.decorator';
import { Feature } from '../entitlements/plan.constants';
import { AiService } from './ai.service';
import { ChatDto } from './dto/chat.dto';

@Controller('ai')
@UseGuards(JwtAuthGuard, FeatureGuard)
export class AiController {
  constructor(private readonly aiService: AiService) {}

  /** POST /api/ai/chat — Pro AI Business Assistant */
  @Post('chat')
  @HttpCode(HttpStatus.OK)
  @RequireFeature(Feature.AI_ASSISTANT)
  async chat(@Body() dto: ChatDto) {
    const reply = await this.aiService.chat(dto.message, dto.context);
    return { reply };
  }
}
