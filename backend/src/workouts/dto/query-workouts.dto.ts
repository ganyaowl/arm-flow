import { IsISO8601, IsOptional, IsUUID } from 'class-validator';

export class QueryWorkoutsDto {
  @IsOptional()
  @IsUUID()
  studentId?: string;

  @IsISO8601()
  from!: string;

  @IsISO8601()
  to!: string;
}
