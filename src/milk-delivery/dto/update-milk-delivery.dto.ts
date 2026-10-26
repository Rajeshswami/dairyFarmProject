import {
  IsDateString,
  IsIn,
  IsOptional,
  IsNumber,
  Min,
  Max,
} from 'class-validator';

const QUARTER_LITRE_OPTIONS = Array.from(
  { length: 41 },
  (_, index) => index * 0.25,
);

export class UpdateMilkDeliveryDto {
  @IsDateString()
  @IsOptional()
  date?: string;

  @IsIn(QUARTER_LITRE_OPTIONS)
  @IsOptional()
  morning?: number;

  @IsIn(QUARTER_LITRE_OPTIONS)
  @IsOptional()
  evening?: number;

  @IsNumber()
  @Min(0.01)
  @Max(100000)
  @IsOptional()
  ratePerLiter?: number;
}
