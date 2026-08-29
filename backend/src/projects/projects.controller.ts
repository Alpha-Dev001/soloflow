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
import { ProjectsService } from './projects.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto, UpdateProjectStatusDto } from './dto/update-project.dto';

@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) { }

  /** GET /api/projects?search=&clientId= */
  @Get()
  findAll(
    @CurrentUser() user: UserDocument,
    @Query('search') search?: string,
    @Query('clientId') clientId?: string,
  ) {
    return this.projectsService.findAll(String(user._id), search, clientId);
  }

  /** POST /api/projects */
  @Post()
  create(
    @CurrentUser() user: UserDocument,
    @Body() dto: CreateProjectDto,
  ) {
    return this.projectsService.create(user, dto.clientId, dto);
  }

  /** GET /api/projects/:id */
  @Get(':id')
  findOne(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    return this.projectsService.findOneDetails(String(user._id), id);
  }

  /** PUT /api/projects/:id */
  @Put(':id')
  update(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateProjectDto,
  ) {
    return this.projectsService.update(String(user._id), id, dto);
  }

  /** PATCH /api/projects/:id/status */
  @Patch(':id/status')
  updateStatus(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
    @Body() dto: UpdateProjectStatusDto,
  ) {
    return this.projectsService.updateStatus(String(user._id), id, dto.status);
  }

  /** DELETE /api/projects/:id */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(
    @CurrentUser() user: UserDocument,
    @Param('id') id: string,
  ) {
    await this.projectsService.remove(String(user._id), id);
    return { success: true };
  }
}
