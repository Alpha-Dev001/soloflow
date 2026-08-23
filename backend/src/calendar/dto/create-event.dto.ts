import { IsString, IsOptional, IsIn, IsBoolean } from 'class-validator';

export class CreateCalendarEventDto {
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  clientName?: string;

  @IsOptional()
  @IsString()
  clientId?: string;

  @IsString()
  date: string; // YYYY-MM-DD

  @IsOptional()
  @IsIn(['deadline', 'meeting', 'milestone', 'invoice_due'])
  type?: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class UpdateCalendarEventDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  date?: string;

  @IsOptional()
  @IsBoolean()
  completed?: boolean;

  @IsOptional()
  @IsString()
  description?: string;
}
