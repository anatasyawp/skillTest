import { HttpStatus, Injectable } from '@nestjs/common';
import { EmployeeStatus, Prisma } from '@prisma/client';
import { PrismaService, throwRpcError } from '@app/shared';

export interface CreateAttendancePayload {
  employeeId: number;
  photoUrl: string;
  notes?: string;
}

export interface MyAttendanceQueryPayload {
  employeeId: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface AttendanceQueryPayload {
  search?: string;
  department?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

const ATTENDANCE_INCLUDE = {
  employee: {
    select: {
      id: true,
      employeeCode: true,
      fullName: true,
      department: true,
      position: true,
      status: true,
    },
  },
} satisfies Prisma.AttendanceInclude;

function toDateOnly(dateInput?: string): Date {
  if (dateInput) {
    const parsed = new Date(`${dateInput.slice(0, 10)}T00:00:00.000Z`);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed;
    }
  }
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return new Date(`${yyyy}-${mm}-${dd}T00:00:00.000Z`);
}

function buildDateFilter(date?: string, startDate?: string, endDate?: string): Prisma.DateTimeFilter | undefined {
  if (date) {
    return { equals: toDateOnly(date) };
  }
  const filter: Prisma.DateTimeFilter = {};
  if (startDate) filter.gte = toDateOnly(startDate);
  if (endDate) filter.lte = toDateOnly(endDate);
  return Object.keys(filter).length > 0 ? filter : undefined;
}

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async create(payload: CreateAttendancePayload) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: payload.employeeId },
    });

    if (!employee) {
      throwRpcError(HttpStatus.NOT_FOUND, 'Data karyawan tidak ditemukan.');
    }

    if (employee.status !== EmployeeStatus.ACTIVE) {
      throwRpcError(HttpStatus.FORBIDDEN, 'Karyawan tidak aktif tidak dapat melakukan absensi.');
    }

    const today = toDateOnly();

    const existing = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId: payload.employeeId,
          attendanceDate: today,
        },
      },
    });

    if (existing) {
      throwRpcError(HttpStatus.CONFLICT, 'Anda sudah melakukan absensi WFH hari ini.');
    }

    return this.prisma.attendance.create({
      data: {
        employeeId: payload.employeeId,
        attendanceDate: today,
        clockInAt: new Date(),
        photoUrl: payload.photoUrl,
        notes: payload.notes?.trim() || null,
      },
      include: ATTENDANCE_INCLUDE,
    });
  }

  async getTodayStatus(employeeId: number) {
    const today = toDateOnly();
    const attendance = await this.prisma.attendance.findUnique({
      where: {
        employeeId_attendanceDate: {
          employeeId,
          attendanceDate: today,
        },
      },
      include: ATTENDANCE_INCLUDE,
    });

    return {
      hasClockedIn: Boolean(attendance),
      date: today.toISOString().slice(0, 10),
      attendance,
    };
  }

  async findMy(query: MyAttendanceQueryPayload) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {
      employeeId: query.employeeId,
    };

    const dateFilter = buildDateFilter(undefined, query.startDate, query.endDate);
    if (dateFilter) {
      where.attendanceDate = dateFilter;
    }

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: ATTENDANCE_INCLUDE,
        orderBy: { attendanceDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
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

  async findAll(query: AttendanceQueryPayload) {
    const page = Math.max(1, Number(query.page ?? 1));
    const limit = Math.min(100, Math.max(1, Number(query.limit ?? 10)));
    const skip = (page - 1) * limit;

    const where: Prisma.AttendanceWhereInput = {};

    const dateFilter = buildDateFilter(query.date, query.startDate, query.endDate);
    if (dateFilter) {
      where.attendanceDate = dateFilter;
    }

    if (query.department) {
      where.employee = { department: query.department };
    }

    if (query.search?.trim()) {
      const keyword = query.search.trim();
      where.OR = [
        { employee: { fullName: { contains: keyword } } },
        { employee: { employeeCode: { contains: keyword } } },
        { employee: { position: { contains: keyword } } },
        { notes: { contains: keyword } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.attendance.findMany({
        where,
        include: ATTENDANCE_INCLUDE,
        orderBy: { clockInAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.attendance.count({ where }),
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
}
