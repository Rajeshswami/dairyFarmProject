import {
  IsDateString,
  IsIn,
  IsOptional,
} from 'class-validator';

export class UpdateMilkDeliveryDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  @IsOptional()
  morning?: number;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  @IsOptional()
  evening?: number;
}