import { IsISO8601, IsOptional, IsString, IsUUID, MinLength } from 'class-validator';

export class CreateWorkoutDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsString()
  @MinLength(1)
  title!: string;

  @IsISO8601()
  startAt!: string;
}
