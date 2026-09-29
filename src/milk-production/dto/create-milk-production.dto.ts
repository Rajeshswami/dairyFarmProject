import {
  IsDateString,
  IsMongoId,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateMilkProductionDto {
  @IsMongoId()
  animalId: string;

  @IsDateString()
  date: string;

  @IsNumber()
  @Min(0)
  morning: number;

  @IsNumber()
  @Min(0)
  evening: number;

  @IsString()
  @IsOptional()
  note?: string;
}