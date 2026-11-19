import { HttpStatus, Injectable } from '@nestjs/common';
import { EmployeeStatus, Prisma, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService, throwRpcError } from '@app/shared';

export interface EmployeeQueryPayload {
  search?: string;
  department?: string;
  status?: EmployeeStatus;
  notAttendedToday?: boolean;
  page?: number;
  limit?: number;
}

function toTodayDateOnly(): Date {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}

export interface CreateEmployeePayload {
  email: string;
  password: string;
  role?: Role;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  phone?: string;
  status?: EmployeeStatus;
}

export interface UpdateEmployeePayload {
  email?: string;
  password?: string;
  role?: Role;
  employeeCode?: string;
  fullName?: string;
  department?: string;
  position?: string;
  phone?: string;
  status?: EmployeeStatus;
}

const EMPLOYEE_SELECT = {
  id: true,
  userId: true,
  employeeCode: true,
  fullName: true,
  department: true,
  position: true,
  phone: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
    },
  },
} satisfies Prisma.EmployeeSelect;

@Injectable()
export class EmployeeService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: EmployeeQueryPayload) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.EmployeeWhereInput = {};

    if (query.department) {
      where.department = query.department;
    }

    if (query.status) {
      where.status = query.status;
    }

    if (query.notAttendedToday === true || String(query.notAttendedToday) === 'true') {
      where.status = EmployeeStatus.ACTIVE;
      where.attendances = {
        none: {
          attendanceDate: toTodayDateOnly(),
        },
      };
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { fullName: { contains: keyword } },
        { employeeCode: { contains: keyword } },
        { position: { contains: keyword } },
        { user: { email: { contains: keyword } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.employee.findMany({
        where,
        select: EMPLOYEE_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.employee.count({ where }),
    ]);

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: number) {
    const employee = await this.prisma.employee.findUnique({
      where: { id },
      select: EMPLOYEE_SELECT,
    });

    if (!employee) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan.');
    }

    return employee;
  }

  async create(payload: CreateEmployeePayload) {
    const email = payload.email.trim().toLowerCase();
    const employeeCode = payload.employeeCode.trim().toUpperCase();

    const [existingEmail, existingCode] = await Promise.all([
      this.prisma.user.findUnique({ where: { email } }),
      this.prisma.employee.findUnique({ where: { employeeCode } }),
    ]);

    if (existingEmail) {
      throwRpcError(HttpStatus.CONFLICT, 'Email sudah terdaftar.');
    }
    if (existingCode) {
      throwRpcError(HttpStatus.CONFLICT, 'NIK sudah terdaftar.');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const status = payload.status ?? EmployeeStatus.ACTIVE;

    return this.prisma.employee.create({
      data: {
        employeeCode,
        fullName: payload.fullName.trim(),
        department: payload.department.trim(),
        position: payload.position.trim(),
        phone: payload.phone?.trim() || null,
        status,
        user: {
          create: {
            email,
            passwordHash,
            role: payload.role ?? Role.EMPLOYEE,
            isActive: status === EmployeeStatus.ACTIVE,
          },
        },
      },
      select: EMPLOYEE_SELECT,
    });
  }

  async update(id: number, payload: UpdateEmployeePayload) {
    const existing = await this.prisma.employee.findUnique({
      where: { id },
      include: { user: true },
    });

    if (!existing) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan.');
    }

    if (payload.email) {
      const normalizedEmail = payload.email.trim().toLowerCase();
      if (normalizedEmail !== existing.user.email) {
        const emailTaken = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
        if (emailTaken) {
          throwRpcError(HttpStatus.CONFLICT, 'Email sudah digunakan oleh akun lain.');
        }
      }
    }

    if (payload.employeeCode) {
      const normalizedCode = payload.employeeCode.trim().toUpperCase();
      if (normalizedCode !== existing.employeeCode) {
        const codeTaken = await this.prisma.employee.findUnique({
          where: { employeeCode: normalizedCode },
        });
        if (codeTaken) {
          throwRpcError(HttpStatus.CONFLICT, 'NIK sudah digunakan oleh karyawan lain.');
        }
      }
    }

    const userUpdateData: Prisma.UserUpdateInput = {};
    if (payload.email) userUpdateData.email = payload.email.trim().toLowerCase();
    if (payload.role) userUpdateData.role = payload.role;
    if (payload.password) userUpdateData.passwordHash = await bcrypt.hash(payload.password, 10);
    if (payload.status) userUpdateData.isActive = payload.status === EmployeeStatus.ACTIVE;

    return this.prisma.employee.update({
      where: { id },
      data: {
        employeeCode: payload.employeeCode?.trim().toUpperCase(),
        fullName: payload.fullName?.trim(),
        department: payload.department?.trim(),
        position: payload.position?.trim(),
        phone: payload.phone !== undefined ? payload.phone.trim() || null : undefined,
        status: payload.status,
        ...(Object.keys(userUpdateData).length > 0 ? { user: { update: userUpdateData } } : {}),
      },
      select: EMPLOYEE_SELECT,
    });
  }

  async remove(id: number) {
    const existing = await this.prisma.employee.findUnique({ where: { id } });
    if (!existing) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan.');
    }

    await this.prisma.user.delete({ where: { id: existing.userId } });
    return { deleted: true, id };
  }
}
