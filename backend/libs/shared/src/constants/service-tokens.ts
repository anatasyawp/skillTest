export const SERVICE_TOKENS = {
  AUTH_SERVICE: 'AUTH_SERVICE',
  EMPLOYEE_SERVICE: 'EMPLOYEE_SERVICE',
  ATTENDANCE_SERVICE: 'ATTENDANCE_SERVICE',
} as const;

export const AUTH_PATTERNS = {
  LOGIN: 'auth.login',
  PROFILE: 'auth.profile',
} as const;

export const EMPLOYEE_PATTERNS = {
  FIND_ALL: 'employee.findAll',
  FIND_ONE: 'employee.findOne',
  CREATE: 'employee.create',
  UPDATE: 'employee.update',
  DELETE: 'employee.delete',
} as const;

export const ATTENDANCE_PATTERNS = {
  CREATE: 'attendance.create',
  FIND_MY: 'attendance.findMy',
  FIND_ALL: 'attendance.findAll',
  TODAY_STATUS: 'attendance.todayStatus',
} as const;
