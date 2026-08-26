import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { ProposalsService } from './proposals.service';
import {
  CreateProposalDto,
  GenerateProposalDto,
  UpdateProposalStatusDto,
} from './dto/create-proposal.dto';
import { UpdateProposalDto } from './dto/update-proposal.dto';

@Controller('proposals')
@UseGuards(JwtAuthGuard)
export class ProposalsController {
  constructor(
    private readonly proposalsService: ProposalsService,
  ) {}

  /** GET /api/proposals */
  @Get()
  findAll(
    @CurrentUser() user: UserDocument,
    @Query('search') search?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.proposalsService.findAll(String(user._id), search, clientId);
  }

  /** POST /api/proposals/generate — AI generation (not persisted) */
  @Post('generate')
  @HttpCode(HttpStatus.OK)
  async generate(
    @CurrentUser() user: UserDocument,
    @Body() dto: GenerateProposalDto,
  ) {
    return this.proposalsService.generateProposal(user, dto);
  }

  /** GET /api/proposals/:id */
  @Get(':id')
  async findOne(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    return this.proposalsService.findOneDetails(String(user._id), id);
  }

  /** PUT /api/proposals/:id */
  @Put(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateProposalDto,
  ) {
    return this.proposalsService.update(String(user._id), id, dto);
  }

  /** PATCH /api/proposals/:id/status */
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateProposalStatusDto,
  ) {
    return this.proposalsService.updateStatus(String(user._id), id, dto.status);
  }

  /** DELETE /api/proposals/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    await this.proposalsService.remove(String(user._id), id);
    return { success: true };
  }
}
