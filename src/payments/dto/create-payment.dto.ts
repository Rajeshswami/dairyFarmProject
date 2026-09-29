import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePaymentDto {
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @IsMongoId()
  @IsNotEmpty()
  billId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  paymentDate: string;

  @IsIn(['CASH', 'UPI', 'BANK'])
  paymentMethod: string;

  @IsString()
  @IsOptional()
  note?: string;
}