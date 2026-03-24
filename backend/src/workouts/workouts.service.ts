import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkoutDto } from './dto/create-workout.dto';
import { UpdateWorkoutDto } from './dto/update-workout.dto';

const exerciseOrderBy = [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }];

@Injectable()
export class WorkoutsService {
  constructor(private prisma: PrismaService) {}

  async assertStudentAccess(actor: RequestUser, studentId: string) {
    if (actor.role === Role.ADMIN) return;
    if (actor.role === Role.STUDENT) {
      if (actor.id !== studentId) throw new ForbiddenException();
      return;
    }
    if (actor.role === Role.COACH) {
      const s = await this.prisma.user.findFirst({
        where: { id: studentId, role: Role.STUDENT, coachId: actor.id },
      });
      if (!s) throw new ForbiddenException();
    }
  }

  private async ensureWorkoutAccess(actor: RequestUser, workoutId: string) {
    const w = await this.prisma.workout.findUnique({
      where: { id: workoutId },
      include: { student: true },
    });
    if (!w) throw new NotFoundException();
    await this.assertStudentAccess(actor, w.studentId);
    return w;
  }

  resolveStudentId(actor: RequestUser, studentId?: string) {
    if (actor.role === Role.STUDENT) return actor.id;
    if (!studentId) throw new BadRequestException('Укажите studentId');
    return studentId;
  }

  async findInRange(actor: RequestUser, studentId: string, from: string, to: string) {
    await this.assertStudentAccess(actor, studentId);
    const fromDate = new Date(from);
    const toDate = new Date(to);
    return this.prisma.workout.findMany({
      where: {
        studentId,
        startAt: { gte: fromDate, lte: toDate },
      },
      orderBy: { startAt: 'asc' },
      include: {
        exercises: { orderBy: exerciseOrderBy },
      },
    });
  }

  async findOne(actor: RequestUser, id: string) {
    const w = await this.ensureWorkoutAccess(actor, id);
    return this.prisma.workout.findUnique({
      where: { id: w.id },
      include: { exercises: { orderBy: exerciseOrderBy } },
    });
  }

  async create(actor: RequestUser, dto: CreateWorkoutDto) {
    const studentId = this.resolveStudentId(actor, dto.studentId);
    if (actor.role === Role.STUDENT) {
      throw new ForbiddenException('Ученик не может создавать тренировки');
    }
    await this.assertStudentAccess(actor, studentId);
    return this.prisma.workout.create({
      data: {
        studentId,
        title: dto.title,
        startAt: new Date(dto.startAt),
      },
      include: { exercises: { orderBy: exerciseOrderBy } },
    });
  }

  async update(actor: RequestUser, id: string, dto: UpdateWorkoutDto) {
    await this.ensureWorkoutAccess(actor, id);
    if (actor.role === Role.STUDENT) {
      throw new ForbiddenException();
    }
    return this.prisma.workout.update({
      where: { id },
      data: {
        ...(dto.title !== undefined ? { title: dto.title } : {}),
        ...(dto.startAt !== undefined ? { startAt: new Date(dto.startAt) } : {}),
      },
      include: { exercises: { orderBy: exerciseOrderBy } },
    });
  }

  async remove(actor: RequestUser, id: string) {
    await this.ensureWorkoutAccess(actor, id);
    if (actor.role === Role.STUDENT) {
      throw new ForbiddenException();
    }
    await this.prisma.workout.delete({ where: { id } });
    return { ok: true };
  }
}
