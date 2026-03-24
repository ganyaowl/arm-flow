import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@armflow.local' },
    update: {},
    create: {
      email: 'admin@armflow.local',
      passwordHash: hash,
      name: 'Администратор',
      role: Role.ADMIN,
    },
  });

  const coachHash = await bcrypt.hash('coach123', 10);
  const coach = await prisma.user.upsert({
    where: { email: 'coach@armflow.local' },
    update: {},
    create: {
      email: 'coach@armflow.local',
      passwordHash: coachHash,
      name: 'Тренер',
      role: Role.COACH,
    },
  });

  const studentHash = await bcrypt.hash('student123', 10);
  await prisma.user.upsert({
    where: { email: 'student@armflow.local' },
    update: { coachId: coach.id },
    create: {
      email: 'student@armflow.local',
      passwordHash: studentHash,
      name: 'Ученик',
      role: Role.STUDENT,
      coachId: coach.id,
    },
  });

  console.log('Seed OK:');
  console.log('  admin@armflow.local / admin123');
  console.log('  coach@armflow.local / coach123');
  console.log('  student@armflow.local / student123');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
