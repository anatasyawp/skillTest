import { FC, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  CalendarCheck2,
  CheckCircle2,
  Clock,
  Edit3,
  Eye,
  EyeOff,
  FileImage,
  FileText,
  LayoutGrid,
  List,
  Lock,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
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
import { CustomDatePicker } from './common/CustomDatePicker';
import { CustomDropdown } from './common/CustomDropdown';

const DEPARTMENTS = ['Engineering', 'Product', 'Human Resources', 'Finance', 'Operations'];

const DEPT_TINTS: Record<string, string> = {
  Engineering: 'bg-[#FBE8EC] text-[#800020] border-[#F2C8D2]',
  Product: 'bg-[#FBF2E6] text-[#7A3E06] border-[#F0D9BA]',
  'Human Resources': 'bg-[#F3EDF7] text-[#5B216E] border-[#DFCCE8]',
  Finance: 'bg-[#EAF5F1] text-[#0F5A45] border-[#C5E3D9]',
  Operations: 'bg-[#F2EFF0] text-[#3F2A30] border-[#DED6D9]',
};

interface MonitoringSectionProps {
  user?: AuthUser | null;
  mode: 'employees' | 'attendances';
  onTabChange?: (tab: 'employees' | 'attendances') => void;
  onPreviewPhoto: (url: string) => void;
  openQuickAdd?: boolean;
  onQuickAddConsumed?: () => void;
}

export const MonitoringSection: FC<MonitoringSectionProps> = ({
  user,
  mode,
  onTabChange,
  onPreviewPhoto,
  openQuickAdd = false,
  onQuickAddConsumed,
}) => {
  const [now] = useState(() => new Date());
  const [viewLayout, setViewLayout] = useState<'cards' | 'table'>('cards');

  // Summary Metrics (real API data)
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [notAttendedToday, setNotAttendedToday] = useState(0);
  const [totalSubmissions, setTotalSubmissions] = useState(0);
  const [metricsLoading, setMetricsLoading] = useState(false);

  // Employee Management State
  const [employees, setEmployees] = useState<PaginatedResponse<EmployeeItem> | null>(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empStatus, setEmpStatus] = useState('');
  const [empNotAttendedToday, setEmpNotAttendedToday] = useState(false);
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
  const [showModalPassword, setShowModalPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<'employeeCode' | 'fullName' | 'email' | 'password' | 'position' | 'phone', string>>
  >({});
  const [isTypingInModal, setIsTypingInModal] = useState(false);
  const [modalSaved, setModalSaved] = useState(false);
  const [modalErrorTick, setModalErrorTick] = useState(0);
  const typingTimerRef = useRef<number | null>(null);
  const saveCloseTimerRef = useRef<number | null>(null);

  // Delete Modal State
  const [deletingEmp, setDeletingEmp] = useState<EmployeeItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Attendance Monitoring State
  const [attendances, setAttendances] = useState<PaginatedResponse<AttendanceItem> | null>(null);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [attSearch, setAttSearch] = useState('');
  const [attDepartment, setAttDepartment] = useState('');
  const [attDate, setAttDate] = useState('');
  const [attPage, setAttPage] = useState(1);

  // Detail Modal State
  const [selectedDetail, setSelectedDetail] = useState<AttendanceItem | null>(null);

  const sanitizeDigits = (value: string, maxLength: number) =>
    value.replace(/\D/g, '').slice(0, maxLength);

  const triggerTypingPulse = useCallback(() => {
    setIsTypingInModal(true);
    if (typingTimerRef.current !== null) {
      window.clearTimeout(typingTimerRef.current);
    }
    typingTimerRef.current = window.setTimeout(() => {
      setIsTypingInModal(false);
    }, 650);
  }, []);

  useEffect(() => {
    return () => {
      if (typingTimerRef.current !== null) window.clearTimeout(typingTimerRef.current);
      if (saveCloseTimerRef.current !== null) window.clearTimeout(saveCloseTimerRef.current);
    };
  }, []);

  const isAnyModalOpen = empModalOpen || Boolean(deletingEmp) || Boolean(selectedDetail);

  useEffect(() => {
    if (!isAnyModalOpen) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [isAnyModalOpen]);

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

  const openAddEmployeeModal = useCallback(() => {
    setEditingEmp(null);
    setFormError(null);
    setFieldErrors({});
    setShowModalPassword(false);
    setIsTypingInModal(false);
    setModalSaved(false);
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
  }, []);

  useEffect(() => {
    if (openQuickAdd) {
      openAddEmployeeModal();
      onQuickAddConsumed?.();
    }
  }, [openQuickAdd, openAddEmployeeModal, onQuickAddConsumed]);

  const loadMetrics = useCallback(async () => {
    setMetricsLoading(true);
    try {
      const [empRes, notAttRes, allAttRes] = await Promise.all([
        fetchEmployees({ limit: 1 }),
        fetchEmployees({ notAttendedToday: true, limit: 1 }),
        fetchAttendances({ limit: 1 }),
      ]);

      setTotalEmployees(empRes.meta.total);
      setNotAttendedToday(notAttRes.meta.total);
      setTotalSubmissions(allAttRes.meta.total);
    } catch {
      // Keep previous metric values on transient network error
    } finally {
      setMetricsLoading(false);
    }
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    setEmpError(null);
    try {
      const data = await fetchEmployees({
        search: empSearch.trim() || undefined,
        department: empDepartment || undefined,
        status: empNotAttendedToday ? 'ACTIVE' : empStatus || undefined,
        notAttendedToday: empNotAttendedToday || undefined,
        page: empPage,
        limit: 9,
      });
      setEmployees(data);
    } catch (err) {
      setEmpError(err instanceof Error ? err.message : 'Gagal memuat data karyawan.');
    } finally {
      setEmpLoading(false);
    }
  }, [empSearch, empDepartment, empStatus, empNotAttendedToday, empPage]);

  const loadAttendances = useCallback(async () => {
    setAttLoading(true);
    setAttError(null);
    try {
      const data = await fetchAttendances({
        search: attSearch.trim() || undefined,
        department: attDepartment || undefined,
        date: attDate || undefined,
        page: attPage,
        limit: 9,
      });
      setAttendances(data);
    } catch (err) {
      setAttError(err instanceof Error ? err.message : 'Gagal memuat data absensi WFH.');
    } finally {
      setAttLoading(false);
    }
  }, [attSearch, attDepartment, attDate, attPage]);

  useEffect(() => {
    loadMetrics();
    if (mode === 'employees') {
      loadEmployees();
    } else {
      loadAttendances();
    }
  }, [mode, loadMetrics, loadEmployees, loadAttendances]);

  const openEditEmployeeModal = (emp: EmployeeItem) => {
    setEditingEmp(emp);
    setFormError(null);
    setFieldErrors({});
    setShowModalPassword(false);
    setIsTypingInModal(false);
    setModalSaved(false);
    setFormState({
      email: emp.user.email,
      password: '',
      role: emp.user.role,
      employeeCode: emp.employeeCode,
      fullName: emp.fullName,
      department: emp.department,
      position: emp.position,
      phone: sanitizeDigits(emp.phone ?? '', 15),
      status: emp.status,
    });
    setEmpModalOpen(true);
  };

  const handleSaveEmployee = async (e: FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedCode = formState.employeeCode.trim();
    const trimmedName = formState.fullName.trim();
    const trimmedEmail = formState.email.trim();
    const trimmedPosition = formState.position.trim();
    const trimmedPhone = sanitizeDigits(formState.phone ?? '', 15);
    const trimmedPassword = (formState.password ?? '').trim();

    const nextErrors: Partial<
      Record<'employeeCode' | 'fullName' | 'email' | 'password' | 'position' | 'phone', string>
    > = {};

    const isUnchangedLegacyCode =
      Boolean(editingEmp) && trimmedCode === editingEmp?.employeeCode && !/^\d{16}$/.test(trimmedCode);

    if (!trimmedName) {
      nextErrors.fullName = 'Nama lengkap wajib diisi.';
    }
    if (!isUnchangedLegacyCode && !/^\d{16}$/.test(trimmedCode)) {
      nextErrors.employeeCode = 'NIK harus terdiri dari tepat 16 digit angka.';
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = 'Masukkan alamat email yang valid.';
    }
    if (!editingEmp && trimmedPassword.length < 6) {
      nextErrors.password = 'Password minimal 6 karakter.';
    } else if (editingEmp && trimmedPassword.length > 0 && trimmedPassword.length < 6) {
      nextErrors.password = 'Password baru minimal 6 karakter.';
    }
    if (!trimmedPosition) {
      nextErrors.position = 'Jabatan wajib diisi.';
    }
    if (trimmedPhone && !/^\d{1,15}$/.test(trimmedPhone)) {
      nextErrors.phone = 'Nomor telepon hanya boleh angka (maks. 15 digit).';
    }

    if (Object.keys(nextErrors).length > 0) {
      setFieldErrors(nextErrors);
      setModalErrorTick((n) => n + 1);
      return;
    }

    setFieldErrors({});
    setFormSaving(true);
    try {
      if (editingEmp) {
        const payload: Partial<EmployeePayload> = {
          email: trimmedEmail,
          role: formState.role,
          fullName: trimmedName,
          department: formState.department,
          position: trimmedPosition,
          phone: trimmedPhone,
          status: formState.status,
        };
        if (!isUnchangedLegacyCode) {
          payload.employeeCode = trimmedCode;
        }
        if (trimmedPassword) {
          payload.password = trimmedPassword;
        }
        await updateEmployee(editingEmp.id, payload);
      } else {
        await createEmployee({
          ...formState,
          email: trimmedEmail,
          password: trimmedPassword,
          fullName: trimmedName,
          employeeCode: trimmedCode,
          position: trimmedPosition,
          phone: trimmedPhone || undefined,
        });
      }
      setModalSaved(true);
      await Promise.all([loadEmployees(), loadMetrics()]);
      if (saveCloseTimerRef.current !== null) {
        window.clearTimeout(saveCloseTimerRef.current);
      }
      saveCloseTimerRef.current = window.setTimeout(() => {
        setModalSaved(false);
        setEmpModalOpen(false);
      }, 650);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Gagal menyimpan data karyawan.');
      setModalErrorTick((n) => n + 1);
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

  const handleRefreshAll = () => {
    loadMetrics();
    if (mode === 'employees') {
      loadEmployees();
    } else {
      loadAttendances();
    }
  };

  const handleDepartmentQuickFilter = (dept: string) => {
    if (mode === 'employees') {
      setEmpDepartment((prev) => (prev === dept ? '' : dept));
      setEmpPage(1);
    } else {
      setAttDepartment((prev) => (prev === dept ? '' : dept));
      setAttPage(1);
    }
  };

  const activeDepartment = mode === 'employees' ? empDepartment : attDepartment;
  const adminName = user?.employee?.fullName ?? user?.email?.split('@')[0] ?? 'Admin';
  const formattedToday = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const hasEmpFilters = Boolean(empSearch || empDepartment || empStatus || empNotAttendedToday);
  const hasAttFilters = Boolean(attSearch || attDepartment || attDate);

  const hasModalErrors = Boolean(formError || Object.keys(fieldErrors).length > 0);
  const isModalFormReady = Boolean(
    formState.fullName.trim() &&
      (/^\d{16}$/.test(formState.employeeCode.trim()) ||
        (editingEmp && formState.employeeCode.trim() === editingEmp.employeeCode)) &&
      formState.position.trim() &&
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formState.email.trim()) &&
      (editingEmp || (formState.password ?? '').trim().length >= 6),
  );

  const modalMascotSrc = modalSaved || formSaving
    ? '/berhasil-dexo.png'
    : hasModalErrors
    ? '/gagal-dexo.png'
    : isTypingInModal
    ? '/pemberitahuan-dexo.png'
    : isModalFormReady
    ? '/terimakasih-dexo.png'
    : '/sapaan-dexo.png';

  const modalMascotAnim = modalSaved
    ? 'animate-dexo-celebrate'
    : formSaving
    ? 'animate-dexo-flap'
    : hasModalErrors
    ? 'animate-dexo-shake'
    : isTypingInModal
    ? 'animate-dexo-type'
    : isModalFormReady
    ? 'animate-dexo-hop'
    : '';

  const modalMascotHint = modalSaved
    ? 'Data karyawan berhasil disimpan!'
    : formSaving
    ? 'Menyimpan data karyawan...'
    : hasModalErrors
    ? 'Ada isian yang perlu diperiksa kembali.'
    : isTypingInModal
    ? 'DEXO ikut mencatat data yang kamu ketik...'
    : isModalFormReady
    ? 'Semua kolom wajib sudah lengkap, siap disimpan.'
    : editingEmp
    ? `Perbarui profil dan akses akun untuk ${editingEmp.fullName}.`
    : 'Lengkapi identitas, posisi, dan akun login karyawan.';

  return (
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-2rem)] gap-4 lg:gap-6">
      {/* LEFT WHITE COLUMN: Tactile Module & Quick Overview Tiles */}
      <aside className="w-full lg:w-[310px] xl:w-[340px] shrink-0 bg-white px-4 sm:px-6 lg:px-3 py-5 lg:py-3 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2A040A]">
            Halo, {adminName}
          </h1>
          <p className="text-sm text-[#634E53] mt-1">Pilih modul atau filter departemen.</p>
        </div>

        {/* 2x2 Tactile Requirement / Summary Tiles */}
        <div className="grid grid-cols-2 gap-3.5">
          {/* Tile 1: Data Karyawan */}
          <button
            type="button"
            onClick={() => {
              setEmpNotAttendedToday(false);
              setEmpPage(1);
              onTabChange?.('employees');
            }}
            className={`group rounded-3xl p-4 text-center flex flex-col items-center justify-center gap-2.5 border transition-colors cursor-pointer min-h-[136px] ${
              mode === 'employees' && !empNotAttendedToday
                ? 'bg-white border-[#F2C8D2] shadow-sm shadow-[#800020]/5'
                : 'bg-[#FAF8F9] border-[#F0EAEB] hover:border-[#E2D5D8] hover:bg-white'
            }`}
          >
            <div
              className={`h-13 w-13 rounded-full flex items-center justify-center transition-colors ${
                mode === 'employees' && !empNotAttendedToday
                  ? 'bg-[#2A040A] text-white'
                  : 'bg-[#F2ECEE] text-[#2A040A] group-hover:bg-[#FBE8EC] group-hover:text-[#800020]'
              }`}
            >
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2A040A]">Karyawan</p>
              <p className="text-xs font-mono-tabular text-[#634E53] mt-0.5">
                {metricsLoading ? '—' : `${totalEmployees} orang`}
              </p>
            </div>
          </button>

          {/* Tile 2: Monitoring Absensi */}
          <button
            type="button"
            onClick={() => {
              setEmpNotAttendedToday(false);
              onTabChange?.('attendances');
            }}
            className={`group rounded-3xl p-4 text-center flex flex-col items-center justify-center gap-2.5 border transition-colors cursor-pointer min-h-[136px] ${
              mode === 'attendances'
                ? 'bg-white border-[#F2C8D2] shadow-sm shadow-[#800020]/5'
                : 'bg-[#FAF8F9] border-[#F0EAEB] hover:border-[#E2D5D8] hover:bg-white'
            }`}
          >
            <div
              className={`h-13 w-13 rounded-full flex items-center justify-center transition-colors ${
                mode === 'attendances'
                  ? 'bg-[#2A040A] text-white'
                  : 'bg-[#F2ECEE] text-[#2A040A] group-hover:bg-[#FBE8EC] group-hover:text-[#800020]'
              }`}
            >
              <CalendarCheck2 className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[#2A040A]">Absensi WFH</p>
              <p className="text-xs font-mono-tabular text-[#634E53] mt-0.5">
                {metricsLoading ? '—' : `${totalSubmissions} log`}
              </p>
            </div>
          </button>

          {/* Tile 3: Belum Absen Hari Ini (Real filter: active employees with 0 attendance today) */}
          <button
            type="button"
            onClick={() => {
              if (mode === 'employees' && empNotAttendedToday) {
                setEmpNotAttendedToday(false);
              } else {
                setEmpNotAttendedToday(true);
                setEmpStatus('');
                onTabChange?.('employees');
              }
              setEmpPage(1);
            }}
            className={`col-span-2 group rounded-3xl px-5 py-4 flex items-center justify-between gap-3 border transition-colors cursor-pointer ${
              mode === 'employees' && empNotAttendedToday
                ? 'bg-white border-[#D97706] shadow-sm shadow-[#9A4D08]/10'
                : 'border-[#F0EAEB] bg-[#FAF8F9] hover:bg-white hover:border-[#F0D9BA]'
            }`}
          >
            <div className="flex items-center gap-3.5 min-w-0">
              <div
                className={`h-11 w-11 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                  mode === 'employees' && empNotAttendedToday
                    ? 'bg-[#2A040A] text-[#FBF2E6]'
                    : 'bg-[#FBF2E6] text-[#9A4D08]'
                }`}
              >
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-left min-w-0">
                <p className="text-sm font-bold text-[#2A040A]">Belum Absen Hari Ini</p>
                <p className="text-xs text-[#634E53] truncate">
                  {mode === 'employees' && empNotAttendedToday
                    ? 'Filter aktif · klik lagi untuk tampilkan semua'
                    : 'Klik untuk lihat yang belum check-in'}
                </p>
              </div>
            </div>
            <span className="text-sm font-bold font-mono-tabular text-[#9A4D08] shrink-0">
              {metricsLoading ? '—' : `${notAttendedToday} orang`}
            </span>
          </button>
        </div>

        {/* Quick Department Filter Pills (Tactile Category Selector) */}
        <div className="pt-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-[#2A040A]">Departemen</h2>
            {activeDepartment && (
              <button
                type="button"
                onClick={() => handleDepartmentQuickFilter(activeDepartment)}
                className="text-xs font-semibold text-[#800020] hover:underline cursor-pointer"
              >
                Semua
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {DEPARTMENTS.map((dept) => {
              const isSelected = activeDepartment === dept;
              const tint = DEPT_TINTS[dept] ?? 'bg-[#F2EFF0] text-[#2A040A] border-[#DED6D9]';
              return (
                <button
                  key={dept}
                  type="button"
                  onClick={() => handleDepartmentQuickFilter(dept)}
                  className={`min-h-[40px] px-3.5 py-2 rounded-2xl text-xs font-semibold border transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[#2A040A] text-white border-[#2A040A]'
                      : `${tint} hover:opacity-85`
                  }`}
                >
                  {dept}
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* RIGHT SOFT ALABASTER WORKSPACE CANVAS */}
      <section className="flex-1 min-w-0 bg-[#F7F4F5] lg:rounded-[32px] p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* Top Workspace Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2A040A] tracking-tight">
              {mode === 'employees'
                ? empNotAttendedToday
                  ? 'Belum Absen Hari Ini'
                  : 'Daftar Karyawan'
                : 'Log Absensi WFH'}
            </h2>
            <p className="text-xs sm:text-sm text-[#634E53] mt-0.5 flex items-center gap-2 flex-wrap">
              <span>{formattedToday}</span>
              {mode === 'attendances' && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white border border-[#E7DFE2] text-[11px] font-semibold text-[#634E53]">
                  <Lock className="w-3 h-3 text-[#800020]" />
                  View Only
                </span>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            {/* Cards / Table Switcher */}
            <div
              role="group"
              aria-label="Mode tampilan"
              className="inline-flex items-center p-1 rounded-full bg-white border border-[#E7DFE2]"
            >
              <button
                type="button"
                onClick={() => setViewLayout('cards')}
                aria-label="Tampilan kartu"
                className={`h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewLayout === 'cards' ? 'bg-[#2A040A] text-white' : 'text-[#634E53] hover:text-[#2A040A]'
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                <span>Kartu</span>
              </button>
              <button
                type="button"
                onClick={() => setViewLayout('table')}
                aria-label="Tampilan tabel"
                className={`h-9 px-3 rounded-full inline-flex items-center gap-1.5 text-xs font-semibold transition-colors cursor-pointer ${
                  viewLayout === 'table' ? 'bg-[#2A040A] text-white' : 'text-[#634E53] hover:text-[#2A040A]'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Tabel</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRefreshAll}
              disabled={metricsLoading || empLoading || attLoading}
              aria-label="Segarkan data"
              title="Segarkan data"
              className="h-11 w-11 rounded-full bg-white border border-[#E7DFE2] hover:border-[#800020]/40 text-[#2A040A] inline-flex items-center justify-center transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${
                  metricsLoading || empLoading || attLoading ? 'animate-spin text-[#800020]' : ''
                }`}
              />
            </button>

            {mode === 'employees' && (
              <button
                type="button"
                onClick={openAddEmployeeModal}
                className="min-h-[44px] px-5 rounded-full bg-[#800020] hover:bg-[#640019] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Tambah Karyawan</span>
              </button>
            )}
          </div>
        </div>

        {/* Search & Filter Strip */}
        <div className="bg-white rounded-2xl border border-[#ECE4E7] p-3 grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 text-[#8B757A] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  ? 'Cari nama, NIK, email, jabatan...'
                  : 'Cari nama karyawan atau catatan presensi...'
              }
              className="w-full min-h-[42px] rounded-xl border border-[#E7DFE2] bg-[#FAF8F9] focus:bg-white pl-10 pr-8 text-sm text-[#2A040A] placeholder:text-[#8B757A] focus:border-[#800020] focus:outline-none transition-colors"
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
                aria-label="Hapus pencarian"
                className="absolute right-2.5 top-1/2 -translate-y-1/2 h-7 w-7 inline-flex items-center justify-center rounded-full text-[#634E53] hover:bg-[#F2ECEE] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            {mode === 'employees' ? (
              <CustomDropdown
                value={empStatus}
                onChange={(val) => {
                  setEmpStatus(val);
                  setEmpPage(1);
                }}
                placeholder="Semua Status"
                ariaLabel="Filter Status Karyawan"
                triggerClassName="!min-h-[42px] !rounded-xl !border-[#E7DFE2] !bg-[#FAF8F9] !text-sm !font-normal"
                options={[
                  { value: '', label: 'Semua Status' },
                  { value: 'ACTIVE', label: 'Status: Aktif' },
                  { value: 'INACTIVE', label: 'Status: Nonaktif' },
                ]}
              />
            ) : (
              <CustomDatePicker
                value={attDate}
                onChange={(val) => {
                  setAttDate(val);
                  setAttPage(1);
                }}
                placeholder="Semua Tanggal"
                ariaLabel="Filter Tanggal Absensi"
                align="right"
                triggerClassName="!bg-[#FAF8F9] hover:!bg-white"
              />
            )}
          </div>

          <div className="sm:col-span-2 flex items-center justify-end">
            {(mode === 'employees' ? hasEmpFilters : hasAttFilters) && (
              <button
                type="button"
                onClick={() => {
                  if (mode === 'employees') {
                    setEmpSearch('');
                    setEmpDepartment('');
                    setEmpStatus('');
                    setEmpNotAttendedToday(false);
                    setEmpPage(1);
                  } else {
                    setAttSearch('');
                    setAttDepartment('');
                    setAttDate('');
                    setAttPage(1);
                  }
                }}
                className="min-h-[42px] px-3.5 rounded-xl text-xs font-semibold text-[#800020] hover:bg-[#FBE8EC] transition-colors cursor-pointer w-full sm:w-auto"
              >
                Reset Filter
              </button>
            )}
          </div>
        </div>

        {/* MAIN DATA VIEW */}
        {mode === 'employees' ? (
          empLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#634E53]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
              <span>Memuat data karyawan...</span>
            </div>
          ) : empError ? (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between gap-3 text-sm text-red-800">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{empError}</span>
              </div>
              <button
                type="button"
                onClick={loadEmployees}
                className="min-h-[40px] px-3.5 rounded-xl border border-red-200 bg-white font-semibold text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
              >
                Coba Lagi
              </button>
            </div>
          ) : !employees || employees.items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#ECE4E7] py-16 px-6 text-center">
              <div className="h-14 w-14 rounded-full bg-[#F7F4F5] text-[#634E53] flex items-center justify-center mx-auto mb-3">
                {empNotAttendedToday ? (
                  <CheckCircle2 className="w-6 h-6 text-[#047857]" />
                ) : (
                  <Users className="w-6 h-6" />
                )}
              </div>
              <p className="text-sm font-bold text-[#2A040A]">
                {empNotAttendedToday
                  ? 'Semua karyawan aktif sudah absen hari ini'
                  : 'Tidak ada data karyawan ditemukan'}
              </p>
              <p className="text-xs text-[#634E53] mt-1">
                {empNotAttendedToday
                  ? 'Tidak ada karyawan aktif yang menunggu check-in untuk tanggal hari ini.'
                  : 'Ubah kata kunci pencarian, reset filter, atau tambah karyawan baru.'}
              </p>
            </div>
          ) : (
            <>
              {viewLayout === 'cards' ? (
                /* TACTILE EMPLOYEE CARDS (Reference Design Language) */
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {employees.items.map((emp) => {
                    const empInitials = emp.fullName
                      .split(' ')
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();

                    return (
                      <article
                        key={emp.id}
                        className="bg-white rounded-3xl border border-[#ECE4E7] p-5 flex flex-col justify-between gap-4 hover:border-[#F2C8D2] transition-colors"
                      >
                        {/* Top Avatar & Name */}
                        <div className="flex flex-col items-center text-center">
                          <div
                            className={`h-14 w-14 rounded-full flex items-center justify-center text-sm font-bold mb-3 ${
                              emp.user.role === 'HRD_ADMIN'
                                ? 'bg-[#2A040A] text-[#FBE8EC]'
                                : 'bg-[#FBE8EC] text-[#800020]'
                            }`}
                          >
                            {empInitials}
                          </div>
                          <h3 className="text-sm font-bold text-[#2A040A] line-clamp-1">
                            {emp.fullName}
                          </h3>
                          <p className="text-xs text-[#634E53] truncate max-w-full mt-0.5">
                            {emp.user.email}
                          </p>
                        </div>

                        {/* Soft Blush Role & Position Band */}
                        <div className="rounded-2xl bg-[#FDF2F4] px-3.5 py-2.5 text-center">
                          <p className="text-xs font-bold text-[#2A040A] truncate">{emp.position}</p>
                          <p className="text-[11px] text-[#634E53] mt-0.5 truncate">
                            {emp.department} · {emp.user.role === 'HRD_ADMIN' ? 'HRD Admin' : 'Karyawan'}
                          </p>
                        </div>

                        {/* 2-Column Metadata Boxes */}
                        <div className="grid grid-cols-2 gap-2">
                          <div className="rounded-2xl bg-[#F7F4F5] px-3 py-2 min-w-0">
                            <span className="block text-[10px] font-semibold text-[#800020] uppercase tracking-wide">
                              NIK
                            </span>
                            <span
                              title={emp.employeeCode}
                              className="block text-xs font-mono-tabular font-semibold text-[#2A040A] truncate mt-0.5"
                            >
                              {emp.employeeCode}
                            </span>
                          </div>
                          <div className="rounded-2xl bg-[#F7F4F5] px-3 py-2 min-w-0">
                            <span className="block text-[10px] font-semibold text-[#800020] uppercase tracking-wide">
                              Telepon
                            </span>
                            <span className="block text-xs font-mono-tabular font-semibold text-[#2A040A] truncate mt-0.5">
                              {emp.phone || '—'}
                            </span>
                          </div>
                        </div>

                        {/* Footer: Status & Dark Circular Action Buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {emp.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#047857]">
                              <span className="h-2 w-2 rounded-full bg-[#10B981]" />
                              Aktif
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#634E53]">
                              <span className="h-2 w-2 rounded-full bg-[#A18D92]" />
                              Nonaktif
                            </span>
                          )}

                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditEmployeeModal(emp)}
                              aria-label={`Edit ${emp.fullName}`}
                              title="Edit karyawan"
                              className="h-9 w-9 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white inline-flex items-center justify-center transition-colors cursor-pointer"
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
                              title="Hapus karyawan"
                              className="h-9 w-9 rounded-full bg-[#FBE8EC] hover:bg-[#800020] text-[#800020] hover:text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                /* COMPACT TABLE VIEW (5 Clean Columns + Sticky Right Actions) */
                <div className="bg-white rounded-3xl border border-[#ECE4E7] overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead>
                        <tr className="bg-[#FAF8F9] border-b border-[#ECE4E7] text-[11px] font-semibold tracking-wider text-[#634E53] uppercase">
                          <th className="py-3.5 px-5">Karyawan</th>
                          <th className="py-3.5 px-4">Posisi</th>
                          <th className="py-3.5 px-4">Kontak</th>
                          <th className="py-3.5 px-4">Akses &amp; Status</th>
                          <th className="py-3.5 px-5 text-right sticky right-0 bg-[#FAF8F9] shadow-[-8px_0_12px_-10px_rgba(42,4,10,0.12)]">
                            Aksi
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#F2ECEE]">
                        {employees.items.map((emp) => {
                          const empInitials = emp.fullName
                            .split(' ')
                            .map((n) => n[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();

                          return (
                            <tr key={emp.id} className="group hover:bg-[#FAF8F9] transition-colors">
                              <td className="py-3.5 px-5">
                                <div className="flex items-center gap-3 min-w-[170px]">
                                  <div
                                    className={`h-9 w-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                                      emp.user.role === 'HRD_ADMIN'
                                        ? 'bg-[#2A040A] text-[#FBE8EC]'
                                        : 'bg-[#FBE8EC] text-[#800020]'
                                    }`}
                                  >
                                    {empInitials}
                                  </div>
                                  <div className="min-w-0">
                                    <p className="font-bold text-[#2A040A] truncate">{emp.fullName}</p>
                                    <p className="text-[11px] font-mono-tabular text-[#634E53] truncate">
                                      {emp.employeeCode}
                                    </p>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <p className="font-semibold text-[#2A040A]">{emp.position}</p>
                                <p className="text-[11px] text-[#634E53]">{emp.department}</p>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <p className="text-[#2A040A]">{emp.user.email}</p>
                                <p className="text-[11px] font-mono-tabular text-[#634E53]">
                                  {emp.phone || '—'}
                                </p>
                              </td>

                              <td className="py-3.5 px-4 whitespace-nowrap">
                                <div className="flex flex-col items-start gap-1">
                                  <span
                                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                                      emp.user.role === 'HRD_ADMIN'
                                        ? 'bg-[#FBE8EC] text-[#800020]'
                                        : 'bg-[#F2ECEE] text-[#2A040A]'
                                    }`}
                                  >
                                    {emp.user.role === 'HRD_ADMIN' && <ShieldCheck className="w-3 h-3" />}
                                    {emp.user.role === 'HRD_ADMIN' ? 'HRD Admin' : 'Karyawan'}
                                  </span>
                                  {emp.status === 'ACTIVE' ? (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#047857]">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#10B981]" />
                                      Aktif
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[#634E53]">
                                      <span className="h-1.5 w-1.5 rounded-full bg-[#A18D92]" />
                                      Nonaktif
                                    </span>
                                  )}
                                </div>
                              </td>

                              <td className="py-3.5 px-5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#FAF8F9] shadow-[-8px_0_12px_-10px_rgba(42,4,10,0.12)] transition-colors">
                                <div className="inline-flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openEditEmployeeModal(emp)}
                                    aria-label={`Edit ${emp.fullName}`}
                                    className="min-h-[34px] px-3 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Edit3 className="w-3.5 h-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setDeleteError(null);
                                      setDeletingEmp(emp);
                                    }}
                                    aria-label={`Hapus ${emp.fullName}`}
                                    className="min-h-[34px] px-3 rounded-full bg-[#FBE8EC] hover:bg-[#800020] text-[#800020] hover:text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Hapus</span>
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Pagination */}
              {employees.meta.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-[#634E53] pt-1">
                  <span>
                    Halaman <strong className="text-[#2A040A]">{employees.meta.page}</strong> dari{' '}
                    <strong className="text-[#2A040A]">{employees.meta.totalPages}</strong> (
                    {employees.meta.total} karyawan)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={empPage <= 1}
                      onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                      className="min-h-[38px] px-4 rounded-full bg-white border border-[#E7DFE2] hover:border-[#800020]/40 disabled:opacity-40 font-semibold text-[#2A040A] cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={empPage >= employees.meta.totalPages}
                      onClick={() => setEmpPage((p) => p + 1)}
                      className="min-h-[38px] px-4 rounded-full bg-white border border-[#E7DFE2] hover:border-[#800020]/40 disabled:opacity-40 font-semibold text-[#2A040A] cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )
        ) : attLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-3 text-sm text-[#634E53]">
            <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
            <span>Memuat log absensi WFH...</span>
          </div>
        ) : attError ? (
          <div className="p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between gap-3 text-sm text-red-800">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{attError}</span>
            </div>
            <button
              type="button"
              onClick={loadAttendances}
              className="min-h-[40px] px-3.5 rounded-xl border border-red-200 bg-white font-semibold text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
            >
              Coba Lagi
            </button>
          </div>
        ) : !attendances || attendances.items.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#ECE4E7] py-16 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-[#F7F4F5] text-[#634E53] flex items-center justify-center mx-auto mb-3">
              <CalendarCheck2 className="w-6 h-6" />
            </div>
            <p className="text-sm font-bold text-[#2A040A]">Belum ada riwayat presensi yang sesuai</p>
            <p className="text-xs text-[#634E53] mt-1">
              Sesuaikan tanggal, departemen, atau kata kunci pada filter di atas.
            </p>
          </div>
        ) : (
          <>
            {viewLayout === 'cards' ? (
              /* TACTILE ATTENDANCE CARDS (Mirroring Reference's Appointment Cards) */
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {attendances.items.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#ECE4E7] p-5 flex flex-col justify-between gap-4 hover:border-[#F2C8D2] transition-colors"
                  >
                    {/* Top Circular Photo Proof & Employee Identity */}
                    <div className="flex flex-col items-center text-center">
                      <button
                        type="button"
                        onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                        aria-label={`Lihat foto bukti ${item.employee?.fullName ?? 'karyawan'}`}
                        className="h-15 w-15 rounded-full overflow-hidden border-2 border-[#F2C8D2] mb-3 cursor-pointer hover:border-[#800020] transition-colors shrink-0"
                      >
                        <img
                          src={`${ASSET_BASE_URL}${item.photoUrl}`}
                          alt="Foto bukti WFH"
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <h3 className="text-sm font-bold text-[#2A040A] line-clamp-1">
                        {item.employee?.fullName ?? 'Karyawan'}
                      </h3>
                      <p className="text-[11px] font-mono-tabular text-[#634E53] truncate max-w-full mt-0.5">
                        {item.employee?.employeeCode ?? '-'}
                      </p>
                    </div>

                    {/* Soft Blush Position & Department Band */}
                    <div className="rounded-2xl bg-[#FDF2F4] px-3.5 py-2.5 text-center">
                      <p className="text-xs font-bold text-[#2A040A] truncate">
                        {item.employee?.position ?? '-'}
                      </p>
                      <p className="text-[11px] text-[#634E53] mt-0.5 truncate">
                        {item.employee?.department ?? '-'}
                      </p>
                    </div>

                    {/* Date & Time Split Boxes */}
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-2xl bg-[#F7F4F5] px-3 py-2">
                        <span className="block text-[10px] font-semibold text-[#800020] uppercase tracking-wide">
                          Tanggal
                        </span>
                        <span className="block text-xs font-semibold text-[#2A040A] truncate mt-0.5">
                          {formatDateId(item.attendanceDate)}
                        </span>
                      </div>
                      <div className="rounded-2xl bg-[#F7F4F5] px-3 py-2">
                        <span className="block text-[10px] font-semibold text-[#800020] uppercase tracking-wide">
                          Jam Masuk
                        </span>
                        <span className="block text-xs font-mono-tabular font-bold text-[#047857] mt-0.5">
                          {formatTimeId(item.clockInAt)} WIB
                        </span>
                      </div>
                    </div>

                    {/* Bottom Dark Circular Action Buttons */}
                    <div className="flex items-center justify-center gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                        aria-label="Lihat foto penuh"
                        title="Lihat foto bukti"
                        className="h-9 w-9 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <FileImage className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedDetail(item)}
                        aria-label="Lihat detail presensi"
                        title="Detail presensi"
                        className="h-9 w-9 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white inline-flex items-center justify-center transition-colors cursor-pointer"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              /* COMPACT TABLE VIEW FOR ATTENDANCES (Sticky Right Action) */
              <div className="bg-white rounded-3xl border border-[#ECE4E7] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#FAF8F9] border-b border-[#ECE4E7] text-[11px] font-semibold tracking-wider text-[#634E53] uppercase">
                        <th className="py-3.5 px-5">Karyawan</th>
                        <th className="py-3.5 px-4">Departemen</th>
                        <th className="py-3.5 px-4">Waktu Check-In</th>
                        <th className="py-3.5 px-4">Foto</th>
                        <th className="py-3.5 px-5 text-right sticky right-0 bg-[#FAF8F9] shadow-[-8px_0_12px_-10px_rgba(42,4,10,0.12)]">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F2ECEE]">
                      {attendances.items.map((item) => (
                        <tr key={item.id} className="group hover:bg-[#FAF8F9] transition-colors">
                          <td className="py-3.5 px-5">
                            <p className="font-bold text-[#2A040A]">
                              {item.employee?.fullName ?? '-'}
                            </p>
                            <p className="text-[11px] font-mono-tabular text-[#634E53]">
                              {item.employee?.employeeCode ?? '-'} · {item.employee?.position ?? '-'}
                            </p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap text-[#634E53]">
                            {item.employee?.department ?? '-'}
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <p className="font-medium text-[#2A040A]">
                              {formatDateId(item.attendanceDate)}
                            </p>
                            <p className="text-[11px] font-mono-tabular font-bold text-[#047857]">
                              {formatTimeId(item.clockInAt)} WIB
                            </p>
                          </td>
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <button
                              type="button"
                              onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                              className="h-9 w-9 rounded-full overflow-hidden border border-[#F2C8D2] hover:border-[#800020] cursor-pointer"
                              title="Pratinjau foto"
                            >
                              <img
                                src={`${ASSET_BASE_URL}${item.photoUrl}`}
                                alt="Bukti WFH"
                                className="h-full w-full object-cover"
                              />
                            </button>
                          </td>
                          <td className="py-3.5 px-5 text-right whitespace-nowrap sticky right-0 bg-white group-hover:bg-[#FAF8F9] shadow-[-8px_0_12px_-10px_rgba(42,4,10,0.12)] transition-colors">
                            <button
                              type="button"
                              onClick={() => setSelectedDetail(item)}
                              className="min-h-[34px] px-3.5 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              <span>Detail</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Pagination */}
            {attendances.meta.totalPages > 1 && (
              <div className="flex items-center justify-between text-xs text-[#634E53] pt-1">
                <span>
                  Halaman <strong className="text-[#2A040A]">{attendances.meta.page}</strong> dari{' '}
                  <strong className="text-[#2A040A]">{attendances.meta.totalPages}</strong> (
                  {attendances.meta.total} absensi)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={attPage <= 1}
                    onClick={() => setAttPage((p) => Math.max(1, p - 1))}
                    className="min-h-[38px] px-4 rounded-full bg-white border border-[#E7DFE2] hover:border-[#800020]/40 disabled:opacity-40 font-semibold text-[#2A040A] cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={attPage >= attendances.meta.totalPages}
                    onClick={() => setAttPage((p) => p + 1)}
                    className="min-h-[38px] px-4 rounded-full bg-white border border-[#E7DFE2] hover:border-[#800020]/40 disabled:opacity-40 font-semibold text-[#2A040A] cursor-pointer"
                  >
                    Berikutnya
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>

      {/* VIEW DETAIL ATTENDANCE MODAL */}
      {selectedDetail && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Detail Submission Presensi Karyawan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C070B]/55 backdrop-blur-sm p-4 overflow-y-auto"
          onClick={() => setSelectedDetail(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-3xl border border-[#ECE4E7] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#F2ECEE]">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#800020]" />
                <h3 className="text-base font-bold text-[#2A040A]">Detail Presensi WFH</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                aria-label="Tutup modal"
                className="h-9 w-9 inline-flex items-center justify-center rounded-full hover:bg-[#F7F4F5] text-[#634E53] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div className="p-4 rounded-2xl bg-[#FDF2F4] flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h4 className="text-sm font-bold text-[#2A040A] truncate">
                    {selectedDetail.employee?.fullName ?? 'Karyawan'}
                  </h4>
                  <p className="text-xs text-[#634E53] font-mono-tabular mt-0.5 truncate">
                    {selectedDetail.employee?.employeeCode} · {selectedDetail.employee?.department}
                  </p>
                </div>
                <span className="inline-flex items-center gap-1 rounded-full bg-[#ECFDF5] border border-[#BBF7D0] px-2.5 py-1 text-xs font-semibold text-[#047857] shrink-0">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Terverifikasi
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 rounded-2xl bg-[#F7F4F5]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#800020] block">
                    Tanggal
                  </span>
                  <p className="text-sm font-bold text-[#2A040A] mt-0.5">
                    {formatDateId(selectedDetail.attendanceDate, true)}
                  </p>
                </div>
                <div className="p-3.5 rounded-2xl bg-[#F7F4F5]">
                  <span className="text-[11px] font-semibold uppercase tracking-wide text-[#800020] block">
                    Jam Masuk
                  </span>
                  <p className="text-sm font-bold font-mono-tabular text-[#047857] mt-0.5">
                    {formatTimeId(selectedDetail.clockInAt)} WIB
                  </p>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl border border-[#ECE4E7] bg-white">
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#634E53] block mb-1">
                  Catatan Aktivitas
                </span>
                <p className="text-sm text-[#2A040A] leading-relaxed">
                  {selectedDetail.notes || 'Tidak ada catatan yang dilampirkan.'}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-semibold uppercase tracking-wide text-[#634E53] block mb-1.5">
                  Foto Bukti WFH
                </span>
                <div className="relative rounded-2xl overflow-hidden border border-[#ECE4E7] bg-[#F7F4F5] max-h-56 flex items-center justify-center">
                  <img
                    src={`${ASSET_BASE_URL}${selectedDetail.photoUrl}`}
                    alt="Bukti WFH"
                    className="w-full max-h-56 object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${selectedDetail.photoUrl}`)}
                    className="absolute bottom-2.5 right-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    <FileImage className="w-3.5 h-3.5" />
                    <span>Perbesar</span>
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedDetail(null)}
                className="min-h-[42px] px-5 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white text-sm font-semibold transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD / EDIT EMPLOYEE MODAL */}
      {empModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="employee-modal-title"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C070B]/55 backdrop-blur-sm p-3 sm:p-5 overscroll-contain"
          onClick={() => !formSaving && !modalSaved && setEmpModalOpen(false)}
        >
          <div
            className="w-full max-w-[580px] max-h-[92vh] bg-white rounded-3xl border border-[#ECE4E7] shadow-2xl flex flex-col overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header with Reactive DEXO Companion */}
            <div className="px-6 py-4 border-b border-[#F2ECEE] bg-[#FAF8F9] flex items-center justify-between gap-4 shrink-0">
              <div className="flex items-center gap-3.5 min-w-0">
                <div
                  className={`h-14 w-14 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                    modalSaved
                      ? 'bg-[#ECFDF5]'
                      : hasModalErrors
                      ? 'bg-red-100'
                      : 'bg-[#FBE8EC]'
                  }`}
                >
                  <img
                    key={
                      modalSaved
                        ? 'saved'
                        : formSaving
                        ? 'saving'
                        : hasModalErrors
                        ? `err-${modalErrorTick}`
                        : isTypingInModal
                        ? 'typing'
                        : isModalFormReady
                        ? 'ready'
                        : 'idle'
                    }
                    src={modalMascotSrc}
                    alt="DEXO Pemandu Form"
                    className={`h-12 w-12 object-contain ${modalMascotAnim}`}
                  />
                </div>
                <div className="min-w-0">
                  <h3 id="employee-modal-title" className="text-base font-bold text-[#2A040A] tracking-tight">
                    {editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                  </h3>
                  <p
                    className={`text-xs mt-0.5 truncate ${
                      modalSaved
                        ? 'text-[#047857] font-semibold'
                        : hasModalErrors
                        ? 'text-red-700 font-semibold'
                        : 'text-[#634E53]'
                    }`}
                  >
                    {modalMascotHint}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEmpModalOpen(false)}
                aria-label="Tutup modal"
                className="min-h-[40px] min-w-[40px] -mr-2 inline-flex items-center justify-center rounded-full text-[#634E53] hover:bg-white hover:text-[#2A040A] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form
              id="employee-form"
              noValidate
              onInput={triggerTypingPulse}
              onSubmit={handleSaveEmployee}
              className="flex-1 overflow-y-auto overscroll-contain px-6 py-5 space-y-6"
            >
              {formError && (
                <div
                  role="alert"
                  className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-800"
                >
                  <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-red-600" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Section 1: Identitas & Kontak */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold text-[#634E53] uppercase tracking-wider">
                  Identitas &amp; Kontak
                </h4>

                <div>
                  <label htmlFor="emp-fullName" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                    Nama Lengkap <span className="text-[#800020]">*</span>
                  </label>
                  <input
                    id="emp-fullName"
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={(e) => {
                      setFormState({ ...formState, fullName: e.target.value });
                      if (fieldErrors.fullName) setFieldErrors({ ...fieldErrors, fullName: undefined });
                    }}
                    aria-invalid={Boolean(fieldErrors.fullName)}
                    placeholder="Contoh: Dewi Lestari"
                    className={`w-full min-h-[44px] sm:min-h-[42px] rounded-xl border px-3.5 text-sm text-[#2A040A] placeholder:text-[#9C8A8F] transition-colors focus:ring-2 focus:outline-none ${
                      fieldErrors.fullName
                        ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                        : 'border-[#DDD3D6] focus:border-[#800020] focus:ring-[#800020]/15'
                    }`}
                  />
                  {fieldErrors.fullName && (
                    <p className="mt-1 text-xs text-red-600">{fieldErrors.fullName}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="emp-nik" className="text-xs font-semibold text-[#2A040A]">
                        NIK <span className="text-[#800020]">*</span>
                      </label>
                      <span
                        className={`text-[11px] font-mono-tabular font-semibold ${
                          /^\d{16}$/.test(formState.employeeCode)
                            ? 'text-[#047857]'
                            : 'text-[#634E53]'
                        }`}
                      >
                        {formState.employeeCode.replace(/\D/g, '').length}/16 digit
                      </span>
                    </div>
                    <input
                      id="emp-nik"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={16}
                      required
                      value={formState.employeeCode}
                      onChange={(e) => {
                        const digits = sanitizeDigits(e.target.value, 16);
                        setFormState({ ...formState, employeeCode: digits });
                        if (fieldErrors.employeeCode) {
                          setFieldErrors({ ...fieldErrors, employeeCode: undefined });
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.employeeCode)}
                      placeholder="3174011508950001"
                      className={`w-full min-h-[44px] sm:min-h-[42px] rounded-xl border px-3.5 text-sm font-mono-tabular tracking-wide text-[#2A040A] placeholder:text-[#9C8A8F] transition-colors focus:ring-2 focus:outline-none ${
                        fieldErrors.employeeCode
                          ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                          : 'border-[#DDD3D6] focus:border-[#800020] focus:ring-[#800020]/15'
                      }`}
                    />
                    {fieldErrors.employeeCode ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.employeeCode}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#634E53]">
                        {editingEmp && !/^\d{16}$/.test(editingEmp.employeeCode) && formState.employeeCode === editingEmp.employeeCode
                          ? 'Kode lama. Ketik angka untuk memperbarui ke NIK 16 digit.'
                          : '16 digit angka sesuai KTP.'}
                      </p>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label htmlFor="emp-phone" className="text-xs font-semibold text-[#2A040A]">
                        No. Telepon
                      </label>
                      <span className="text-[11px] font-mono-tabular text-[#634E53]">
                        {(formState.phone ?? '').length}/15 digit
                      </span>
                    </div>
                    <input
                      id="emp-phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={15}
                      value={formState.phone ?? ''}
                      onChange={(e) => {
                        const digits = sanitizeDigits(e.target.value, 15);
                        setFormState({ ...formState, phone: digits });
                        if (fieldErrors.phone) {
                          setFieldErrors({ ...fieldErrors, phone: undefined });
                        }
                      }}
                      aria-invalid={Boolean(fieldErrors.phone)}
                      placeholder="081234567890"
                      className={`w-full min-h-[44px] sm:min-h-[42px] rounded-xl border px-3.5 text-sm font-mono-tabular text-[#2A040A] placeholder:text-[#9C8A8F] transition-colors focus:ring-2 focus:outline-none ${
                        fieldErrors.phone
                          ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                          : 'border-[#DDD3D6] focus:border-[#800020] focus:ring-[#800020]/15'
                      }`}
                    />
                    {fieldErrors.phone ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.phone}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#634E53]">
                        Hanya angka, maks. 15 digit.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Posisi & Hak Akses */}
              <div className="pt-5 border-t border-[#F2ECEE] space-y-4">
                <h4 className="text-xs font-bold text-[#634E53] uppercase tracking-wider">
                  Posisi &amp; Hak Akses
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                      Departemen <span className="text-[#800020]">*</span>
                    </label>
                    <CustomDropdown
                      value={formState.department}
                      onChange={(val) => setFormState({ ...formState, department: val })}
                      placeholder="Pilih Departemen"
                      ariaLabel="Departemen"
                      triggerClassName="!min-h-[44px] sm:!min-h-[42px] !rounded-xl !border-[#DDD3D6] !text-sm !font-normal"
                      options={DEPARTMENTS.map((d) => ({ value: d, label: d }))}
                    />
                  </div>

                  <div>
                    <label htmlFor="emp-position" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                      Jabatan <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      id="emp-position"
                      type="text"
                      required
                      value={formState.position}
                      onChange={(e) => {
                        setFormState({ ...formState, position: e.target.value });
                        if (fieldErrors.position) setFieldErrors({ ...fieldErrors, position: undefined });
                      }}
                      aria-invalid={Boolean(fieldErrors.position)}
                      placeholder="Contoh: Software Engineer"
                      className={`w-full min-h-[44px] sm:min-h-[42px] rounded-xl border px-3.5 text-sm text-[#2A040A] placeholder:text-[#9C8A8F] transition-colors focus:ring-2 focus:outline-none ${
                        fieldErrors.position
                          ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                          : 'border-[#DDD3D6] focus:border-[#800020] focus:ring-[#800020]/15'
                      }`}
                    />
                    {fieldErrors.position && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.position}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <span id="emp-role-label" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                      Role Akses
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="emp-role-label"
                      className="grid grid-cols-2 p-1 rounded-xl bg-[#F7F4F5] border border-[#ECE4E7] gap-1"
                    >
                      {(
                        [
                          { value: 'EMPLOYEE', label: 'Karyawan' },
                          { value: 'HRD_ADMIN', label: 'HRD Admin' },
                        ] as const
                      ).map((opt) => {
                        const selected = formState.role === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() => setFormState({ ...formState, role: opt.value as Role })}
                            className={`min-h-[38px] sm:min-h-[34px] rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                              selected
                                ? 'bg-[#2A040A] text-white'
                                : 'text-[#634E53] hover:text-[#2A040A]'
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <span id="emp-status-label" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                      Status Karyawan
                    </span>
                    <div
                      role="radiogroup"
                      aria-labelledby="emp-status-label"
                      className="grid grid-cols-2 p-1 rounded-xl bg-[#F7F4F5] border border-[#ECE4E7] gap-1"
                    >
                      {(
                        [
                          { value: 'ACTIVE', label: 'Aktif', dot: 'bg-[#10B981]' },
                          { value: 'INACTIVE', label: 'Nonaktif', dot: 'bg-[#A18D92]' },
                        ] as const
                      ).map((opt) => {
                        const selected = formState.status === opt.value;
                        return (
                          <button
                            key={opt.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            onClick={() =>
                              setFormState({ ...formState, status: opt.value as EmployeeStatus })
                            }
                            className={`min-h-[38px] sm:min-h-[34px] rounded-lg text-xs font-semibold inline-flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
                              selected
                                ? 'bg-white text-[#2A040A] border border-[#DDD3D6]'
                                : 'text-[#634E53] hover:text-[#2A040A]'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${opt.dot}`} />
                            <span>{opt.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Akun Login */}
              <div className="pt-5 border-t border-[#F2ECEE] space-y-4">
                <h4 className="text-xs font-bold text-[#634E53] uppercase tracking-wider">
                  Akun Login
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="emp-email" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                      Email Perusahaan <span className="text-[#800020]">*</span>
                    </label>
                    <input
                      id="emp-email"
                      type="email"
                      required
                      autoComplete="off"
                      value={formState.email}
                      onChange={(e) => {
                        setFormState({ ...formState, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: undefined });
                      }}
                      aria-invalid={Boolean(fieldErrors.email)}
                      placeholder="nama@company.local"
                      className={`w-full min-h-[44px] sm:min-h-[42px] rounded-xl border px-3.5 text-sm text-[#2A040A] placeholder:text-[#9C8A8F] transition-colors focus:ring-2 focus:outline-none ${
                        fieldErrors.email
                          ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                          : 'border-[#DDD3D6] focus:border-[#800020] focus:ring-[#800020]/15'
                      }`}
                    />
                    {fieldErrors.email && (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="emp-password" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                      {editingEmp ? 'Password Baru' : 'Password'}{' '}
                      {!editingEmp && <span className="text-[#800020]">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        id="emp-password"
                        type={showModalPassword ? 'text' : 'password'}
                        required={!editingEmp}
                        minLength={6}
                        autoComplete="new-password"
                        value={formState.password ?? ''}
                        onChange={(e) => {
                          setFormState({ ...formState, password: e.target.value });
                          if (fieldErrors.password) {
                            setFieldErrors({ ...fieldErrors, password: undefined });
                          }
                        }}
                        aria-invalid={Boolean(fieldErrors.password)}
                        placeholder={editingEmp ? 'Kosongkan jika tetap' : 'Min. 6 karakter'}
                        className={`w-full min-h-[44px] sm:min-h-[42px] rounded-xl border pl-3.5 pr-11 text-sm text-[#2A040A] placeholder:text-[#9C8A8F] transition-colors focus:ring-2 focus:outline-none ${
                          fieldErrors.password
                            ? 'border-red-400 focus:border-red-600 focus:ring-red-100'
                            : 'border-[#DDD3D6] focus:border-[#800020] focus:ring-[#800020]/15'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowModalPassword((prev) => !prev)}
                        aria-label={showModalPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                        className="absolute right-1 top-1/2 -translate-y-1/2 min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#634E53] hover:text-[#2A040A] cursor-pointer"
                      >
                        {showModalPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                    {fieldErrors.password ? (
                      <p className="mt-1 text-xs text-red-600">{fieldErrors.password}</p>
                    ) : (
                      <p className="mt-1 text-[11px] text-[#634E53]">
                        {editingEmp ? 'Opsional, minimal 6 karakter jika diisi.' : 'Minimal 6 karakter.'}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </form>

            {/* Sticky Footer */}
            <div className="px-6 py-3.5 bg-[#FAF8F9] border-t border-[#F2ECEE] flex flex-wrap items-center justify-between gap-3 shrink-0">
              <span className="text-xs text-[#634E53]">
                <span className="text-[#800020] font-semibold">*</span> Wajib diisi
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="min-h-[44px] sm:min-h-[40px] px-4 rounded-full border border-[#DDD3D6] bg-white hover:bg-[#F7F4F5] text-sm font-semibold text-[#2A040A] transition-colors cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  form="employee-form"
                  disabled={formSaving || modalSaved}
                  className="min-h-[44px] sm:min-h-[40px] px-5 rounded-full bg-[#800020] hover:bg-[#640019] disabled:opacity-60 text-white text-sm font-semibold transition-colors cursor-pointer"
                >
                  {modalSaved
                    ? 'Tersimpan!'
                    : formSaving
                    ? 'Menyimpan...'
                    : editingEmp
                    ? 'Simpan Perubahan'
                    : 'Simpan Karyawan'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deletingEmp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Hapus Karyawan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C070B]/55 backdrop-blur-sm p-4"
          onClick={() => setDeletingEmp(null)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-3xl border border-[#ECE4E7] p-6 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-11 w-11 rounded-full bg-[#FBE8EC] text-[#800020] flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <h3 className="text-base font-bold text-[#2A040A]">Hapus Karyawan?</h3>
            </div>
            <p className="text-sm text-[#634E53] leading-relaxed">
              Data <strong className="text-[#2A040A]">{deletingEmp.fullName}</strong> (
              <span className="font-mono-tabular font-semibold">{deletingEmp.employeeCode}</span>)
              beserta riwayat absensinya akan dihapus permanen.
            </p>

            {deleteError && (
              <div className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingEmp(null)}
                className="min-h-[42px] px-4 rounded-full border border-[#DDD3D6] bg-white hover:bg-[#F7F4F5] text-sm font-semibold text-[#2A040A] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="min-h-[42px] px-4 rounded-full bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
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
