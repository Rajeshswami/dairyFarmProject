import {
  IsDateString,
  IsIn,
  IsMongoId,
  IsNotEmpty,
} from 'class-validator';

export class CreateMilkDeliveryDto {
  @IsMongoId()
  @IsNotEmpty()
  customerId: string;

  @IsDateString()
  date: string;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  morning: number;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  evening: number;
}