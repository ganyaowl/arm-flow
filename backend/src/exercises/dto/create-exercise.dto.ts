import { Type } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { WeightUnit } from '@prisma/client';

export class CreateExerciseDto {
  @IsString()
  @MinLength(1)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  sets!: number;

  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps!: number;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight!: number;

  @IsEnum(WeightUnit)
  weightUnit!: WeightUnit;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  videoUrl?: string;
}
