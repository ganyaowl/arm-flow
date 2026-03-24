import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/types/request-user';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { QueryWorkoutsDto } from './dto/query-workouts.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';
import { WorkoutsService } from './workouts.service';

@Controller('workouts')
@UseGuards(JwtAuthGuard, RolesGuard)
export class WorkoutsController {
  constructor(private workouts: WorkoutsService) {}

  @Get()
  @Roles(Role.ADMIN, Role.COACH, Role.STUDENT)
  findRange(@CurrentUser() user: RequestUser, @Query() q: QueryWorkoutsDto) {
    const studentId = this.workouts.resolveStudentId(user, q.studentId);
    return this.workouts.findInRange(user, studentId, q.from, q.to);
  }

  @Get(':id')
  @Roles(Role.ADMIN, Role.COACH, Role.STUDENT)
  findOne(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workouts.findOne(user, id);
  }

  @Post()
  @Roles(Role.ADMIN, Role.COACH)
  create(@CurrentUser() user: RequestUser, @Body() dto: CreateWorkoutDto) {
    return this.workouts.create(user, dto);
  }

  @Patch(':id')
  @Roles(Role.ADMIN, Role.COACH)
  update(@CurrentUser() user: RequestUser, @Param('id') id: string, @Body() dto: UpdateWorkoutDto) {
    return this.workouts.update(user, id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN, Role.COACH)
  remove(@CurrentUser() user: RequestUser, @Param('id') id: string) {
    return this.workouts.remove(user, id);
  }
}
