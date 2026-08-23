import { IsString, IsOptional } from 'class-validator';

export class ChatDto {
  @IsString()
  message: string;

  @IsOptional()
  context?: any;
}
