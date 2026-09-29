import {
  IsInt,
  IsMongoId,
  Max,
  Min,
} from 'class-validator';

export class CreateMonthlyBillDto {
  @IsMongoId()
  customerId: string;

  @IsInt()
  year: number;

  @IsInt()
  @Min(1)
  @Max(12)
  month: number;
}