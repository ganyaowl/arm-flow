import { Controller, Get, UseGuards } from '@nestjs/common';
import { Role } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Roles } from '../common/decorators/roles.decorator';
import { RolesGuard } from '../common/guards/roles.guard';
import type { RequestUser } from '../common/types/request-user';
import { PrismaService } from '../prisma/prisma.service';

@Controller('coach')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.COACH)
export class CoachController {
  constructor(private prisma: PrismaService) {}

  @Get('students')
  students(@CurrentUser() user: RequestUser) {
    return this.prisma.user.findMany({
      where: { coachId: user.id, role: Role.STUDENT },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        email: true,
        name: true,
        blocked: true,
        createdAt: true,
      },
    });
  }
}
