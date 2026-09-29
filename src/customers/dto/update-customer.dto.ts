import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsNotEmpty,
} from 'class-validator';

export class UpdateCustomerDto {
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  mobile?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  @IsOptional()
  morning?: number;

  @IsIn([0, 0.25, 0.5, 0.75, 1])
  @IsOptional()
  evening?: number;

  @IsDateString()
  @IsOptional()
  startDate?: string;
}