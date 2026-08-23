import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';

export class UpdateProjectDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsNumber()
  budget?: number;

  @IsOptional()
  @IsIn(['Low', 'Medium', 'High', 'Urgent'])
  priority?: string;

  @IsOptional()
  @IsIn(['To Do', 'In Progress', 'Completed', 'On Hold', 'Cancelled'])
  status?: string;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  deadline?: string;

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  proposalId?: string;
}

export class UpdateProjectStatusDto {
  @IsIn(['To Do', 'In Progress', 'Completed', 'On Hold', 'Cancelled'])
  status: string;
}
