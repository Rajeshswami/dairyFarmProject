import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateCustomerDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  mobile: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  morning: number;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  evening: number;

  @IsDateString()
  startDate: string;
}