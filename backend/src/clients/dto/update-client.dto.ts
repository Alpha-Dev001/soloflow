import { IsString, IsOptional, IsEmail, IsIn } from 'class-validator';
import { Transform } from 'class-transformer';

export class UpdateClientDto {
    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    company?: string;

    @IsOptional()
    @Transform(({ value }) => (value === '' || value === null) ? undefined : value)
    @IsEmail()
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;

    @IsOptional()
    @IsString()
    website?: string;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsIn(['Active', 'Lead', 'Inactive'])
    status?: string;

    @IsOptional()
    @IsIn(['Enterprise', 'Startup', 'SMB'])
    tier?: string;

    @IsOptional()
    @IsString()
    country?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
