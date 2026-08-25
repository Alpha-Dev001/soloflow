import { IsIn, IsOptional, IsString } from 'class-validator';

export class CreateCheckoutDto {
  @IsOptional()
  @IsIn(['success', 'failure'])
  simulate?: 'success' | 'failure';
}

export class ConfirmCheckoutDto {
  @IsString()
  sessionId: string;

  @IsOptional()
  @IsIn(['success', 'failure'])
  simulate?: 'success' | 'failure';
}
