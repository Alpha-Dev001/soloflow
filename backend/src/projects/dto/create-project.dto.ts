import {
  IsString,
  IsOptional,
  IsNumber,
  IsIn,
  IsDateString,
  IsArray,
  IsBoolean,
} from 'class-validator';

export class CreateProjectDto {
  @IsString()
  title: string;

  @IsString()
  clientId: string;

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

  @IsString()
  deadline: string; // ISO or human-readable — normalized in service

  @IsOptional()
  @IsArray()
  tags?: string[];

  @IsOptional()
  @IsString()
  proposalId?: string;
}
