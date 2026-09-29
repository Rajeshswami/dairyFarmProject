import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdatePaymentDto {
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  paymentDate?: string;

  @IsIn(['CASH', 'UPI', 'BANK'])
  @IsOptional()
  paymentMethod?: string;

  @IsString()
  @IsOptional()
  note?: string;
}