import { FC, FormEvent, useCallback, useEffect, useRef, useState } from 'react';
import {
  AlertCircle,
  Calendar,
  CalendarCheck,
  Check,
  CheckCircle2,
  Clock,
  FileImage,
  RefreshCw,
  RotateCcw,
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
import { CustomDatePicker } from './common/CustomDatePicker';

interface AttendanceSectionProps {
  user?: AuthUser | null;
  onPreviewPhoto: (url: string) => void;
}

export const AttendanceSection: FC<AttendanceSectionProps> = ({ user, onPreviewPhoto }) => {
  const [now, setNow] = useState(() => new Date());

  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [celebrating, setCelebrating] = useState(false);
  const [photoReadyTick, setPhotoReadyTick] = useState(0);
  const [errorShakeTick, setErrorShakeTick] = useState(0);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const celebrateTimerRef = useRef<number | null>(null);

  const [history, setHistory] = useState<PaginatedResponse<AttendanceItem> | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    return () => {
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }
    };
  }, [photoPreview]);

  useEffect(() => {
    return () => {
      if (celebrateTimerRef.current !== null) {
        window.clearTimeout(celebrateTimerRef.current);
      }
    };
  }, []);

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
        limit: 6,
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
      setErrorShakeTick((n) => n + 1);
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setSubmitError('Ukuran foto maksimal 5 MB.');
      setErrorShakeTick((n) => n + 1);
      return;
    }

    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setPhotoReadyTick((n) => n + 1);
  };

  const resetPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
    setSubmitError(null);
  };

  const handleCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!photoFile) {
      setSubmitError('Foto bukti presensi WFH wajib diunggah.');
      setErrorShakeTick((n) => n + 1);
      return;
    }

    setSubmitting(true);
    try {
      await submitCheckIn(photoFile, notes.trim());
      setPhotoFile(null);
      setPhotoPreview(null);
      setNotes('');
      setCelebrating(true);
      await Promise.all([loadTodayStatus(), loadHistory()]);
      if (celebrateTimerRef.current !== null) {
        window.clearTimeout(celebrateTimerRef.current);
      }
      celebrateTimerRef.current = window.setTimeout(() => {
        setCelebrating(false);
      }, 1100);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim presensi.');
      setErrorShakeTick((n) => n + 1);
    } finally {
      setSubmitting(false);
    }
  };

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
    <div className="flex flex-col lg:flex-row min-h-[calc(100vh-2rem)] gap-4 lg:gap-6">
      {/* LEFT WHITE COLUMN: Personal Overview, Clock & Weekly Strip */}
      <aside className="w-full lg:w-[320px] xl:w-[350px] shrink-0 bg-white px-4 sm:px-6 lg:px-3 py-5 lg:py-3 flex flex-col gap-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#2A040A]">
              Halo, {employeeName}
            </h1>
            <p className="text-sm text-[#634E53] mt-1">{formattedToday}</p>
          </div>
          <button
            type="button"
            onClick={handleRefresh}
            disabled={todayLoading || historyLoading}
            aria-label="Segarkan presensi"
            title="Segarkan presensi"
            className="h-10 w-10 rounded-full border border-[#E7DFE2] bg-[#FAF8F9] hover:bg-white text-[#2A040A] inline-flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw
              className={`w-4 h-4 ${todayLoading || historyLoading ? 'animate-spin text-[#800020]' : ''}`}
            />
          </button>
        </div>

        {/* Live Clock Pill */}
        <div className="rounded-3xl bg-[#2A040A] text-white p-5 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs text-[#E7D8DC] font-medium">Waktu Server Lokal</p>
            <p className="text-2xl font-bold font-mono-tabular tracking-tight mt-1">
              {now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </p>
          </div>
          <div className="h-12 w-12 rounded-full bg-[#FBE8EC] text-[#800020] flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* 2 Tactile Status Tiles */}
        <div className="grid grid-cols-2 gap-3.5">
          <div
            className={`rounded-3xl p-4 text-center flex flex-col items-center justify-center gap-2.5 border min-h-[136px] ${
              todayStatus?.hasClockedIn
                ? 'bg-white border-[#BBF7D0]'
                : 'bg-[#FAF8F9] border-[#F0EAEB]'
            }`}
          >
            <div
              className={`h-13 w-13 rounded-full flex items-center justify-center ${
                todayStatus?.hasClockedIn
                  ? 'bg-[#ECFDF5] text-[#047857]'
                  : 'bg-[#FBF2E6] text-[#9A4D08]'
              }`}
            >
              {todayStatus?.hasClockedIn ? (
                <CheckCircle2 className="w-5 h-5" />
              ) : (
                <Clock className="w-5 h-5" />
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-[#634E53]">Hari Ini</p>
              <p className="text-sm font-bold text-[#2A040A] mt-0.5">
                {todayStatus?.hasClockedIn ? 'Sudah Absen' : 'Belum Absen'}
              </p>
            </div>
          </div>

          <div className="rounded-3xl p-4 text-center flex flex-col items-center justify-center gap-2.5 border border-[#F2C8D2] bg-white min-h-[136px]">
            <div className="h-13 w-13 rounded-full bg-[#FBE8EC] text-[#800020] flex items-center justify-center">
              <CalendarCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-semibold text-[#634E53]">Total Hadir</p>
              <p className="text-sm font-bold font-mono-tabular text-[#2A040A] mt-0.5">
                {historyLoading ? '—' : `${history?.meta.total ?? 0} hari`}
              </p>
            </div>
          </div>
        </div>

        {/* Weekly Mini Calendar Strip */}
        <div className="rounded-3xl border border-[#ECE4E7] bg-[#FAF8F9] p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-[#2A040A] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-[#800020]" />
              <span>Minggu Ini</span>
            </span>
            <span className="text-[11px] font-mono-tabular text-[#634E53]">
              {now.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' })}
            </span>
          </div>

          <div className="grid grid-cols-7 gap-1.5 text-center">
            {weekDays.map((d, idx) => (
              <div
                key={idx}
                className={`py-2 px-1 rounded-2xl ${
                  d.isToday
                    ? 'bg-[#800020] text-white font-bold'
                    : d.attended
                    ? 'bg-[#ECFDF5] text-[#047857] border border-[#BBF7D0]'
                    : 'bg-white text-[#634E53] border border-[#ECE4E7]'
                }`}
              >
                <p className="text-[10px] font-semibold">{d.name}</p>
                <p className="text-xs font-bold font-mono-tabular mt-0.5">{d.date}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>

      {/* RIGHT SOFT ALABASTER WORKSPACE CANVAS */}
      <div className="flex-1 min-w-0 bg-[#F7F4F5] lg:rounded-[32px] p-4 sm:p-6 lg:p-8 space-y-8">
        {/* TOP SECTION: ATTENDANCE SUBMISSION */}
        <section
          id="attendance-upload-zone"
          aria-label="Form Presensi WFH"
          className="bg-white rounded-3xl border border-[#ECE4E7] p-5 sm:p-7 space-y-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-[#F2ECEE]">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2A040A]">Presensi WFH</h2>
              <p className="text-xs sm:text-sm text-[#634E53] mt-0.5">
                Unggah foto bukti kerja remote untuk mencatat kehadiran hari ini.
              </p>
            </div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#FBE8EC] text-[#800020] font-mono-tabular">
              1x / Hari
            </span>
          </div>

          {todayLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2.5 text-sm text-[#634E53]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
              <span>Memeriksa status presensi hari ini...</span>
            </div>
          ) : todayError ? (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-between gap-3 text-sm text-red-800">
              <div className="flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                <span>{todayError}</span>
              </div>
              <button
                type="button"
                onClick={loadTodayStatus}
                className="min-h-[40px] px-3.5 rounded-xl border border-red-200 bg-white font-semibold text-red-700 hover:bg-red-50 cursor-pointer shrink-0"
              >
                Coba Lagi
              </button>
            </div>
          ) : todayStatus?.hasClockedIn && todayStatus.attendance ? (
            <div className="rounded-3xl border border-[#BBF7D0] bg-[#F5FBF8] p-6 text-center space-y-4">
              <div className="mx-auto flex flex-col items-center justify-center">
                <img
                  key={celebrating ? 'celebrate' : 'thanks'}
                  src={celebrating ? '/berhasil-dexo.png' : '/terimakasih-dexo.png'}
                  alt={celebrating ? 'DEXO merayakan presensi berhasil' : 'DEXO mengucapkan terima kasih'}
                  className={`h-28 sm:h-32 w-auto object-contain ${
                    celebrating ? 'animate-dexo-celebrate' : 'animate-dexo-bow'
                  }`}
                />
                <div
                  aria-hidden="true"
                  className={`w-16 h-2.5 -mt-1 rounded-full bg-[#047857]/12 transition-all duration-300 ${
                    celebrating ? 'opacity-40 scale-75' : 'opacity-100 scale-100'
                  }`}
                />
              </div>

              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ECFDF5] text-[#047857] border border-[#BBF7D0] px-3.5 py-1 text-xs font-bold mb-2">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{celebrating ? 'Presensi Berhasil Dikirim!' : 'Presensi Hari Ini Tercatat'}</span>
                </span>
                <p className="text-sm text-[#634E53] max-w-md mx-auto">
                  Waktu check-in:{' '}
                  <strong className="text-[#2A040A] font-mono-tabular">
                    {formatTimeId(todayStatus.attendance.clockInAt)} WIB
                  </strong>
                </p>
              </div>

              {todayStatus.attendance.notes && (
                <div className="max-w-md mx-auto bg-white rounded-2xl p-3.5 border border-[#D8EFE4] text-xs text-[#2A040A] text-left">
                  <span className="font-bold text-[#634E53] block mb-0.5">Catatan Aktivitas:</span>
                  <p className="leading-relaxed">{todayStatus.attendance.notes}</p>
                </div>
              )}

              <div>
                <button
                  type="button"
                  onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${todayStatus.attendance!.photoUrl}`)}
                  className="min-h-[42px] px-5 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white text-xs sm:text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
                >
                  <FileImage className="w-4 h-4" />
                  <span>Lihat Foto Bukti</span>
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCheckIn} className="space-y-4">
              {/* Reactive DEXO Companion Strip */}
              <div
                role={submitError ? 'alert' : 'status'}
                className={`flex items-center gap-3.5 rounded-2xl border px-4 py-3 transition-colors ${
                  submitError
                    ? 'border-red-200 bg-red-50 text-red-800'
                    : submitting
                    ? 'border-[#F2C8D2] bg-[#FDF2F4] text-[#2A040A]'
                    : photoPreview
                    ? 'border-[#BBF7D0] bg-[#F5FBF8] text-[#2A040A]'
                    : 'border-[#ECE4E7] bg-[#FAF8F9] text-[#2A040A]'
                }`}
              >
                <div className="shrink-0 flex flex-col items-center">
                  <img
                    key={
                      submitting
                        ? 'submitting'
                        : submitError
                        ? `err-${errorShakeTick}`
                        : photoPreview
                        ? `ready-${photoReadyTick}`
                        : 'idle'
                    }
                    src={
                      submitting
                        ? '/berhasil-dexo.png'
                        : submitError
                        ? '/gagal-dexo.png'
                        : photoPreview
                        ? '/pemberitahuan-dexo.png'
                        : '/sapaan-dexo.png'
                    }
                    alt="DEXO Pemandu Presensi"
                    className={`h-14 w-14 object-contain ${
                      submitting
                        ? 'animate-dexo-flap'
                        : submitError
                        ? 'animate-dexo-shake'
                        : photoPreview
                        ? 'animate-dexo-hop'
                        : ''
                    }`}
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-xs sm:text-sm font-bold ${
                      submitError ? 'text-red-900' : 'text-[#2A040A]'
                    }`}
                  >
                    {submitting
                      ? 'Mengirim presensi ke server...'
                      : submitError
                      ? 'Perlu diperbaiki dulu'
                      : photoPreview
                      ? 'Foto bukti sudah siap!'
                      : 'Siap mulai WFH hari ini?'}
                  </p>
                  <p
                    className={`text-xs mt-0.5 leading-relaxed ${
                      submitError ? 'text-red-700' : 'text-[#634E53]'
                    }`}
                  >
                    {submitting
                      ? 'DEXO sedang mengantarkan bukti kehadiran Anda.'
                      : submitError
                      ? submitError
                      : photoPreview
                      ? 'Tambahkan catatan kerja jika perlu, lalu klik Kirim Presensi WFH.'
                      : 'Pilih foto bukti kehadiran (JPG, PNG, atau WEBP, maks. 5 MB).'}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                  Foto Bukti Kehadiran <span className="text-[#800020]">*</span>
                </label>

                {photoPreview ? (
                  <div className="rounded-2xl border border-[#ECE4E7] bg-[#FAF8F9] p-4 flex flex-col items-center">
                    <img
                      src={photoPreview}
                      alt="Preview Foto Bukti"
                      className="max-h-64 w-auto object-contain rounded-xl border border-[#ECE4E7]"
                    />
                    <div className="mt-3 flex items-center justify-between w-full max-w-sm pt-3 border-t border-[#ECE4E7] gap-3">
                      <div className="min-w-0">
                        <p className="text-xs font-semibold text-[#2A040A] truncate">
                          {photoFile?.name}
                        </p>
                        <p className="text-[11px] text-[#634E53] font-mono-tabular">
                          {photoFile ? `${(photoFile.size / (1024 * 1024)).toFixed(2)} MB` : ''}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={resetPhoto}
                        className="min-h-[38px] px-3.5 rounded-full border border-[#DDD3D6] bg-white hover:bg-[#F7F4F5] text-xs font-semibold text-[#800020] inline-flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Ganti Foto</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center w-full min-h-[200px] p-6 rounded-2xl border-2 border-dashed border-[#DDD3D6] bg-[#FAF8F9] hover:border-[#800020] hover:bg-[#FDF2F4]/40 transition-colors text-center cursor-pointer">
                    <div className="h-13 w-13 rounded-full bg-[#FBE8EC] text-[#800020] flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-bold text-[#2A040A]">
                      Pilih foto bukti WFH dari perangkat
                    </span>
                    <span className="text-xs text-[#634E53] mt-1">
                      Format JPG, PNG, atau WEBP · Maksimal 5 MB
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

              <div>
                <label htmlFor="wfh-notes" className="block text-xs font-semibold text-[#2A040A] mb-1.5">
                  Catatan Rencana Kerja (Opsional)
                </label>
                <textarea
                  id="wfh-notes"
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Contoh: Sprint review, implementasi fitur, koordinasi tim..."
                  className="w-full rounded-xl border border-[#DDD3D6] bg-white px-3.5 py-2.5 text-sm text-[#2A040A] placeholder:text-[#9C8A8F] focus:border-[#800020] focus:ring-2 focus:ring-[#800020]/15 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !photoFile}
                className="w-full min-h-[46px] rounded-full bg-[#800020] hover:bg-[#640019] disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Mengirim Presensi...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Kirim Presensi WFH</span>
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        {/* BOTTOM SECTION: RIWAYAT PRESENSI (Tactile Cards Matching Reference) */}
        <section aria-label="Riwayat Presensi WFH" className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-[#2A040A]">Riwayat Presensi</h2>
              <p className="text-xs sm:text-sm text-[#634E53] mt-0.5">
                Arsip waktu check-in dan bukti foto Anda.
              </p>
            </div>

            {/* Quick Date Presets */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(() => {
                const toLocalIso = (d: Date) =>
                  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
                    d.getDate(),
                  ).padStart(2, '0')}`;
                const todayIso = toLocalIso(now);
                const sevenDaysAgo = new Date(now);
                sevenDaysAgo.setDate(now.getDate() - 6);
                const weekIso = toLocalIso(sevenDaysAgo);
                const monthStartIso = toLocalIso(new Date(now.getFullYear(), now.getMonth(), 1));

                const presets = [
                  { label: 'Hari Ini', start: todayIso, end: todayIso },
                  { label: '7 Hari', start: weekIso, end: todayIso },
                  { label: 'Bulan Ini', start: monthStartIso, end: todayIso },
                ];

                return presets.map((preset) => {
                  const active = startDate === preset.start && endDate === preset.end;
                  return (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        if (active) {
                          setStartDate('');
                          setEndDate('');
                        } else {
                          setStartDate(preset.start);
                          setEndDate(preset.end);
                        }
                        setPage(1);
                      }}
                      className={`min-h-[34px] px-3 rounded-full text-xs font-bold border transition-colors cursor-pointer ${
                        active
                          ? 'bg-[#2A040A] text-white border-[#2A040A]'
                          : 'bg-white text-[#634E53] border-[#E7DFE2] hover:border-[#800020]/40 hover:text-[#2A040A]'
                      }`}
                    >
                      {preset.label}
                    </button>
                  );
                });
              })()}
            </div>
          </div>

          {/* Custom Date Range Filter Card */}
          <div className="bg-white rounded-2xl border border-[#ECE4E7] p-3.5 grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div className="sm:col-span-5">
              <CustomDatePicker
                label="Dari Tanggal"
                value={startDate}
                maxDate={endDate || undefined}
                onChange={(val) => {
                  setStartDate(val);
                  setPage(1);
                }}
                placeholder="Pilih tanggal mulai"
                align="left"
                triggerClassName="!bg-[#FAF8F9] hover:!bg-white"
              />
            </div>

            <div className="sm:col-span-5">
              <CustomDatePicker
                label="Sampai Tanggal"
                value={endDate}
                minDate={startDate || undefined}
                onChange={(val) => {
                  setEndDate(val);
                  setPage(1);
                }}
                placeholder="Pilih tanggal akhir"
                align="right"
                triggerClassName="!bg-[#FAF8F9] hover:!bg-white"
              />
            </div>

            <div className="sm:col-span-2 flex items-center justify-end">
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                    setPage(1);
                  }}
                  className="w-full min-h-[42px] px-3.5 rounded-xl text-xs font-bold text-[#800020] bg-[#FBE8EC] hover:bg-[#F5CFD8] transition-colors cursor-pointer"
                >
                  Reset
                </button>
              )}
            </div>
          </div>

          {historyLoading ? (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-sm text-[#634E53]">
              <RefreshCw className="w-5 h-5 animate-spin text-[#800020]" />
              <span>Memuat riwayat...</span>
            </div>
          ) : historyError ? (
            <div className="p-4 rounded-2xl border border-red-200 bg-red-50 text-sm text-red-700">
              {historyError}
            </div>
          ) : !history || history.items.length === 0 ? (
            <div className="bg-white rounded-3xl border border-[#ECE4E7] py-12 px-6 text-center text-sm text-[#634E53]">
              Belum ada catatan riwayat absensi pada rentang tanggal ini.
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {history.items.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white rounded-3xl border border-[#ECE4E7] p-5 flex flex-col justify-between gap-4 hover:border-[#F2C8D2] transition-colors"
                  >
                    <div className="flex flex-col items-center text-center">
                      <button
                        type="button"
                        onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                        aria-label="Lihat foto bukti presensi"
                        className="h-14 w-14 rounded-full overflow-hidden border-2 border-[#F2C8D2] hover:border-[#800020] mb-3 cursor-pointer"
                      >
                        <img
                          src={`${ASSET_BASE_URL}${item.photoUrl}`}
                          alt="Bukti Presensi"
                          className="h-full w-full object-cover"
                        />
                      </button>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#047857]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Terverifikasi WFH
                      </span>
                    </div>

                    <div className="rounded-2xl bg-[#FDF2F4] px-3.5 py-2.5 text-center">
                      <p className="text-xs text-[#2A040A] line-clamp-2">
                        {item.notes || 'Tidak ada catatan aktivitas'}
                      </p>
                    </div>

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

                    <div className="flex justify-center pt-1">
                      <button
                        type="button"
                        onClick={() => onPreviewPhoto(`${ASSET_BASE_URL}${item.photoUrl}`)}
                        className="min-h-[38px] px-4 rounded-full bg-[#2A040A] hover:bg-[#800020] text-white text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <FileImage className="w-3.5 h-3.5" />
                        <span>Lihat Foto</span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>

              {history.meta.totalPages > 1 && (
                <div className="flex items-center justify-between text-xs text-[#634E53] pt-1">
                  <span>
                    Halaman <strong className="text-[#2A040A]">{history.meta.page}</strong> dari{' '}
                    <strong className="text-[#2A040A]">{history.meta.totalPages}</strong>
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="min-h-[38px] px-4 rounded-full bg-white border border-[#E7DFE2] disabled:opacity-40 font-semibold text-[#2A040A] cursor-pointer"
                    >
                      Sebelumnya
                    </button>
                    <button
                      type="button"
                      disabled={page >= history.meta.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                      className="min-h-[38px] px-4 rounded-full bg-white border border-[#E7DFE2] disabled:opacity-40 font-semibold text-[#2A040A] cursor-pointer"
                    >
                      Berikutnya
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};
