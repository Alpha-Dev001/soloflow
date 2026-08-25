import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../entitlements/guards/roles.guard';
import { Roles } from '../entitlements/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { UserDocument } from '../users/user.schema';
import { AdminService } from './admin.service';
import {
  AdminAccountStatusDto,
  AdminGrantProDto,
  AdminRevokeProDto,
} from './dto/admin-user.dto';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** GET /api/admin/stats */
  @Get('stats')
  getStats() {
    return this.adminService.getStats();
  }

  /** GET /api/admin/users */
  @Get('users')
  listUsers(
    @Query('search') search?: string,
    @Query('plan') plan?: string,
    @Query('status') status?: string,
    @Query('role') role?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.listUsers({
      search,
      plan,
      status,
      role,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 25,
    });
  }

  /** GET /api/admin/users/:id */
  @Get('users/:id')
  getUser(@Param('id') id: string) {
    return this.adminService.getUser(id);
  }

  /** POST /api/admin/users/:id/grant-pro */
  @Post('users/:id/grant-pro')
  @HttpCode(HttpStatus.OK)
  grantPro(
    @CurrentUser() admin: UserDocument,
    @Param('id') id: string,
    @Body() dto: AdminGrantProDto,
  ) {
    return this.adminService.grantPro(String(admin._id), id, dto.note);
  }

  /** POST /api/admin/users/:id/revoke-pro */
  @Post('users/:id/revoke-pro')
  @HttpCode(HttpStatus.OK)
  revokePro(
    @CurrentUser() admin: UserDocument,
    @Param('id') id: string,
    @Body() dto: AdminRevokeProDto,
  ) {
    return this.adminService.revokePro(String(admin._id), id, dto.note);
  }

  /** PATCH /api/admin/users/:id/account-status */
  @Patch('users/:id/account-status')
  setAccountStatus(
    @CurrentUser() admin: UserDocument,
    @Param('id') id: string,
    @Body() dto: AdminAccountStatusDto,
  ) {
    return this.adminService.setAccountStatus(
      String(admin._id),
      id,
      dto.accountStatus,
      dto.note,
    );
  }
}
