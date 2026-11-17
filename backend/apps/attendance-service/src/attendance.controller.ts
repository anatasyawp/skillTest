import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { ATTENDANCE_PATTERNS } from '@app/shared';
import {
  AttendanceQueryPayload,
  AttendanceService,
  CreateAttendancePayload,
  MyAttendanceQueryPayload,
} from './attendance.service';

@Controller()
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @MessagePattern(ATTENDANCE_PATTERNS.CREATE)
  create(@Payload() payload: CreateAttendancePayload) {
    return this.attendanceService.create(payload);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.TODAY_STATUS)
  todayStatus(@Payload() payload: { employeeId: number }) {
    return this.attendanceService.getTodayStatus(payload.employeeId);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.FIND_MY)
  findMy(@Payload() query: MyAttendanceQueryPayload) {
    return this.attendanceService.findMy(query);
  }

  @MessagePattern(ATTENDANCE_PATTERNS.FIND_ALL)
  findAll(@Payload() query: AttendanceQueryPayload) {
    return this.attendanceService.findAll(query);
  }
}
