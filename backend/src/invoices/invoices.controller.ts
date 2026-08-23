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
import { InvoicesService } from './invoices.service';
import { CreateInvoiceDto, UpdateInvoiceStatusDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private readonly invoicesService: InvoicesService) {}

  /** GET /api/invoices?search=&clientId= */
  @Get()
  findAll(
    @CurrentUser() user: UserDocument,
    @Query('search') search?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.invoicesService.findAll(String(user._id), search, clientId);
  }

  /** GET /api/invoices/:id */
  @Get(':id')
  async findOne(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    const invoice = await this.invoicesService.findOne(String(user._id), id);
    return { invoice: invoice.toJSON() };
  }

  /** POST /api/invoices */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateInvoiceDto,
  ) {
    return this.invoicesService.create(String(user._id), dto);
  }

  /** PUT /api/invoices/:id */
  @Put(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceDto,
  ) {
    return this.invoicesService.update(String(user._id), id, dto);
  }

  /** PATCH /api/invoices/:id/status */
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateInvoiceStatusDto,
  ) {
    return this.invoicesService.updateStatus(String(user._id), id, dto.status);
  }

  /** DELETE /api/invoices/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    await this.invoicesService.remove(String(user._id), id);
    return { success: true };
  }
}
