import { FC, FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  FileImage,
  FileText,
  Filter,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import {
  ASSET_BASE_URL,
  AttendanceItem,
  AuthUser,
  createEmployee,
  deleteEmployee,
  EmployeeItem,
  EmployeePayload,
  EmployeeStatus,
  fetchAttendances,
  fetchEmployees,
  PaginatedResponse,
  Role,
  updateEmployee,
} from '../api';
import { formatDateId, formatTimeId } from '../utils/date';
import { CustomDropdown } from './common/CustomDropdown';

const DEPARTMENTS = ['Engineering', 'Product', 'Human Resources', 'Finance', 'Operations'];

interface MonitoringSectionProps {
  user?: AuthUser | null;
  mode: 'employees' | 'attendances';
  onTabChange?: (tab: 'employees' | 'attendances') => void;
  onPreviewPhoto: (url: string) => void;
}

export const MonitoringSection: FC<MonitoringSectionProps> = ({
  user,
  mode,
  onTabChange,
  onPreviewPhoto,
}) => {
  const [now] = useState(() => new Date());

  // 1. Dashboard Summary Metrics
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [alreadyAttendedToday, setAlreadyAttendedToday] = useState(0);
  const [notAttendedToday, setNotAttendedToday] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // 2. Employee Management State
  const [employees, setEmployees] = useState<PaginatedResponse<EmployeeItem> | null>(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empStatus, setEmpStatus] = useState('');
  const [empPage, setEmpPage] = useState(1);

  // Add / Edit Modal State
  const [empModalOpen, setEmpModalOpen] = useState(false);
  const [editingEmp, setEditingEmp] = useState<EmployeeItem | null>(null);
  const [formState, setFormState] = useState<EmployeePayload>({
    email: '',
    password: '',
    role: 'EMPLOYEE',
    employeeCode: '',
    fullName: '',
    department: 'Engineering',
    position: '',
    phone: '',
    status: 'ACTIVE',
  });
  const [formSaving, setFormSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Modal State
  const [deletingEmp, setDeletingEmp] = useState<EmployeeItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // 3. Attendance Monitoring State (View-Only)
  const [attendances, setAttendances] = useState<PaginatedResponse<AttendanceItem> | null>(null);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [attSearch, setAttSearch] = useState('');
  const [attDepartment, setAttDepartment] = useState('');
  const [attDate, setAttDate] = useState('');
  const [attPage, setAttPage] = useState(1);

  // View Detail Modal State
  const [selectedDetail, setSelectedDetail] = useState<AttendanceItem | null>(null);

  // Escape key closes open modals
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmpModalOpen(false);
        setDeletingEmp(null);
        setSelectedDetail(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  // Fetch summary cards data
  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const todayStr = new Date().toISOString().split('T')[0];
      const [empRes, todayAttRes, allAttRes] = await Promise.all([
        fetchEmployees({ limit: 1 }),
        fetchAttendances({ date: todayStr, limit: 1 }),
        fetchAttendances({ limit: 1 }),
      ]);

      const totalEmp = empRes.meta.total;
      const todayAtt = todayAttRes.meta.total;
      const allAtt = allAttRes.meta.total;

      setTotalEmployees(totalEmp);
      setAlreadyAttendedToday(todayAtt);
      setNotAttendedToday(Math.max(0, totalEmp - todayAtt));
      setTotalSubmissions(allAtt);
    } catch {
      // Keep existing metric state on network hiccup
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  // Fetch employees
  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    setEmpError(null);
    try {
      const data = await fetchEmployees({
        search: empSearch.trim() || undefined,
        department: empDepartment || undefined,
        status: empStatus || undefined,
        page: empPage,
        limit: 10,
      });
      setEmployees(data);
    } catch (err) {
      setEmpError(err instanceof Error ? err.message : 'Gagal memuat data karyawan.');
    } finally {
      setEmpLoading(false);
    }
  }, [empSearch, empDepartment, empStatus, empPage]);

  // Fetch attendances
  const loadAttendances = useCallback(async () => {
    setAttLoading(true);
    setAttError(null);
    try {
      const data = await fetchAttendances({
        search: attSearch.trim() || undefined,
        department: attDepartment || undefined,
        date: attDate || undefined,
        page: attPage,
        limit: 10,
      });
      setAttendances(data);
    } catch (err) {
      setAttError(err instanceof Error ? err.message : 'Gagal memuat data absensi WFH.');
    } finally {
      setAttLoading(false);
    }
  }, [attSearch, attDepartment, attDate, attPage]);

  // Sync data on tab change
  useEffect(() => {
    loadMetrics();
    if (mode === 'employees') {
      loadEmployees();
    } else {
      loadAttendances();
    }
  }, [mode, loadMetrics, loadEmployees, loadAttendances]);

  // Handlers for Employee CRUD
  const openAddEmployeeModal = () => {
    setEditingEmp(null);
    setFormError(null);
    setFormState({
      email: '',
      password: '',
      role: 'EMPLOYEE',
      employeeCode: '',
      fullName: '',
      department: 'Engineering',
      position: '',
      phone: '',
      status: 'ACTIVE',
    });
    setEmpModalOpen(true);
  };

  const openEditEmployeeModal = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setFormError(null);
    setFormState({
      email: emp.user.email,
      password: '',
      role: emp.user.role,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      department: emp.department,
      position: emp.position,
      phone: emp.phone ?? '',
      status: emp.status,
    });
    setEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setFormSaving(true);
    setFormError(null);
    try {
      if (editingEmp) {
        const payload: Partial<EmployeePayload> = {
          email: formState.email.trim(),
          role: formState.role,
          employeeCode: formState.employeeCode.trim(),
          fullName: formState.fullName.trim(),
          department: formState.department,
          position: formState.position.trim(),
          phone: formState.phone?.trim(),
          status: formState.status,
        };
        if (formState.password?.trim()) {
          payload.password = formState.password.trim();
        }
        await updateEmployee(editingEmp.id, payload);
      } else {
        await createEmployee({
          ...formState,
          email: formState.email.trim(),
          fullName: formState.fullName.trim(),
          employeeCode: formState.employeeCode.trim(),
          position: formState.position.trim(),
        });
      }
      setEmpModalOpen(false);
      await loadEmployees();
      await loadMetrics();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data karyawan.');
    } finally {
      setFormSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingEmp) return;
    setDeleteLoading(true);
    setDeleteError(null);
    try {
      await deleteEmployee(deletingEmp.id);
      setDeletingEmp(null);
      await loadEmployees();
      await loadMetrics();
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus karyawan.');
    } finally {
      setDeleteLoading(false);
    }
  };

  // Helper to refresh all metrics and current table
  const handleRefreshAll = () => {
    loadMetrics();
    if (mode === 'employees') {
      loadEmployees();
    } else {
      loadAttendances();
    }
  };

  // Dynamic admin greeting name
  const adminName = user?.employee?.fullName ?? user?.email?.split('@')[0] ?? 'Admin DEXA';
  const formattedToday = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Attendance rate calculation
  const attendanceRate = totalEmployees > 0 ? Math.round((alreadyAttendedToday / totalEmployees) * 100) : 0;

  // Active filters count
  const hasEmpFilters = Boolean(empSearch || empDepartment || empStatus);
  const hasAttFilters = Boolean(attSearch || attDepartment || attDate);

  return (
    <div className="space-y-6">
      {/* 1. COMPACT PAGE HEADER: Greeting, Context & Primary Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#800020]" />
            <span>Admin Central • DEXAsync</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hi, {adminName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Pusat monitoring absensi dan manajemen data karyawan DEXA ·{' '}
            <span className="font-medium text-slate-700">{formattedToday}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleRefreshAll}
            disabled={metricsLoading || empLoading || attLoading}
            className="inline-flex items-center gap-1.5 min-h-[38px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            title="Segarkan data terbaru"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${
                metricsLoading || empLoading || attLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>

          {mode === 'employees' && (
            <button
              type="button"
              onClick={openAddEmployeeModal}
              className="inline-flex items-center gap-1.5 min-h-[38px] px-4 rounded-xl bg-[#800020] hover:bg-[#68001A] text-xs font-bold text-white shadow-sm shadow-[#800020]/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Karyawan</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. SUMMARY STATISTICS: Minimalist Enterprise Metrics Strip with Subtle Gradients & Animations */}
      <section aria-label="Ringkasan Statistik Kehadiran" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Total Karyawan */}
        <div className="card-interactive relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-rose-50/40 p-4 sm:p-5 shadow-2xs group hover:border-[#800020]/30">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#800020] via-[#DC2626] to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Karyawan
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Users className="w-4 h-4 text-slate-500" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {metricsLoading ? '—' : totalEmployees}
            </span>
            <span className="text-[11px] font-medium text-slate-400">orang</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Seluruh entitas aktif DEXA
          </p>
        </div>

        {/* Metric 2: Sudah Absen Hari Ini */}
        <div className="card-interactive relative overflow-hidden rounded-2xl border border-emerald-200/90 bg-gradient-to-br from-white via-white to-emerald-50/50 p-4 sm:p-5 shadow-2xs group hover:border-emerald-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-500 via-emerald-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
              Sudah Absen
            </span>
            <div className="h-8 w-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-700 font-mono tracking-tight">
              {metricsLoading ? '—' : alreadyAttendedToday}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100/80 text-emerald-800 border border-emerald-200 font-mono">
              {attendanceRate}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Presensi selfie valid hari ini
          </p>
        </div>

        {/* Metric 3: Belum Absen Hari Ini */}
        <div className="card-interactive relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-amber-50/40 p-4 sm:p-5 shadow-2xs group hover:border-amber-300">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-amber-300 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
              Belum Absen
            </span>
            <div className="h-8 w-8 rounded-xl bg-amber-100/70 text-amber-600 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {metricsLoading ? '—' : notAttendedToday}
            </span>
            <span className="text-[11px] font-medium text-slate-400">karyawan</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Menunggu submission WFH
          </p>
        </div>

        {/* Metric 4: Total Submission Akumulasi */}
        <div className="card-interactive relative overflow-hidden rounded-2xl border border-slate-200/90 bg-gradient-to-br from-white via-white to-purple-50/30 p-4 sm:p-5 shadow-2xs group hover:border-[#800020]/30">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#800020] via-purple-400 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Log WFH
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#800020]/10 text-[#800020] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight">
              {metricsLoading ? '—' : totalSubmissions}
            </span>
            <span className="text-[11px] font-medium text-slate-400">riwayat</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500 truncate">
            Akumulasi submission terverifikasi
          </p>
        </div>
      </section>

      {/* 3. MAIN WORKSPACE CONTAINER: Unified Clean Enterprise Card */}
      <section className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Module Sub-Header & Segmented Control */}
        <div className="p-4 sm:px-6 sm:py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          {/* Segmented Tab Switcher */}
          <div className="inline-flex items-center p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => onTabChange?.('employees')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'employees'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-[#800020]" />
              <span>Data Karyawan</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
                {totalEmployees}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onTabChange?.('attendances')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                mode === 'attendances'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarCheck2 className="w-3.5 h-3.5 text-[#800020]" />
              <span>Monitoring Absensi</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-100 text-slate-600">
                {totalSubmissions}
              </span>
            </button>
          </div>

          {/* Module Mode Indicator Tag */}
          <div className="text-xs text-slate-500 flex items-center gap-2 font-mono">
            {mode === 'employees' ? (
              <span>Kelola NIK, Departemen &amp; Hak Akses</span>
            ) : (
              <span className="inline-flex items-center gap-1 text-slate-600">
                <Lock className="w-3 h-3 text-[#800020]" />
                <span>Audit Trail (View Only)</span>
              </span>
            )}
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="p-4 sm:px-6 bg-slate-50/50 border-b border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
            {/* Search Input */}
            <div className="sm:col-span-5 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={mode === 'employees' ? empSearch : attSearch}
                onChange={(e) => {
                  if (mode === 'employees') {
                    setEmpSearch(e.target.value);
                    setEmpPage(1);
                  } else {
                    setAttSearch(e.target.value);
                    setAttPage(1);
                  }
                }}
                placeholder={
                  mode === 'employees'
                    ? 'Cari nama, NIK/NIP, email, jabatan...'
                    : 'Cari nama karyawan atau catatan presensi...'
                }
                className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white pl-9 pr-8 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none shadow-2xs"
              />
              {(mode === 'employees' ? empSearch : attSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'employees') {
                      setEmpSearch('');
                      setEmpPage(1);
                    } else {
                      setAttSearch('');
                      setAttPage(1);
                    }
                  }}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Department Filter Dropdown (Custom UI Dropdown) */}
            <div className="sm:col-span-3">
              <CustomDropdown
                value={mode === 'employees' ? empDepartment : attDepartment}
                onChange={(val) => {
                  if (mode === 'employees') {
                    setEmpDepartment(val);
                    setEmpPage(1);
                  } else {
                    setAttDepartment(val);
                    setAttPage(1);
                  }
                }}
                placeholder="Semua Departemen"
                ariaLabel="Filter Departemen"
                options={[
                  { value: '', label: 'Semua Departemen' },
                  ...DEPARTMENTS.map((dept) => ({ value: dept, label: dept })),
                ]}
              />
            </div>

            {/* Status Filter (Employee Mode) OR Date Filter (Attendance Mode) */}
            <div className="sm:col-span-3">
              {mode === 'employees' ? (
                <CustomDropdown
                  value={empStatus}
                  onChange={(val) => {
                    setEmpStatus(val);
                    setEmpPage(1);
                  }}
                  placeholder="Semua Status"
                  ariaLabel="Filter Status Karyawan"
                  options={[
                    { value: '', label: 'Semua Status' },
                    { value: 'ACTIVE', label: 'Status: ACTIVE' },
                    { value: 'INACTIVE', label: 'Status: INACTIVE' },
                  ]}
                />
              ) : (
                <input
                  type="date"
                  value={attDate}
                  onChange={(e) => {
                    setAttDate(e.target.value);
                    setAttPage(1);
                  }}
                  aria-label="Filter Tanggal Absensi"
                  className="w-full min-h-[38px] rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium text-slate-800 hover:border-[#800020]/40 focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/15 focus:outline-none shadow-2xs transition-all cursor-pointer"
                />
              )}
            </div>

            {/* Clear Filter Shortcut */}
            <div className="sm:col-span-1 flex items-center justify-end">
              {(mode === 'employees' ? hasEmpFilters : hasAttFilters) && (
                <button
                  type="button"
                  onClick={() => {
                    if (mode === 'employees') {
                      setEmpSearch('');
                      setEmpDepartment('');
                      setEmpStatus('');
                      setEmpPage(1);
                    } else {
                      setAttSearch('');
                      setAttDepartment('');
                      setAttDate('');
                      setAttPage(1);
                    }
                  }}
                  className="text-xs text-[#800020] hover:text-[#DC2626] font-semibold whitespace-nowrap cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 4. DATA TABLE AREA */}
        {mode === 'employees' ? (
          /* ================= MODULE: EMPLOYEE TABLE ================= */
          <div>
            {empLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
                <span>Memuat data karyawan DEXA...</span>
              </div>
            ) : empError ? (
              <div className="m-6 p-4 rounded-xl border border-red-200 bg-red-50/80 flex items-center justify-between text-xs text-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{empError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadEmployees}
                  className="px-3 py-1 rounded-lg border border-red-200 bg-white font-bold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            ) : !employees || employees.items.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">
                <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Tidak ada data karyawan ditemukan</p>
                <p className="mt-0.5 text-slate-400">
                  Coba ubah kata kunci pencarian atau sesuaikan filter di atas.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        <th className="py-3 px-4 sm:px-6">NIK / NIP</th>
                        <th className="py-3 px-4 sm:px-6">Nama &amp; Email</th>
                        <th className="py-3 px-4 sm:px-6">Departemen</th>
                        <th className="py-3 px-4 sm:px-6">Jabatan</th>
                        <th className="py-3 px-4 sm:px-6">Role</th>
                        <th className="py-3 px-4 sm:px-6">Status</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {employees.items.map((emp) => {
                        const empInitials = emp.fullName
                          .split(' ')
                          .map((n) => n[0])
                          .slice(0, 2)
                          .join('')
                          .toUpperCase();

                        return (
                          <tr key={emp.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-slate-900">
                              {emp.employeeCode}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0">
                                  {empInitials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">{emp.fullName}</p>
                                  <p className="text-[11px] text-slate-500 font-mono truncate">{emp.user.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600">
                              {emp.department}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600">
                              {emp.position}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-semibold ${
                                  emp.user.role === 'HRD_ADMIN'
                                    ? 'bg-[#800020]/10 text-[#800020] border border-[#800020]/20'
                                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                                }`}
                              >
                                {emp.user.role === 'HRD_ADMIN' && <ShieldCheck className="w-3 h-3" />}
                                {emp.user.role}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                              {emp.status === 'ACTIVE' ? (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  ACTIVE
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
                                  <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                                  INACTIVE
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  type="button"
                                  onClick={() => openEditEmployeeModal(emp)}
                                  aria-label={`Edit ${emp.fullName}`}
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#800020] transition-colors cursor-pointer shadow-2xs"
                                  title="Edit data karyawan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDeleteError(null);
                                    setDeletingEmp(emp);
                                  }}
                                  aria-label={`Hapus ${emp.fullName}`}
                                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white hover:bg-red-50 hover:border-red-200 text-slate-700 hover:text-red-600 transition-colors cursor-pointer shadow-2xs"
                                  title="Hapus karyawan"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {employees.meta.totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Halaman <strong className="text-slate-900">{employees.meta.page}</strong> dari{' '}
                      <strong className="text-slate-900">{employees.meta.totalPages}</strong> ({employees.meta.total} karyawan)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={empPage <= 1}
                        onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer shadow-2xs"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={empPage >= employees.meta.totalPages}
                        onClick={() => setEmpPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer shadow-2xs"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        ) : (
          /* ================= MODULE: ATTENDANCE MONITORING TABLE (VIEW ONLY) ================= */
          <div>
            {attLoading ? (
              <div className="py-20 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-500">
                <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
                <span>Memuat log absensi WFH karyawan...</span>
              </div>
            ) : attError ? (
              <div className="m-6 p-4 rounded-xl border border-red-200 bg-red-50/80 flex items-center justify-between text-xs text-red-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{attError}</span>
                </div>
                <button
                  type="button"
                  onClick={loadAttendances}
                  className="px-3 py-1 rounded-lg border border-red-200 bg-white font-bold text-red-700 hover:bg-red-50 cursor-pointer"
                >
                  Coba Lagi
                </button>
              </div>
            ) : !attendances || attendances.items.length === 0 ? (
              <div className="py-20 text-center text-xs text-slate-500">
                <CalendarCheck2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">Belum ada riwayat presensi yang sesuai</p>
                <p className="mt-0.5 text-slate-400">
                  Silakan sesuaikan tanggal atau departemen pada filter di atas.
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-semibold tracking-wider text-slate-500 uppercase">
                        <th className="py-3 px-4 sm:px-6">Karyawan</th>
                        <th className="py-3 px-4 sm:px-6">Departemen</th>
                        <th className="py-3 px-4 sm:px-6">Tanggal</th>
                        <th className="py-3 px-4 sm:px-6">Jam Masuk</th>
                        <th className="py-3 px-4 sm:px-6">Status</th>
                        <th className="py-3 px-4 sm:px-6">Foto Bukti</th>
                        <th className="py-3 px-4 sm:px-6 text-right">Detail</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {attendances.items.map((item) => {
                        const empInitials = item.employee?.fullName
                          ? item.employee.fullName
                              .split(' ')
                              .map((n) => n[0])
                              .slice(0, 2)
                              .join('')
                              .toUpperCase()
                          : 'WF';

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                            <td className="py-3.5 px-4 sm:px-6">
                              <div className="flex items-center gap-3">
                                <div className="h-8 w-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-700 shrink-0 font-mono">
                                  {empInitials}
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-slate-900 truncate">
                                    {item.employee?.fullName ?? '-'}
                                  </p>
                                  <p className="text-[11px] font-mono text-slate-500 truncate">
                                    {item.employee?.employeeCode ?? '-'} · {item.employee?.position ?? '-'}
                                  </p>
                                </div>
                              </div>
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-600">
                              {item.employee?.department ?? '-'}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap text-slate-900 font-medium">
                              {formatDateId(item.attendanceDate)}
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap font-mono font-bold text-emerald-700">
                              {formatTimeId(item.clockInAt)} WIB
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                              <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                Verified WFH
                              </span>
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                                className="relative h-9 w-9 rounded-lg overflow-hidden border border-slate-200 hover:border-[#800020] transition-colors group cursor-pointer shadow-2xs"
                                title="Klik untuk pratinjau foto penuh"
                              >
                                <img
                                  src={`${ASSET_BASE_URL}${item.photoUrl}`}
                                  alt="Selfie WFH"
                                  className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                                />
                              </button>
                            </td>

                            <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => setSelectedDetail(item)}
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 hover:text-[#800020] font-semibold text-xs shadow-2xs transition-colors cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5 text-[#800020]" />
                                <span>Detail</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Pagination Controls */}
                {attendances.meta.totalPages > 1 && (
                  <div className="px-4 sm:px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Halaman <strong className="text-slate-900">{attendances.meta.page}</strong> dari{' '}
                      <strong className="text-slate-900">{attendances.meta.totalPages}</strong> ({attendances.meta.total} absensi)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        disabled={attPage <= 1}
                        onClick={() => setAttPage((p) => Math.max(1, p - 1))}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer shadow-2xs"
                      >
                        Sebelumnya
                      </button>
                      <button
                        type="button"
                        disabled={attPage >= attendances.meta.totalPages}
                        onClick={() => setAttPage((p) => p + 1)}
                        className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 font-semibold text-slate-700 cursor-pointer shadow-2xs"
                      >
                        Berikutnya
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </section>

      {/* 5. VIEW DETAIL ATTENDANCE MODAL (AUDIT TRAIL, VIEW-ONLY) */}
      {selectedDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detail Submission Presensi Karyawan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 shadow-xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#800020]" />
                <h3 className="text-sm font-bold text-slate-900">Detail Submission Presensi</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                aria-label="Tutup modal"
                className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-3.5">
              {/* Employee Information */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-slate-900 truncate">
                    {selectedDetail.employee?.fullName ?? 'Karyawan'}
                  </h4>
                  <p className="text-xs text-slate-500 font-mono mt-0.5 truncate">
                    {selectedDetail.employee?.employeeCode} · {selectedDetail.employee?.department} · {selectedDetail.employee?.position}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-3 h-3" />
                  Verified
                </span>
              </div>

              {/* Timestamp & Date */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Tanggal Presensi
                  </span>
                  <p className="text-xs font-bold text-slate-900 mt-0.5">
                    {formatDateId(selectedDetail.attendanceDate, true)}
                  </p>
                </div>
                <div className="p-3 rounded-xl border border-slate-200 bg-white">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Waktu Check-In
                  </span>
                  <p className="text-xs font-bold font-mono text-emerald-700 mt-0.5">
                    {formatTimeId(selectedDetail.clockInAt)} WIB
                  </p>
                </div>
              </div>

              {/* Notes */}
              <div className="p-3 rounded-xl border border-slate-200 bg-white">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-0.5">
                  Catatan Aktivitas / Rencana WFH
                </span>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {selectedDetail.notes || 'Tidak ada catatan yang dilampirkan oleh karyawan.'}
                </p>
              </div>

              {/* Photo Evidence */}
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Foto Bukti Selfie Presensi
                </span>
                <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-slate-50 max-h-56 flex items-center justify-center">
                  <img
                    src={`${ASSET_BASE_URL}${selectedDetail.photoUrl}`}
                    alt="Bukti Selfie WFH"
                    className="w-full max-h-56 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${selectedDetail.photoUrl}`)}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 text-white text-[11px] font-semibold backdrop-blur-xs cursor-pointer shadow-xs transition-colors"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Perbesar</span>
                  </button>
                </div>
              </div>

              {/* Audit Trail Notice */}
              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-[11px] text-slate-500">
                <Lock className="w-3.5 h-3.5 shrink-0 text-[#800020]" />
                <span>
                  Catatan ini bersifat <strong>View-Only</strong> untuk integritas data audit kepegawaian HRD.
                </span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. ADD / EDIT EMPLOYEE MODAL */}
      {empModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4 overflow-y-auto"
          onClick={() => setEmpModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl border border-slate-200 p-6 shadow-xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">
                  {editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Isi informasi profil karyawan DEXA di bawah ini.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEmpModalOpen(false)}
                aria-label="Tutup modal"
                className="h-7 w-7 inline-flex items-center justify-center rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50/80 px-3 py-2 text-xs text-red-700"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Kode Karyawan (NIK/NIP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.employeeCode}
                    onChange={(e) => setFormState({ ...formState, employeeCode: e.target.value })}
                    placeholder="EMP-004"
                    className="w-full min-h-[38px] rounded-xl border border-slate-200 px-3 text-xs font-mono text-slate-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    placeholder="Nama Karyawan"
                    className="w-full min-h-[38px] rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Perusahaan *
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="karyawan@company.local"
                    className="w-full min-h-[38px] rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {editingEmp ? 'Password Baru (Opsional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmp}
                    minLength={6}
                    value={formState.password ?? ''}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    placeholder={editingEmp ? 'Kosongkan jika tetap' : 'Min 6 karakter'}
                    className="w-full min-h-[38px] rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Departemen *
                  </label>
                  <CustomDropdown
                    value={formState.department}
                    onChange={(val) => setFormState({ ...formState, department: val })}
                    placeholder="Pilih Departemen"
                    options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Jabatan / Posisi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.position}
                    onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                    placeholder="Software Engineer"
                    className="w-full min-h-[38px] rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    value={formState.phone ?? ''}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="08..."
                    className="w-full min-h-[38px] rounded-xl border border-slate-200 px-3 text-xs text-slate-900 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Role RBAC</label>
                  <CustomDropdown
                    value={formState.role}
                    onChange={(val) => setFormState({ ...formState, role: val as Role })}
                    placeholder="Pilih Role"
                    options={[
                      { value: 'EMPLOYEE', label: 'EMPLOYEE' },
                      { value: 'HRD_ADMIN', label: 'HRD_ADMIN' },
                    ]}
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <CustomDropdown
                    value={formState.status}
                    onChange={(val) => setFormState({ ...formState, status: val as EmployeeStatus })}
                    placeholder="Pilih Status"
                    options={[
                      { value: 'ACTIVE', label: 'ACTIVE' },
                      { value: 'INACTIVE', label: 'INACTIVE' },
                    ]}
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="min-h-[36px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="min-h-[36px] px-4 rounded-xl bg-[#800020] hover:bg-[#68001A] disabled:opacity-60 text-white text-xs font-bold shadow-sm shadow-[#800020]/20 cursor-pointer"
                >
                  {formSaving ? 'Menyimpan...' : editingEmp ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 7. DELETE CONFIRMATION MODAL */}
      {deletingEmp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Hapus Karyawan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 backdrop-blur-xs p-4"
          onClick={() => setDeletingEmp(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-2xl border border-slate-200 p-6 shadow-xl animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <div className="h-9 w-9 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-600" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Hapus Data Karyawan?</h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Karyawan <strong className="text-slate-900">{deletingEmp.fullName}</strong> (
              <span className="font-mono font-semibold">{deletingEmp.employeeCode}</span>) beserta riwayat
              absensinya akan dihapus permanen.
            </p>

            {deleteError && (
              <div className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingEmp(null)}
                className="min-h-[36px] px-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-600 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="min-h-[36px] px-3.5 rounded-xl bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white text-xs font-bold shadow-xs cursor-pointer"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
