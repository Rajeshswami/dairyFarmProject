import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateMilkProductionDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  morning?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  evening?: number;

  @IsString()
  @IsOptional()
  note?: string;
}