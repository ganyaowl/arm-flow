import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
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
import { ExerciseStatus, WeightUnit } from '@prisma/client';

export class UpdateExerciseDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsString()
  @MaxLength(8000)
  description?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  sets?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  reps?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @IsOptional()
  @IsUrl({ require_protocol: true })
  videoUrl?: string | null;

  @IsOptional()
  @IsEnum(ExerciseStatus)
  status?: ExerciseStatus;

  @IsOptional()
  @IsArray()
  @IsBoolean({ each: true })
  completedSets?: boolean[];

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  sortOrder?: number;
}
