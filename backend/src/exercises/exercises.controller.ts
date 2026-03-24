import { Body, Controller, Delete, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/types/request-user';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';
import { ExercisesService } from './exercises.service';

@Controller()
@UseGuards(JwtAuthGuard, RolesGuard)
export class ExercisesController {
  constructor(private exercises: ExercisesService) {}

  @Post('workouts/:workoutId/exercises')
  @Roles(Role.ADMIN, Role.COACH)
  create(
    @CurrentUser() user: RequestUser,
    @Param('workoutId') workoutId: string,
    @Body() dto: CreateExerciseDto,
  ) {
    return this.exercises.create(user, workoutId, dto);
  }

  @Patch('exercises/:id')
  @Roles(Role.ADMIN, Role.COACH, Role.STUDENT)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateExerciseDto) {
    return this.exercises.update(user, id, dto);
  }

  @Delete('exercises/:id')
  @Roles(Role.ADMIN, Role.COACH)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.exercises.remove(user, id);
  }
}
