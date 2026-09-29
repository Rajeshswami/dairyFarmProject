import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateAnimalDto {
  @IsString()
  @IsNotEmpty()
  tagNumber: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsNotEmpty()
  breed: string;

  @IsIn(['MALE', 'FEMALE'])
  gender: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  purchasePrice?: number;

  @IsIn(['ACTIVE', 'SOLD', 'DEAD'])
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}