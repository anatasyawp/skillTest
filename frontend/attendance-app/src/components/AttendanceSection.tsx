import { FC, FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  FileImage,
  ImageIcon,
  RefreshCw,
  RotateCcw,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import {
  ASSET_BASE_URL,
  AttendanceItem,
  AuthUser,
  fetchMyAttendances,
  fetchTodayStatus,
  PaginatedResponse,
  submitCheckIn,
  TodayStatusResponse,
} from '../api';
import { formatDateId, formatTimeId } from '../utils/date';

interface AttendanceSectionProps {
  user?: AuthUser | null;
  onPreviewPhoto: (url: string) => void;
}

export const AttendanceSection: FC<AttendanceSectionProps> = ({ user, onPreviewPhoto }) => {
  const [now, setNow] = useState(() => new Date());

  // Today's attendance status
  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);

  // Form & Upload state (pure file upload, camera removed)
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<PaginatedResponse<AttendanceItem> | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  // Live Clock ticker
  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  // Fetch status and history
  const loadTodayStatus = useCallback(async () => {
    setTodayLoading(true);
    setTodayError(null);
    try {
      const data = await fetchTodayStatus();
      setTodayStatus(data);
    } catch (err) {
      setTodayError(err instanceof Error ? err.message : 'Gagal memuat status presensi hari ini.');
    } finally {
      setTodayLoading(false);
    }
  }, []);

  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const data = await fetchMyAttendances({
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        page,
        limit: 5,
      });
      setHistory(data);
    } catch (err) {
      setHistoryError(err instanceof Error ? err.message : 'Gagal memuat riwayat absensi.');
    } finally {
      setHistoryLoading(false);
    }
  }, [startDate, endDate, page]);

  useEffect(() => {
    loadTodayStatus();
    loadHistory();
  }, [loadTodayStatus, loadHistory]);

  const handleFileChange = (file: File | null) => {
    setSubmitError(null);
    if (!file) {
      setPhotoFile(null);
      setPhotoPreview(null);
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSubmitError('Format foto harus JPG, PNG, atau WEBP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Ukuran foto maksimal 5 MB.');
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const resetPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setSubmitError(null);
  };

  // Submit attendance
  const handleCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitSuccess(null);

    if (!photoFile) {
      setSubmitError('Foto bukti presensi WFH/WFA wajib diunggah.');
      return;
    }

    setSubmitting(true);
    try {
      await submitCheckIn(photoFile, notes.trim());
      setSubmitSuccess('Presensi WFH/WFA Anda berhasil terverifikasi dan tercatat di server.');
      setPhotoFile(null);
      setPhotoPreview(null);
      setNotes('');
      await loadTodayStatus();
      await loadHistory();
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim presensi.');
    } finally {
      setSubmitting(false);
    }
  };

  // Refresh all
  const handleRefresh = () => {
    loadTodayStatus();
    loadHistory();
  };

  const employeeName = user?.employee?.fullName ?? user?.email?.split('@')[0] ?? 'Karyawan';
  const formattedToday = now.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Weekly calendar strip with attendance matching
  const currentDayIndex = now.getDay();
  const mondayOffset = currentDayIndex === 0 ? -6 : 1 - currentDayIndex;
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now);
    d.setDate(now.getDate() + mondayOffset + i);
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const dateStr = d.toISOString().split('T')[0];
    const hasAttendedOnDate = Boolean(
      (todayStatus?.hasClockedIn && d.toDateString() === now.toDateString()) ||
        history?.items.some((item) => item.attendanceDate?.startsWith(dateStr)),
    );

    return {
      name: dayNames[d.getDay()],
      date: d.getDate(),
      isToday: d.toDateString() === now.toDateString(),
      attended: hasAttendedOnDate,
    };
  });

  return (
    <div className="space-y-6">
      {/* 1. COMPACT PAGE HEADER: Sapaan & Waktu Realtime */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#800020]" />
            <span>Employee Workspace • DEXAsync</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Hi, {employeeName}! 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Presensi kerja remote mandiri (WFH/WFA) ·{' '}
            <span className="font-medium text-slate-700">{formattedToday}</span>
          </p>
        </div>

        {/* Live Digital Clock & Refresh */}
        <div className="flex items-center gap-2.5 self-start sm:self-auto">
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-white shadow-2xs font-mono text-xs">
            <Clock className="w-3.5 h-3.5 text-[#800020]" />
            <span className="font-bold text-slate-900">
              {now.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
            <span className="text-[10px] text-slate-400 font-sans font-bold">WIB</span>
          </div>

          <button
            type="button"
            onClick={handleRefresh}
            disabled={todayLoading || historyLoading}
            className="inline-flex items-center gap-1.5 min-h-[34px] px-3 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs cursor-pointer disabled:opacity-60"
            title="Segarkan data presensi"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-slate-500 ${
                todayLoading || historyLoading ? 'animate-spin' : ''
              }`}
            />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* 2. SUMMARY METRICS STRIP: Ringkasan Status Kehadiran Minimalis & Interaktif */}
      <section aria-label="Status Kehadiran" className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* Metric 1: Status Presensi Hari Ini */}
        <div
          className={`card-interactive relative overflow-hidden rounded-2xl border p-4 sm:p-5 shadow-2xs group ${
            todayStatus?.hasClockedIn
              ? 'bg-gradient-to-br from-white via-white to-emerald-50/60 border-emerald-200/90'
              : 'bg-gradient-to-br from-white via-white to-amber-50/40 border-slate-200/90 hover:border-amber-300'
          }`}
        >
          {/* Subtle top accent gradient stripe */}
          <div
            className={`absolute top-0 inset-x-0 h-1 bg-gradient-to-r ${
              todayStatus?.hasClockedIn
                ? 'from-emerald-500 via-emerald-400 to-transparent'
                : 'from-amber-400 via-amber-300 to-transparent'
            }`}
          />
          <div className="flex items-center justify-between">
            <span
              className={`text-xs font-semibold uppercase tracking-wider ${
                todayStatus?.hasClockedIn ? 'text-emerald-700' : 'text-slate-500'
              }`}
            >
              Status Hari Ini
            </span>
            <div
              className={`h-8 w-8 rounded-xl flex items-center justify-center transition-transform duration-300 group-hover:scale-110 ${
                todayStatus?.hasClockedIn ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100/70 text-amber-600'
              }`}
            >
              {todayStatus?.hasClockedIn ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <Clock className="w-4 h-4" />
              )}
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span
              className={`text-lg sm:text-xl font-extrabold tracking-tight ${
                todayStatus?.hasClockedIn ? 'text-emerald-800' : 'text-slate-900'
              }`}
            >
              {todayStatus?.hasClockedIn ? 'Sudah Presensi' : 'Belum Presensi'}
            </span>
          </div>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {todayStatus?.hasClockedIn && todayStatus.attendance
              ? `Tercatat pukul ${formatTimeId(todayStatus.attendance.clockInAt)} WIB`
              : 'Unggah foto bukti kehadiran di bawah'}
          </p>
        </div>

        {/* Metric 2: Total Kehadiran Bulan Ini */}
        <div className="card-interactive relative overflow-hidden bg-gradient-to-br from-white via-white to-rose-50/50 hover:border-[#800020]/30 rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-[#800020] via-[#DC2626] to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Kehadiran Bulan Ini
            </span>
            <div className="h-8 w-8 rounded-xl bg-[#800020]/10 text-[#800020] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <CalendarCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {historyLoading ? '—' : history?.meta.total ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">Hari WFH</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Presensi terverifikasi otomatis
          </p>
        </div>

        {/* Metric 3: Total Log Presensi */}
        <div className="card-interactive relative overflow-hidden bg-gradient-to-br from-white via-white to-slate-100/70 hover:border-slate-300 rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs group">
          <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-slate-400 via-slate-300 to-transparent" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Total Riwayat Presensi
            </span>
            <div className="h-8 w-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
              <ShieldCheck className="w-4 h-4 text-[#800020]" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900 font-mono tracking-tight">
              {historyLoading ? '—' : history?.meta.total ?? 0}
            </span>
            <span className="text-xs text-slate-500 font-medium">Log tercatat</span>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Arsip riwayat kerja mandiri DEXA
          </p>
        </div>
      </section>

      {/* 3. MAIN DASHBOARD WORKSPACE: PRIMARY SUBMISSION FOCUS + HISTORY */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* === PRIMARY FOCUS: ATTENDANCE SUBMISSION AREA (Col 1-7) === */}
        <section
          aria-label="Attendance Submission Form"
          className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-7 shadow-2xs space-y-5 relative overflow-hidden"
        >
          {/* Card Header: Task-Oriented & Minimalist */}
          <div className="pb-4 border-b border-slate-100 flex items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-[#800020]/10 flex items-center justify-center text-[#800020]">
                  <Upload className="w-4 h-4" />
                </div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900">
                  Attendance Submission
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Unggah foto bukti kehadiran kerja remote (WFH/WFA) hari ini.
              </p>
            </div>

            {/* Daily Rule Pill */}
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-600 font-mono">
              1x / Hari
            </span>
          </div>

          {todayLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-2.5 text-xs text-slate-500">
              <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
              <span>Memeriksa status presensi hari ini...</span>
            </div>
          ) : todayError ? (
            <div className="p-4 rounded-xl border border-red-200 bg-red-50/80 flex items-center justify-between text-xs text-red-800">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{todayError}</span>
              </div>
              <button
                type="button"
                onClick={loadTodayStatus}
                className="px-3 py-1 rounded-lg border border-red-200 bg-white font-bold text-red-700 hover:bg-red-50 cursor-pointer"
              >
                Coba Lagi
              </button>
            </div>
          ) : todayStatus?.hasClockedIn && todayStatus.attendance ? (
            /* BERHASIL DEXO: CELEBRATORY SUCCESS STATE WITH FLOATING ANIMATION & GRADIENT AURA */
            <div className="relative rounded-2xl border border-emerald-200/90 bg-gradient-to-b from-emerald-50/90 via-white to-emerald-50/40 p-6 sm:p-8 text-center space-y-4 shadow-sm overflow-hidden animate-in fade-in duration-300">
              {/* Ambient radial glow backdrop behind mascot */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 h-44 w-44 rounded-full bg-emerald-200/50 blur-2xl -z-0"
              />

              {/* Prominent BERHASIL DEXO Mascot with Gentle Floating Animation */}
              <div className="relative z-10 mx-auto flex items-center justify-center py-2">
                <img
                  src="/berhasil-dexo.png"
                  alt="DEXO Berhasil Presensi"
                  className="h-28 sm:h-36 w-auto object-contain drop-shadow-lg animate-float-gentle"
                />
              </div>

              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300/80 px-3.5 py-1 text-xs font-bold uppercase tracking-wider mb-2 shadow-2xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Presensi Berhasil Terverifikasi</span>
                </span>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900">
                  Kerja Bagus! Anda Sudah Absen Hari Ini 🎉
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-md mx-auto leading-relaxed">
                  Presensi harian telah dicatat oleh server pada:{' '}
                  <strong className="text-slate-900 font-mono font-bold">
                    {formatTimeId(todayStatus.attendance.clockInAt)} WIB
                  </strong>
                  . Sistem membatasi satu kali presensi per hari kerja.
                </p>
              </div>

              {todayStatus.attendance.notes && (
                <div className="relative z-10 max-w-md mx-auto bg-white/95 backdrop-blur-xs rounded-xl p-3.5 border border-emerald-200/90 text-xs text-slate-700 text-left shadow-2xs">
                  <span className="font-semibold text-slate-900 block mb-0.5">Catatan Rencana Kerja:</span>
                  <p className="leading-relaxed">{todayStatus.attendance.notes}</p>
                </div>
              )}

              {/* View Uploaded Photo Proof */}
              <div className="relative z-10 pt-2">
                <button
                  type="button"
                  onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${todayStatus.attendance!.photoUrl}`)}
                  className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 hover:border-[#800020] px-4 py-2.5 text-xs font-bold text-slate-800 shadow-2xs hover:bg-slate-50 transition-all cursor-pointer hover:shadow-xs"
                >
                  <FileImage className="w-4 h-4 text-[#800020]" />
                  <span>Lihat Foto Bukti Presensi</span>
                </button>
              </div>
            </div>
          ) : (
            /* SUBMISSION FORM: UPLOAD ONLY */
            <form onSubmit={handleCheckIn} className="space-y-4.5">
              {/* Submission Error Banner with Gagal DEXO Mascot */}
              {submitError && (
                <div
                  role="alert"
                  className="flex items-center gap-3.5 rounded-2xl border border-red-200 bg-red-50/95 p-3.5 sm:p-4 text-xs text-red-700 shadow-2xs animate-in fade-in duration-200"
                >
                  <div className="shrink-0 flex items-center justify-center p-1 bg-white rounded-xl border border-red-100 shadow-2xs">
                    <img
                      src="/gagal-dexo.png"
                      alt="DEXO Peringatan"
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-red-900 text-xs sm:text-sm">Gagal Mengirim Presensi</p>
                    <p className="mt-0.5 text-xs text-red-700 leading-relaxed">{submitError}</p>
                  </div>
                </div>
              )}

              {/* Submission Success Banner with Berhasil DEXO Mascot */}
              {submitSuccess && (
                <div
                  role="status"
                  className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/95 p-3.5 sm:p-4 text-xs text-emerald-800 shadow-2xs animate-in fade-in duration-200"
                >
                  <div className="shrink-0 flex items-center justify-center p-1 bg-white rounded-xl border border-emerald-100 shadow-2xs">
                    <img
                      src="/berhasil-dexo.png"
                      alt="DEXO Berhasil"
                      className="h-12 w-12 sm:h-14 sm:w-14 object-contain drop-shadow-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-emerald-950 text-xs sm:text-sm">Presensi Terverifikasi!</p>
                    <p className="mt-0.5 text-xs text-emerald-700 leading-relaxed">{submitSuccess}</p>
                  </div>
                </div>
              )}

              {/* Pure Photo Upload Dropzone / Preview */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Unggah Foto Bukti Kehadiran *
                </label>

                {photoPreview ? (
                  /* Photo Preview State */
                  <div className="relative rounded-2xl border border-slate-200 bg-white p-4 flex flex-col items-center justify-center">
                    <img
                      src={photoPreview}
                      alt="Preview Foto Bukti"
                      className="max-h-64 sm:max-h-72 w-auto object-contain rounded-xl shadow-xs border border-slate-200"
                    />
                    <div className="mt-3 flex items-center justify-between w-full max-w-sm pt-2 border-t border-slate-100">
                      <div className="min-w-0 pr-3">
                        <p className="text-xs font-medium text-slate-900 truncate">
                          {photoFile?.name}
                        </p>
                        <p className="text-[11px] text-slate-400 font-mono">
                          {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetPhoto}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-[#800020] cursor-pointer shadow-2xs shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* File Upload Dropzone */
                  <label className="relative flex flex-col items-center justify-center w-full min-h-[220px] sm:min-h-[260px] p-6 rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50/70 hover:bg-slate-100/60 hover:border-[#800020]/50 transition-all text-center cursor-pointer group">
                    <div className="h-14 w-14 rounded-2xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-[#800020] mb-3 group-hover:scale-105 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <span className="text-sm font-bold text-slate-900">
                      Pilih atau Unggah Foto Bukti Presensi
                    </span>
                    <span className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                      Klik untuk memilih file foto bukti kerja dari perangkat Anda
                    </span>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-200/60 px-3 py-1 rounded-full">
                      JPG, PNG, WEBP • Maksimal 5 MB
                    </span>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
                    />
                  </label>
                )}
              </div>

              {/* Notes Input */}
              <div>
                <label htmlFor="wfh-notes" className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Rencana Kerja Hari Ini (Opsional)
                </label>
                <textarea
                  id="wfh-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sprint review, implementasi fitur, koordinasi tim..."
                  className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:border-[#800020] focus:ring-1 focus:ring-[#800020] focus:outline-none"
                />
              </div>

              {/* Prominent Primary Action Button: Submit Attendance */}
              <button
                type="submit"
                disabled={submitting || !photoFile}
                className="w-full min-h-[46px] rounded-xl bg-[#800020] hover:bg-[#68001A] active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm shadow-md shadow-[#800020]/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim Presensi ke Server...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Submit Attendance</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* === RIGHT COLUMN: WEEKLY CALENDAR & ATTENDANCE HISTORY (Col 8-12) === */}
        <div className="lg:col-span-5 space-y-5">
          {/* 1. Weekly Mini Calendar Strip: Compact & Meaningful */}
          <section
            aria-label="Kalender Kehadiran Minggu Ini"
            className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-2xs"
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#800020]" />
                <span>Minggu Ini</span>
              </span>
              <span className="text-[11px] font-mono text-slate-400">
                {now.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center">
              {weekDays.map((d, idx) => (
                <div
                  key={idx}
                  className={`py-2 px-1 rounded-xl transition-all ${
                    d.isToday
                      ? 'bg-[#800020] text-white font-bold shadow-xs'
                      : d.attended
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                      : 'bg-slate-50 text-slate-500'
                  }`}
                >
                  <p className="text-[10px] uppercase font-semibold">{d.name}</p>
                  <p className="text-xs font-bold font-mono mt-0.5">{d.date}</p>
                  {d.attended && !d.isToday && (
                    <span className="block h-1 w-1 bg-emerald-500 rounded-full mx-auto mt-0.5" />
                  )}
                  {d.isToday && (
                    <span className="block h-1 w-1 bg-white rounded-full mx-auto mt-0.5" />
                  )}
                </div>
              ))}
            </div>
          </section>

          {/* 2. Attendance History: Easy to Scan List with Date Filters */}
          <section
            aria-label="Riwayat Presensi WFH"
            className="bg-white rounded-2xl border border-slate-200/90 p-4 sm:p-5 shadow-2xs space-y-3.5"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Riwayat Kehadiran</h3>
                <p className="text-xs text-slate-400 mt-0.5">Arsip foto bukti &amp; waktu presensi</p>
              </div>

              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  className="text-xs font-semibold text-[#800020] hover:text-[#DC2626] cursor-pointer"
                >
                  Reset Filter
                </button>
              )}
            </div>

            {/* Date Filters: Compact */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label htmlFor="filter-start" className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                  Dari
                </label>
                <input
                  id="filter-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:border-[#800020] focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="filter-end" className="block text-[10px] font-semibold text-slate-500 uppercase mb-0.5">
                  Sampai
                </label>
                <input
                  id="filter-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="w-full text-xs rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-slate-800 focus:border-[#800020] focus:outline-none"
                />
              </div>
            </div>

            {/* History List */}
            {historyLoading ? (
              <div className="py-10 flex flex-col items-center justify-center gap-2 text-xs text-slate-400">
                <RefreshCw className="w-4 h-4 animate-spin text-[#800020]" />
                <span>Memuat riwayat...</span>
              </div>
            ) : historyError ? (
              <div className="p-3 rounded-xl border border-red-200 bg-red-50 text-xs text-red-700">
                {historyError}
              </div>
            ) : !history || history.items.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400 bg-slate-50 rounded-xl p-4">
                Belum ada catatan riwayat absensi.
              </div>
            ) : (
              <div className="space-y-2.5">
                {history.items.map((item) => (
                  <div
                    key={item.id}
                    className="card-interactive p-3.5 rounded-xl bg-gradient-to-br from-white via-white to-slate-50/80 border border-slate-200/90 hover:border-[#800020]/30 transition-all flex items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Photo Thumbnail */}
                      <button
                        type="button"
                        onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                        className="relative h-11 w-11 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:opacity-90 transition-opacity cursor-pointer group"
                        title="Klik untuk memperbesar foto bukti"
                      >
                        <img
                          src={`${ASSET_BASE_URL}${item.photoUrl}`}
                          alt="Bukti Presensi"
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-200"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ImageIcon className="w-3.5 h-3.5 text-white" />
                        </div>
                      </button>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-bold text-slate-900 truncate">
                            {formatDateId(item.attendanceDate, true)}
                          </p>
                          <span className="inline-flex items-center text-[10px] font-semibold text-emerald-700">
                            Valid
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-slate-500 mt-0.5">
                          Masuk: <strong className="text-slate-800">{formatTimeId(item.clockInAt)} WIB</strong>
                        </p>
                        {item.notes && (
                          <p className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-[11px] font-semibold text-slate-700 shrink-0 cursor-pointer shadow-2xs"
                    >
                      Foto
                    </button>
                  </div>
                ))}

                {/* Pagination Controls */}
                {history.meta.totalPages > 1 && (
                  <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Hal <strong className="text-slate-900">{history.meta.page}</strong> dari{' '}
                      <strong className="text-slate-900">{history.meta.totalPages}</strong>
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        disabled={page <= 1}
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        Prev
                      </button>
                      <button
                        type="button"
                        disabled={page >= history.meta.totalPages}
                        onClick={() => setPage((p) => p + 1)}
                        className="px-2.5 py-1 rounded-lg border border-slate-200 bg-white disabled:opacity-40 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer shadow-2xs"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
};
