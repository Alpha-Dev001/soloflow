import { IsString, IsOptional, IsNumber, IsIn, IsArray } from 'class-validator';

export class UpdateProposalDto {
    @IsOptional()
    @IsString()
    projectId?: string;

    @IsOptional()
    @IsString()
    title?: string;

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
