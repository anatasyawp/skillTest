import { PrismaClient, Role, EmployeeStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const defaultPassword = await bcrypt.hash('Password123!', 10);

  await prisma.user.upsert({
    where: { email: 'hrd@company.local' },
    update: {},
    create: {
      email: 'hrd@company.local',
      passwordHash: defaultPassword,
      role: Role.HRD_ADMIN,
      isActive: true,
      employee: {
        create: {
          employeeCode: 'HRD-001',
          fullName: 'Rina Kusuma',
          department: 'Human Resources',
          position: 'HRD Manager',
          phone: '081234567890',
          status: EmployeeStatus.ACTIVE,
        },
      },
    },
  });

  const sampleEmployees = [
    {
      email: 'budi.santoso@company.local',
      employeeCode: 'EMP-001',
      fullName: 'Budi Santoso',
      department: 'Engineering',
      position: 'Backend Developer',
      phone: '081298765431',
    },
    {
      email: 'siti.rahma@company.local',
      employeeCode: 'EMP-002',
      fullName: 'Siti Rahma',
      department: 'Engineering',
      position: 'Frontend Developer',
      phone: '081298765432',
    },
    {
      email: 'andi.wijaya@company.local',
      employeeCode: 'EMP-003',
      fullName: 'Andi Wijaya',
      department: 'Product',
      position: 'Product Designer',
      phone: '081298765433',
    },
  ];

  for (const emp of sampleEmployees) {
    await prisma.user.upsert({
      where: { email: emp.email },
      update: {},
      create: {
        email: emp.email,
        passwordHash: defaultPassword,
        role: Role.EMPLOYEE,
        isActive: true,
        employee: {
          create: {
            employeeCode: emp.employeeCode,
            fullName: emp.fullName,
            department: emp.department,
            position: emp.position,
            phone: emp.phone,
            status: EmployeeStatus.ACTIVE,
          },
        },
      },
    });
  }

  console.log('Seed completed: HRD Admin (hrd@company.local) and 3 sample employees created.');
}

main()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
