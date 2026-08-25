import { IsIn, IsOptional, IsString } from 'class-validator';

export class AdminGrantProDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminRevokeProDto {
  @IsOptional()
  @IsString()
  note?: string;
}

export class AdminAccountStatusDto {
  @IsIn(['active', 'suspended'])
  accountStatus: 'active' | 'suspended';

  @IsOptional()
  @IsString()
  note?: string;
}
