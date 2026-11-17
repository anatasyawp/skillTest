import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { EMPLOYEE_PATTERNS } from '@app/shared';
import {
  CreateEmployeePayload,
  EmployeeQueryPayload,
  EmployeeService,
  UpdateEmployeePayload,
} from './employee.service';

@Controller()
export class EmployeeController {
  constructor(private readonly employeeService: EmployeeService) {}

  @MessagePattern(EMPLOYEE_PATTERNS.FIND_ALL)
  findAll(@Payload() query: EmployeeQueryPayload) {
    return this.employeeService.findAll(query);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.FIND_ONE)
  findOne(@Payload() payload: { id: number }) {
    return this.employeeService.findOne(payload.id);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.CREATE)
  create(@Payload() payload: CreateEmployeePayload) {
    return this.employeeService.create(payload);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.UPDATE)
  update(@Payload() payload: { id: number; data: UpdateEmployeePayload }) {
    return this.employeeService.update(payload.id, payload.data);
  }

  @MessagePattern(EMPLOYEE_PATTERNS.DELETE)
  remove(@Payload() payload: { id: number }) {
    return this.employeeService.remove(payload.id);
  }
}
