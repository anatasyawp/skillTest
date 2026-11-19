import { PrismaClient, Role, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password', 10);

  await prisma.attendance.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.user.deleteMany();

  await prisma.user.create({
    data: {
      email: 'hrd@gmail.com',
      passwordHash,
      role: Role.HRD_ADMIN,
      isActive: true,
      employee: {
        create: {
          employeeCode: '3171011205900001',
          fullName: 'Rina Kusuma',
          department: 'Human Resources',
          position: 'HRD Manager',
          phone: '081234567890',
          status: EmployeeStatus.ACTIVE,
        },
      },
    },
  });

  await prisma.user.create({
    data: {
      email: 'kuronami@gmail.com',
      passwordHash,
      role: Role.EMPLOYEE,
      isActive: true,
      employee: {
        create: {
          employeeCode: '3171022008950002',
          fullName: 'Kuronami',
          department: 'Engineering',
          position: 'Software Engineer',
          phone: '081298765432',
          status: EmployeeStatus.ACTIVE,
        },
      },
    },
  });

  console.log(
    'Seed completed: fresh DB with 1 HRD Admin (hrd@gmail.com) and 1 Employee (kuronami@gmail.com), password: password.',
  );
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
