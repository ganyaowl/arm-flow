import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coachId: true,
        blocked: true,
        createdAt: true,
      },
    });
  }

  async create(dto: CreateUserDto) {
    if (dto.role !== Role.STUDENT && dto.coachId) {
      throw new BadRequestException('coachId только для роли STUDENT');
    }
    if (dto.coachId) {
      const coach = await this.prisma.user.findFirst({
        where: { id: dto.coachId, role: Role.COACH },
      });
      if (!coach) throw new BadRequestException('Тренер не найден');
    }
    const exists = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (exists) throw new ConflictException('Email уже занят');
    const passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        passwordHash,
        role: dto.role,
        coachId: dto.coachId ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coachId: true,
        blocked: true,
        createdAt: true,
      },
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    if (dto.coachId !== undefined && dto.coachId !== null) {
      const coach = await this.prisma.user.findFirst({
        where: { id: dto.coachId, role: Role.COACH },
      });
      if (!coach) throw new BadRequestException('Тренер не найден');
    }
    const data: Parameters<typeof this.prisma.user.update>[0]['data'] = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.role !== undefined) data.role = dto.role;
    if (dto.blocked !== undefined) data.blocked = dto.blocked;
    if (dto.coachId !== undefined) data.coachId = dto.coachId;
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 10);
    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        coachId: true,
        blocked: true,
        createdAt: true,
      },
    });
  }

  async remove(id: string) {
    await this.prisma.user.delete({ where: { id } });
    return { ok: true };
  }
}
