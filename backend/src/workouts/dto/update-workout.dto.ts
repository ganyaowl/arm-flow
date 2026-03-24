import { IsISO8601, IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateWorkoutDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  title?: string;

  @IsOptional()
  @IsISO8601()
  startAt?: string;
}
