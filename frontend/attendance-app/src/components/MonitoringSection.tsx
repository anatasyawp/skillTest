import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Edit3,
  FileImage,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import {
  ASSET_BASE_URL,
  AttendanceItem,
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

const DEPARTMENTS = ['Engineering', 'Product', 'Human Resources', 'Finance', 'Operations'];

interface MonitoringSectionProps {
  mode: 'employees' | 'attendances';
  onPreviewPhoto: (url: string) => void;
}

export function MonitoringSection({ mode, onPreviewPhoto }: MonitoringSectionProps) {
  const [employees, setEmployees] = useState<PaginatedResponse<EmployeeItem> | null>(null);
  const [empLoading, setEmpLoading] = useState(false);
  const [empError, setEmpError] = useState<string | null>(null);
  const [empSearch, setEmpSearch] = useState('');
  const [empDepartment, setEmpDepartment] = useState('');
  const [empStatus, setEmpStatus] = useState('');
  const [empPage, setEmpPage] = useState(1);

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

  const [deletingEmp, setDeletingEmp] = useState<EmployeeItem | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [attendances, setAttendances] = useState<PaginatedResponse<AttendanceItem> | null>(null);
  const [attLoading, setAttLoading] = useState(false);
  const [attError, setAttError] = useState<string | null>(null);
  const [attSearch, setAttSearch] = useState('');
  const [attDepartment, setAttDepartment] = useState('');
  const [attDate, setAttDate] = useState('');
  const [attPage, setAttPage] = useState(1);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setEmpModalOpen(false);
        setDeletingEmp(null);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const loadEmployees = useCallback(async () => {
    setEmpLoading(true);
    setEmpError(null);
    try {
      const data = await fetchEmployees({
        search: empSearch || undefined,
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

  const loadAttendances = useCallback(async () => {
    setAttLoading(true);
    setAttError(null);
    try {
      const data = await fetchAttendances({
        search: attSearch || undefined,
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

  useEffect(() => {
    if (mode === 'employees') {
      loadEmployees();
    } else {
      loadAttendances();
    }
  }, [mode, loadEmployees, loadAttendances]);

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
          email: formState.email,
          role: formState.role,
          employeeCode: formState.employeeCode,
          fullName: formState.fullName,
          department: formState.department,
          position: formState.position,
          phone: formState.phone,
          status: formState.status,
        };
        if (formState.password?.trim()) {
          payload.password = formState.password.trim();
        }
        await updateEmployee(editingEmp.id, payload);
      } else {
        await createEmployee(formState);
      }
      setEmpModalOpen(false);
      await loadEmployees();
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
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : 'Gagal menghapus karyawan.');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <>
      {mode === 'employees' ? (
        <section className="bg-white border border-[#D2BBAE] rounded-xl overflow-hidden shadow-xs">
          <div className="bg-gradient-to-r from-[#3A0B07] via-[#7E2908] to-[#9A3409] text-white px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">Master Data Karyawan</h2>
              <p className="text-sm text-[#EADCD3] mt-0.5">
                Kelola profil, role RBAC, departemen, jabatan, dan status aktif karyawan.
              </p>
            </div>
            <button
              type="button"
              onClick={openAddEmployeeModal}
              className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-md bg-[#EC8C0E] hover:bg-[#D1510A] text-[#3A0B07] hover:text-white text-sm font-bold shadow-xs transition-colors duration-150 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Karyawan</span>
            </button>
          </div>
          <div className="p-5 sm:p-6 pt-1">

          {/* Filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-[#A68B7E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={empSearch}
                onChange={(e) => {
                  setEmpSearch(e.target.value);
                  setEmpPage(1);
                }}
                placeholder="Cari nama, NIK/NIP, jabatan, email..."
                className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] bg-white pl-10 pr-3.5 text-sm text-[#3A0B07] placeholder:text-[#A68B7E] focus:border-[#D1510A] focus:outline-none"
              />
            </div>

            <select
              value={empDepartment}
              onChange={(e) => {
                setEmpDepartment(e.target.value);
                setEmpPage(1);
              }}
              aria-label="Filter departemen"
              className="min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm text-[#3A0B07] focus:border-[#D1510A] focus:outline-none"
            >
              <option value="">Semua Departemen</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <select
              value={empStatus}
              onChange={(e) => {
                setEmpStatus(e.target.value);
                setEmpPage(1);
              }}
              aria-label="Filter status"
              className="min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm text-[#3A0B07] focus:border-[#D1510A] focus:outline-none"
            >
              <option value="">Semua Status</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
            </select>
          </div>

          {empLoading ? (
            <div className="py-12 flex items-center justify-center gap-3 text-sm text-[#6E4A3E]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#D1510A]" />
              <span>Memuat data karyawan...</span>
            </div>
          ) : empError ? (
            <div className="mt-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-[#B91C1C]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{empError}</span>
              </div>
              <button
                type="button"
                onClick={loadEmployees}
                className="min-h-[44px] px-3.5 rounded-md border border-[#FECACA] bg-white text-sm font-medium text-[#B91C1C] cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : !employees || employees.items.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6E4A3E]">
              Tidak ada data karyawan yang sesuai dengan filter.
            </div>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#EADCD3] text-xs font-semibold uppercase tracking-wider text-[#6E4A3E]">
                      <th className="py-3 pr-4">Kode</th>
                      <th className="py-3 px-4">Nama &amp; Email</th>
                      <th className="py-3 px-4">Departemen</th>
                      <th className="py-3 px-4">Jabatan</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 pl-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADCD3]">
                    {employees.items.map((emp) => (
                      <tr key={emp.id} className="hover:bg-[#FAF6F3]">
                        <td className="py-3.5 pr-4 whitespace-nowrap font-mono-tabular font-semibold text-[#3A0B07]">
                          {emp.employeeCode}
                        </td>
                        <td className="py-3.5 px-4">
                          <p className="font-semibold text-[#3A0B07]">{emp.fullName}</p>
                          <p className="text-xs text-[#6E4A3E]">{emp.user.email}</p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#6E4A3E]">
                          {emp.department}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#6E4A3E]">
                          {emp.position}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="inline-flex items-center rounded-md bg-[#EADCD3] px-2 py-0.5 text-xs font-medium text-[#3A0B07]">
                            {emp.user.role}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          {emp.status === 'ACTIVE' ? (
                            <span className="inline-flex items-center rounded-md bg-[#F0FDF4] border border-[#BBF7D0] px-2.5 py-0.5 text-xs font-semibold text-[#15803D]">
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-[#FEF2F2] border border-[#FECACA] px-2.5 py-0.5 text-xs font-semibold text-[#B91C1C]">
                              INACTIVE
                            </span>
                          )}
                        </td>
                        <td className="py-3.5 pl-4 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => openEditEmployeeModal(emp)}
                              aria-label={`Edit ${emp.fullName}`}
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-[#3A0B07] cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setDeleteError(null);
                                setDeletingEmp(emp);
                              }}
                              aria-label={`Hapus ${emp.fullName}`}
                              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md border border-[#FECACA] bg-white hover:bg-[#FEF2F2] text-[#B91C1C] cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {employees.meta.totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-[#EADCD3] flex items-center justify-between text-xs text-[#6E4A3E]">
                  <span>
                    Halaman <strong className="text-[#3A0B07]">{employees.meta.page}</strong> dari{' '}
                    <strong className="text-[#3A0B07]">{employees.meta.totalPages}</strong> (
                    {employees.meta.total} karyawan)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={empPage <= 1}
                      onClick={() => setEmpPage((p) => Math.max(1, p - 1))}
                      className="min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white disabled:opacity-50 text-xs font-medium text-[#3A0B07] cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={empPage >= employees.meta.totalPages}
                      onClick={() => setEmpPage((p) => p + 1)}
                      className="min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white disabled:opacity-50 text-xs font-medium text-[#3A0B07] cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </section>
      ) : (
        <section className="bg-white border border-[#D2BBAE] rounded-xl overflow-hidden shadow-xs">
          <div className="bg-gradient-to-r from-[#3A0B07] via-[#7E2908] to-[#9A3409] text-white px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-white">
                Verifikasi Absensi WFH Karyawan
              </h2>
              <p className="text-sm text-[#EADCD3] mt-0.5">
                Pantau kehadiran harian dan bukti foto WFH seluruh karyawan (view-only).
              </p>
            </div>
            <button
              type="button"
              onClick={loadAttendances}
              className="inline-flex items-center gap-2 min-h-[44px] px-3.5 rounded-md bg-[#EC8C0E] hover:bg-[#D1510A] text-[#3A0B07] hover:text-white text-sm font-bold shadow-xs transition-colors duration-150 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
          </div>
          <div className="p-5 sm:p-6 pt-1">

          {/* Attendance Filters */}
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2 relative">
              <Search className="w-4 h-4 text-[#A68B7E] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={attSearch}
                onChange={(e) => {
                  setAttSearch(e.target.value);
                  setAttPage(1);
                }}
                placeholder="Cari nama, NIK/NIP, atau catatan..."
                className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] bg-white pl-10 pr-3.5 text-sm text-[#3A0B07] placeholder:text-[#A68B7E] focus:border-[#D1510A] focus:outline-none"
              />
            </div>

            <select
              value={attDepartment}
              onChange={(e) => {
                setAttDepartment(e.target.value);
                setAttPage(1);
              }}
              aria-label="Filter departemen absensi"
              className="min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm text-[#3A0B07] focus:border-[#D1510A] focus:outline-none"
            >
              <option value="">Semua Departemen</option>
              {DEPARTMENTS.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={attDate}
              onChange={(e) => {
                setAttDate(e.target.value);
                setAttPage(1);
              }}
              aria-label="Filter tanggal absensi"
              className="min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm text-[#3A0B07] focus:border-[#D1510A] focus:outline-none"
            />
          </div>

          {attLoading ? (
            <div className="py-12 flex items-center justify-center gap-3 text-sm text-[#6E4A3E]">
              <RefreshCw className="w-4 h-4 animate-spin text-[#D1510A]" />
              <span>Memuat data absensi WFH...</span>
            </div>
          ) : attError ? (
            <div className="mt-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] p-4 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 text-sm text-[#B91C1C]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{attError}</span>
              </div>
              <button
                type="button"
                onClick={loadAttendances}
                className="min-h-[44px] px-3.5 rounded-md border border-[#FECACA] bg-white text-sm font-medium text-[#B91C1C] cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : !attendances || attendances.items.length === 0 ? (
            <div className="py-12 text-center text-sm text-[#6E4A3E]">
              Belum ada catatan absensi WFH untuk filter yang dipilih.
            </div>
          ) : (
            <>
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-[#EADCD3] text-xs font-semibold uppercase tracking-wider text-[#6E4A3E]">
                      <th className="py-3 pr-4">Karyawan</th>
                      <th className="py-3 px-4">Departemen</th>
                      <th className="py-3 px-4">Tanggal</th>
                      <th className="py-3 px-4">Jam Masuk</th>
                      <th className="py-3 px-4">Catatan</th>
                      <th className="py-3 pl-4 text-right">Bukti Foto</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EADCD3]">
                    {attendances.items.map((item) => (
                      <tr key={item.id} className="hover:bg-[#FAF6F3]">
                        <td className="py-3.5 pr-4">
                          <p className="font-semibold text-[#3A0B07]">
                            {item.employee?.fullName ?? '-'}
                          </p>
                          <p className="text-xs font-mono-tabular text-[#6E4A3E]">
                            {item.employee?.employeeCode ?? '-'} · {item.employee?.position ?? '-'}
                          </p>
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#6E4A3E]">
                          {item.employee?.department ?? '-'}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap text-[#3A0B07]">
                          {formatDateId(item.attendanceDate)}
                        </td>
                        <td className="py-3.5 px-4 whitespace-nowrap font-mono-tabular font-semibold text-[#15803D]">
                          {formatTimeId(item.clockInAt)}
                        </td>
                        <td className="py-3.5 px-4 text-[#6E4A3E] max-w-xs truncate">
                          {item.notes || '—'}
                        </td>
                        <td className="py-3.5 pl-4 text-right">
                          <button
                            type="button"
                            onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                            className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-xs font-medium text-[#7E2908] cursor-pointer"
                          >
                            <FileImage className="w-3.5 h-3.5" />
                            Lihat Foto
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {attendances.meta.totalPages > 1 && (
                <div className="mt-4 pt-4 border-t border-[#EADCD3] flex items-center justify-between text-xs text-[#6E4A3E]">
                  <span>
                    Halaman <strong className="text-[#3A0B07]">{attendances.meta.page}</strong> dari{' '}
                    <strong className="text-[#3A0B07]">{attendances.meta.totalPages}</strong> (
                    {attendances.meta.total} absensi)
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={attPage <= 1}
                      onClick={() => setAttPage((p) => Math.max(1, p - 1))}
                      className="min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white disabled:opacity-50 text-xs font-medium text-[#3A0B07] cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={attPage >= attendances.meta.totalPages}
                      onClick={() => setAttPage((p) => p + 1)}
                      className="min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white disabled:opacity-50 text-xs font-medium text-[#3A0B07] cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          </div>
        </section>
      )}

      {/* Add / Edit Employee Modal */}
      {empModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={editingEmp ? 'Edit Karyawan' : 'Tambah Karyawan'}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A0B07]/70 p-4 overflow-y-auto"
          onClick={() => setEmpModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-lg border border-[#D2BBAE] p-5 sm:p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#EADCD3]">
              <h3 className="text-base font-bold text-[#3A0B07]">
                {editingEmp ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setEmpModalOpen(false)}
                aria-label="Tutup modal"
                className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-md hover:bg-[#FAF6F3] text-[#6E4A3E] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div
                role="alert"
                className="mt-4 flex items-start gap-2.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-sm text-[#B91C1C]"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveEmployee} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    Kode Karyawan (NIK/NIP) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.employeeCode}
                    onChange={(e) => setFormState({ ...formState, employeeCode: e.target.value })}
                    placeholder="EMP-004"
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] px-3 text-sm font-mono-tabular focus:border-[#D1510A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    Nama Lengkap *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.fullName}
                    onChange={(e) => setFormState({ ...formState, fullName: e.target.value })}
                    placeholder="Dewi Lestari"
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    Email Perusahaan *
                  </label>
                  <input
                    type="email"
                    required
                    value={formState.email}
                    onChange={(e) => setFormState({ ...formState, email: e.target.value })}
                    placeholder="dewi@company.local"
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    {editingEmp ? 'Password Baru (Opsional)' : 'Password *'}
                  </label>
                  <input
                    type="password"
                    required={!editingEmp}
                    minLength={6}
                    value={formState.password ?? ''}
                    onChange={(e) => setFormState({ ...formState, password: e.target.value })}
                    placeholder={editingEmp ? 'Kosongkan jika tidak diubah' : 'Minimal 6 karakter'}
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    Departemen *
                  </label>
                  <select
                    value={formState.department}
                    onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    Jabatan *
                  </label>
                  <input
                    type="text"
                    required
                    value={formState.position}
                    onChange={(e) => setFormState({ ...formState, position: e.target.value })}
                    placeholder="QA Engineer"
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">
                    No. Telepon
                  </label>
                  <input
                    type="text"
                    value={formState.phone ?? ''}
                    onChange={(e) => setFormState({ ...formState, phone: e.target.value })}
                    placeholder="0812..."
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">Role</label>
                  <select
                    value={formState.role}
                    onChange={(e) => setFormState({ ...formState, role: e.target.value as Role })}
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="HRD_ADMIN">HRD_ADMIN</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#3A0B07] mb-1">Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) =>
                      setFormState({ ...formState, status: e.target.value as EmployeeStatus })
                    }
                    className="w-full min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm focus:border-[#D1510A] focus:outline-none"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5 border-t border-[#EADCD3]">
                <button
                  type="button"
                  onClick={() => setEmpModalOpen(false)}
                  className="min-h-[44px] px-4 rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-sm font-medium text-[#3A0B07] cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={formSaving}
                  className="min-h-[44px] px-5 rounded-md bg-[#7E2908] hover:bg-[#5E1D05] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
                >
                  {formSaving ? 'Menyimpan...' : editingEmp ? 'Simpan Perubahan' : 'Tambah Karyawan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingEmp && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Konfirmasi Hapus Karyawan"
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#3A0B07]/70 p-4"
          onClick={() => setDeletingEmp(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-lg border border-[#D2BBAE] p-5 sm:p-6 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-base font-bold text-[#3A0B07]">Hapus Karyawan?</h3>
            <p className="mt-2 text-sm text-[#6E4A3E]">
              Data karyawan <strong className="text-[#3A0B07]">{deletingEmp.fullName}</strong> (
              <span className="font-mono-tabular">{deletingEmp.employeeCode}</span>) beserta riwayat
              absensinya akan dihapus permanen.
            </p>

            {deleteError && (
              <div className="mt-3 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3 py-2 text-xs text-[#B91C1C]">
                {deleteError}
              </div>
            )}

            <div className="mt-5 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingEmp(null)}
                className="min-h-[44px] px-4 rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-sm font-medium text-[#3A0B07] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={deleteLoading}
                onClick={handleConfirmDelete}
                className="min-h-[44px] px-4 rounded-md bg-[#B91C1C] hover:bg-[#991B1B] disabled:opacity-60 text-white text-sm font-semibold cursor-pointer"
              >
                {deleteLoading ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
