import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExerciseStatus, Prisma, Role } from '@prisma/client';
import { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';
import { WorkoutsService } from '../workouts/workouts.service';
import { CreateExerciseDto } from './dto/create-exercise.dto';
import { UpdateExerciseDto } from './dto/update-exercise.dto';

@Injectable()
export class ExercisesService {
  constructor(
    private prisma: PrismaService,
    private workouts: WorkoutsService,
  ) {}

  private async loadWorkoutForExercise(exerciseId: string) {
    const ex = await this.prisma.exercise.findUnique({
      where: { id: exerciseId },
      include: { workout: true },
    });
    if (!ex) throw new NotFoundException();
    return ex;
  }

  async create(actor: RequestUser, workoutId: string, dto: CreateExerciseDto) {
    if (actor.role === Role.STUDENT) throw new ForbiddenException();
    await this.workouts.findOne(actor, workoutId);
    const maxOrder = await this.prisma.exercise.aggregate({
      where: { workoutId },
      _max: { sortOrder: true },
    });
    const sortOrder = (maxOrder._max.sortOrder ?? -1) + 1;
    const completedSets = Array.from({ length: dto.sets }, () => false);
    return this.prisma.exercise.create({
      data: {
        workoutId,
        title: dto.title,
        description: dto.description ?? '',
        sets: dto.sets,
        reps: dto.reps,
        weight: dto.weight,
        weightUnit: dto.weightUnit,
        videoUrl: dto.videoUrl ?? null,
        sortOrder,
        completedSets,
      },
    });
  }

  async update(actor: RequestUser, id: string, dto: UpdateExerciseDto) {
    const ex = await this.loadWorkoutForExercise(id);
    await this.workouts.assertStudentAccess(actor, ex.workout.studentId);

    if (actor.role === Role.STUDENT) {
      const forbidden =
        dto.title !== undefined ||
        dto.description !== undefined ||
        dto.sets !== undefined ||
        dto.reps !== undefined ||
        dto.weight !== undefined ||
        dto.weightUnit !== undefined ||
        dto.videoUrl !== undefined;
      if (forbidden) throw new ForbiddenException();
      const data: Prisma.ExerciseUpdateInput = {};
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.completedSets !== undefined) {
        if (dto.completedSets.length !== ex.sets) {
          throw new ForbiddenException('completedSets должен совпадать с числом подходов');
        }
        data.completedSets = dto.completedSets;
        if (dto.completedSets.every(Boolean)) {
          data.status = ExerciseStatus.DONE;
        }
      }
      if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
      if (Object.keys(data).length === 0) throw new ForbiddenException();
      return this.prisma.exercise.update({ where: { id }, data });
    }

    if (actor.role === Role.COACH || actor.role === Role.ADMIN) {
      const data: Prisma.ExerciseUpdateInput = {};
      if (dto.title !== undefined) data.title = dto.title;
      if (dto.description !== undefined) data.description = dto.description;
      if (dto.sets !== undefined) {
        data.sets = dto.sets;
        const current = (ex.completedSets as boolean[]) ?? [];
        data.completedSets = Array.from({ length: dto.sets }, (_, i) => current[i] ?? false);
      }
      if (dto.completedSets !== undefined) {
        const targetSets = dto.sets ?? ex.sets;
        if (dto.completedSets.length !== targetSets) {
          throw new BadRequestException('completedSets должен совпадать с числом подходов');
        }
        data.completedSets = dto.completedSets;
      }
      if (dto.reps !== undefined) data.reps = dto.reps;
      if (dto.weight !== undefined) data.weight = dto.weight;
      if (dto.weightUnit !== undefined) data.weightUnit = dto.weightUnit;
      if (dto.videoUrl !== undefined) data.videoUrl = dto.videoUrl;
      if (dto.status !== undefined) data.status = dto.status;
      if (dto.sortOrder !== undefined) data.sortOrder = dto.sortOrder;
      return this.prisma.exercise.update({ where: { id }, data });
    }

    throw new ForbiddenException();
  }

  async remove(actor: RequestUser, id: string) {
    if (actor.role === Role.STUDENT) throw new ForbiddenException();
    const ex = await this.loadWorkoutForExercise(id);
    await this.workouts.assertStudentAccess(actor, ex.workout.studentId);
    await this.prisma.exercise.delete({ where: { id } });
    return { ok: true };
  }

  async attachMedia(actor: RequestUser, id: string, relativePath: string) {
    if (actor.role === Role.STUDENT) throw new ForbiddenException();
    const ex = await this.loadWorkoutForExercise(id);
    await this.workouts.assertStudentAccess(actor, ex.workout.studentId);
    return this.prisma.exercise.update({
      where: { id },
      data: { mediaPath: relativePath },
    });
  }
}
