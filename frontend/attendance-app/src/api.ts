const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api';
export const ASSET_BASE_URL = import.meta.env.VITE_ASSET_BASE_URL ?? 'http://localhost:3000';
export const COMPANY_NAME = import.meta.env.VITE_COMPANY_NAME ?? 'DEXAsync';

export type Role = 'EMPLOYEE' | 'HRD_ADMIN';
export type EmployeeStatus = 'ACTIVE' | 'INACTIVE';

export interface EmployeeProfile {
  id: number;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  phone: string | null;
  status: EmployeeStatus;
}

export interface EmployeeItem {
  id: number;
  userId: number;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  phone: string | null;
  status: EmployeeStatus;
  createdAt: string;
  updatedAt: string;
  user: {
    id: number;
    email: string;
    role: Role;
    isActive: boolean;
  };
}

export interface AuthUser {
  id: number;
  email: string;
  role: Role;
  employee: EmployeeProfile | null;
}

export interface AttendanceItem {
  id: number;
  employeeId: number;
  attendanceDate: string;
  clockInAt: string;
  photoUrl: string;
  notes: string | null;
  createdAt: string;
  employee?: {
    id: number;
    employeeCode: string;
    fullName: string;
    department: string;
    position: string;
    status: EmployeeStatus;
  };
}

export interface TodayStatusResponse {
  hasClockedIn: boolean;
  date: string;
  attendance: AttendanceItem | null;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface EmployeePayload {
  email: string;
  password?: string;
  role?: Role;
  employeeCode: string;
  fullName: string;
  department: string;
  position: string;
  phone?: string;
  status?: EmployeeStatus;
}

const TOKEN_KEY = 'wfh_app_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  if (!(options.body instanceof FormData) && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && (Array.isArray(data.message) ? data.message[0] : data.message)) ||
      `Permintaan gagal (${res.status})`;
    throw new Error(message);
  }

  return data as T;
}

export async function login(
  email: string,
  password: string,
): Promise<{ accessToken: string; user: AuthUser }> {
  clearToken();
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function fetchProfile(): Promise<AuthUser> {
  return request('/auth/profile');
}

export async function fetchTodayStatus(): Promise<TodayStatusResponse> {
  return request('/attendances/today');
}

export async function submitCheckIn(photo: File, notes: string): Promise<AttendanceItem> {
  const formData = new FormData();
  formData.append('photo', photo);
  if (notes.trim()) {
    formData.append('notes', notes.trim());
  }
  return request('/attendances/check-in', {
    method: 'POST',
    body: formData,
  });
}

export async function fetchMyAttendances(params: {
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AttendanceItem>> {
  const qs = new URLSearchParams();
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return request(`/attendances/my${query ? `?${query}` : ''}`);
}

export async function fetchEmployees(params: {
  search?: string;
  department?: string;
  status?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<EmployeeItem>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.department) qs.set('department', params.department);
  if (params.status) qs.set('status', params.status);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return request(`/employees${query ? `?${query}` : ''}`);
}

export async function createEmployee(payload: EmployeePayload): Promise<EmployeeItem> {
  return request('/employees', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function updateEmployee(
  id: number,
  payload: Partial<EmployeePayload>,
): Promise<EmployeeItem> {
  return request(`/employees/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function deleteEmployee(id: number): Promise<{ deleted: boolean; id: number }> {
  return request(`/employees/${id}`, {
    method: 'DELETE',
  });
}

export async function fetchAttendances(params: {
  search?: string;
  department?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}): Promise<PaginatedResponse<AttendanceItem>> {
  const qs = new URLSearchParams();
  if (params.search) qs.set('search', params.search);
  if (params.department) qs.set('department', params.department);
  if (params.date) qs.set('date', params.date);
  if (params.startDate) qs.set('startDate', params.startDate);
  if (params.endDate) qs.set('endDate', params.endDate);
  if (params.page) qs.set('page', String(params.page));
  if (params.limit) qs.set('limit', String(params.limit));
  const query = qs.toString();
  return request(`/attendances${query ? `?${query}` : ''}`);
}
