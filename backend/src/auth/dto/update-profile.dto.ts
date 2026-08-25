import {
  IsEmail,
  IsString,
  IsOptional,
  IsObject,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class BankDetailsDto {
  @IsOptional()
  @IsString()
  bankName?: string;

  @IsOptional()
  @IsString()
  accountHolder?: string;

  @IsOptional()
  @IsString()
  routingNumber?: string;

  @IsOptional()
  @IsString()
  accountNumber?: string;
}

class AiSettingsDto {
  @IsOptional()
  @IsString()
  defaultTone?: string;
}

/**
 * Profile updates — deliberately excludes plan, role, subscriptionStatus,
 * and accountStatus. Those are server-controlled only.
 */
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
  @IsObject()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => AiSettingsDto)
  aiSettings?: AiSettingsDto;
}
