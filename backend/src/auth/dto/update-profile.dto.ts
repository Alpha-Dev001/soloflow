import { IsEmail, IsString, IsOptional } from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  businessName?: string;

  @IsOptional()
  @IsString()
  company?: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsString()
  plan?: string;

  @IsOptional()
  bankDetails?: {
    bankName?: string;
    accountHolder?: string;
    routingNumber?: string;
    accountNumber?: string;
  };

  @IsOptional()
  aiSettings?: {
    defaultTone?: string;
  };
}
