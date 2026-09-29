import {
  IsDateString,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class UpdateAnimalDto {
  @IsString()
  @IsOptional()
  tagNumber?: string;

  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  breed?: string;

  @IsIn(['MALE', 'FEMALE'])
  @IsOptional()
  gender?: string;

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