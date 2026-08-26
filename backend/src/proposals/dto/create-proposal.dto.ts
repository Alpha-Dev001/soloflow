import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';

export class CreateProposalDto {
  @IsOptional()
  @IsString()
  projectId?: string;

  @IsString()
  title: string;

  @IsOptional()
  @IsNumber()
  amount?: number;

  @IsOptional()
  @IsIn(['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'])
  status?: string;

  @IsOptional()
  @IsString()
  tone?: string;

  @IsOptional()
  @IsString()
  overview?: string;

  @IsOptional()
  @IsArray()
  scopeOfWork?: string[];

  @IsOptional()
  @IsArray()
  deliverables?: string[];

  @IsOptional()
  @IsString()
  timeline?: string;

  @IsOptional()
  @IsString()
  investment?: string;

  @IsOptional()
  @IsString()
  terms?: string;
}

export class GenerateProposalDto {
  @IsString()
  clientName: string;

  @IsOptional()
  @IsString()
  projectName?: string;

  @IsString()
  projectTitle: string;

  @IsString()
  description: string;

  @IsOptional()
  budget?: string | number;

  @IsOptional()
  @IsString()
  tone?: string;
}

export class UpdateProposalStatusDto {
  @IsIn(['Draft', 'Sent', 'Viewed', 'Accepted', 'Rejected', 'Expired'])
  status: string;
}
