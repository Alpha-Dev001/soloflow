import {
    IsString,
    IsOptional,
    IsNumber,
    IsIn,
    IsArray,
    ValidateNested,
    IsPositive,
} from 'class-validator';
import { Type } from 'class-transformer';
import { InvoiceItemDto } from './create-invoice.dto';

export class UpdateInvoiceDto {
    @IsOptional()
    @IsString()
    clientId?: string;

    @IsOptional()
    @IsString()
    projectId?: string;

    @IsOptional()
    @IsString()
    issueDate?: string;

    @IsOptional()
    @IsString()
    dueDate?: string;

    @IsOptional()
    @IsIn(['Paid', 'Pending', 'Overdue', 'Sent', 'Draft'])
    status?: string;

    @IsOptional()
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => InvoiceItemDto)
    items?: InvoiceItemDto[];

    @IsOptional()
    @IsNumber()
    taxRate?: number;

    @IsOptional()
    @IsString()
    currency?: string;

    @IsOptional()
    @IsString()
    notes?: string;
}
