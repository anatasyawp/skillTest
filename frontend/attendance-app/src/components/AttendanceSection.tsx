import { FormEvent, useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  FileImage,
  RefreshCw,
  Upload,
  X,
} from 'lucide-react';
import {
  ASSET_BASE_URL,
  AttendanceItem,
  fetchMyAttendances,
  fetchTodayStatus,
  PaginatedResponse,
  submitCheckIn,
  TodayStatusResponse,
} from '../api';
import { formatDateId, formatTimeId } from '../utils/date';

interface AttendanceSectionProps {
  onPreviewPhoto: (url: string) => void;
}

export function AttendanceSection({ onPreviewPhoto }: AttendanceSectionProps) {
  const [now, setNow] = useState(() => new Date());

  const [todayStatus, setTodayStatus] = useState<TodayStatusResponse | null>(null);
  const [todayLoading, setTodayLoading] = useState(false);
  const [todayError, setTodayError] = useState<string | null>(null);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

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

  const loadTodayStatus = useCallback(async () => {
    setTodayLoading(true);
    setTodayError(null);
    try {
      const data = await fetchTodayStatus();
      setTodayStatus(data);
    } catch (err) {
      setTodayError(err instanceof Error ? err.message : 'Gagal memuat status absensi hari ini.');
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
        limit: 8,
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
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const handleCheckIn = async (e: FormEvent) => {
    e.preventDefault();
    if (!photoFile) {
      setSubmitError('Silakan pilih foto bukti WFH terlebih dahulu.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      await submitCheckIn(photoFile, notes);
      setSubmitSuccess('Absensi WFH hari ini berhasil dicatat.');
      setPhotoFile(null);
      setPhotoPreview(null);
      setNotes('');
      await Promise.all([loadTodayStatus(), loadHistory()]);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Gagal mengirim absensi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Today's Check-In Zone */}
      <section className="bg-white border border-[#D2BBAE] rounded-xl overflow-hidden shadow-xs">
        <div className="bg-gradient-to-r from-[#3A0B07] via-[#7E2908] to-[#9A3409] text-white px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-white">Kehadiran Hari Ini</h2>
            <p className="text-sm text-[#EADCD3] mt-0.5">
              {now.toLocaleDateString('id-ID', {
                weekday: 'long',
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-[#EC8C0E] px-4 py-2 text-[#3A0B07] shadow-xs">
            <Clock className="w-4 h-4 text-[#3A0B07]" />
            <span className="font-mono-tabular text-lg font-bold">
              {now.toLocaleTimeString('id-ID', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false,
              })}
            </span>
          </div>
        </div>

        <div className="p-5 sm:p-6">

        {todayLoading ? (
          <div className="py-8 flex items-center gap-3 text-sm text-[#6E4A3E]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#D1510A]" />
            <span>Memuat status absensi hari ini...</span>
          </div>
        ) : todayError ? (
          <div className="mt-5 rounded-md border border-[#FECACA] bg-[#FEF2F2] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{todayError}</span>
            </div>
            <button
              type="button"
              onClick={loadTodayStatus}
              className="min-h-[44px] px-3.5 rounded-md border border-[#FECACA] bg-white text-sm font-medium text-[#B91C1C] hover:bg-[#FEF2F2] cursor-pointer"
            >
              Coba Lagi
            </button>
          </div>
        ) : todayStatus?.hasClockedIn && todayStatus.attendance ? (
          <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="space-y-2.5">
              <span className="inline-flex items-center gap-1.5 rounded-md bg-[#F0FDF4] border border-[#BBF7D0] px-3 py-1 text-xs font-semibold text-[#15803D]">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Sudah Absen Masuk WFH
              </span>
              <div className="text-sm text-[#6E4A3E]">
                Waktu Check-In:{' '}
                <span className="font-mono-tabular font-semibold text-[#3A0B07]">
                  {formatTimeId(todayStatus.attendance.clockInAt)}
                </span>
              </div>
              {todayStatus.attendance.notes && (
                <p className="text-sm text-[#6E4A3E]">
                  Catatan: <span className="text-[#3A0B07]">{todayStatus.attendance.notes}</span>
                </p>
              )}
            </div>

            <button
              type="button"
              onClick={() =>
                onPreviewPhoto(`${ASSET_BASE_URL}${todayStatus.attendance!.photoUrl}`)
              }
              className="group relative w-32 h-24 rounded-md overflow-hidden border border-[#D2BBAE] shrink-0 cursor-pointer"
              aria-label="Lihat foto bukti WFH hari ini"
            >
              <img
                src={`${ASSET_BASE_URL}${todayStatus.attendance.photoUrl}`}
                alt="Bukti WFH hari ini"
                className="w-full h-full object-cover transition-transform duration-150 group-hover:scale-105"
              />
            </button>
          </div>
        ) : (
          <form onSubmit={handleCheckIn} className="mt-5 space-y-4">
            {submitError && (
              <div
                role="alert"
                className="flex items-start gap-2.5 rounded-md border border-[#FECACA] bg-[#FEF2F2] px-3.5 py-3 text-sm text-[#B91C1C]"
              >
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {submitSuccess && (
              <div
                role="status"
                className="flex items-start gap-2.5 rounded-md border border-[#BBF7D0] bg-[#F0FDF4] px-3.5 py-3 text-sm text-[#15803D]"
              >
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{submitSuccess}</span>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-[#3A0B07] mb-1.5">
                Foto Bukti WFH <span className="text-[#D1510A]">*</span>
              </label>
              {photoPreview ? (
                <div className="flex flex-wrap items-center gap-4">
                  <img
                    src={photoPreview}
                    alt="Pratinjau foto WFH"
                    className="w-40 h-28 object-cover rounded-md border border-[#D2BBAE]"
                  />
                  <div className="space-y-2">
                    <p className="text-xs text-[#6E4A3E]">{photoFile?.name}</p>
                    <button
                      type="button"
                      onClick={() => handleFileChange(null)}
                      className="inline-flex items-center gap-1.5 min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-xs font-medium text-[#3A0B07] cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                      Ganti Foto
                    </button>
                  </div>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center min-h-[132px] rounded-md border border-dashed border-[#D2BBAE] bg-[#FAF6F3] hover:border-[#D1510A] px-4 py-5 text-center cursor-pointer transition-colors duration-150">
                  <Camera className="w-6 h-6 text-[#D1510A] mb-2" />
                  <span className="text-sm font-medium text-[#3A0B07]">
                    Pilih atau ambil foto bukti WFH
                  </span>
                  <span className="text-xs text-[#6E4A3E] mt-1">
                    JPG, PNG, atau WEBP · Maksimal 5 MB
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
              <label htmlFor="notes" className="block text-sm font-medium text-[#3A0B07] mb-1.5">
                Catatan Aktivitas (Opsional)
              </label>
              <textarea
                id="notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Contoh: Fokus menyelesaikan modul API & review PR."
                className="w-full rounded-md border border-[#D2BBAE] bg-white px-3.5 py-2.5 text-sm text-[#3A0B07] placeholder:text-[#A68B7E] focus:border-[#D1510A] focus:outline-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-md bg-gradient-to-r from-[#7E2908] to-[#9A3409] hover:from-[#3A0B07] hover:to-[#7E2908] disabled:opacity-60 text-white text-sm font-semibold shadow-xs transition-all duration-150 cursor-pointer"
              >
                <Upload className="w-4 h-4" />
                <span>{submitting ? 'Mengirim Absensi...' : 'Absen Masuk WFH'}</span>
              </button>
            </div>
          </form>
        )}
        </div>
      </section>

      {/* Attendance History */}
      <section className="bg-white border border-[#D2BBAE] rounded-lg p-5 sm:p-6">
        <div className="flex flex-wrap items-end justify-between gap-4 pb-4 border-b border-[#EADCD3]">
          <div>
            <h2 className="text-base font-bold text-[#3A0B07]">Riwayat Absensi Saya</h2>
            <p className="text-sm text-[#6E4A3E] mt-0.5">
              Daftar catatan kehadiran WFH Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div>
              <label htmlFor="startDate" className="block text-xs text-[#6E4A3E] mb-1">
                Dari Tanggal
              </label>
              <input
                id="startDate"
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setPage(1);
                }}
                className="min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm text-[#3A0B07] focus:border-[#D1510A] focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="endDate" className="block text-xs text-[#6E4A3E] mb-1">
                Sampai Tanggal
              </label>
              <input
                id="endDate"
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setPage(1);
                }}
                className="min-h-[44px] rounded-md border border-[#D2BBAE] bg-white px-3 text-sm text-[#3A0B07] focus:border-[#D1510A] focus:outline-none"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
                className="self-end min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white hover:bg-[#FAF6F3] text-xs font-medium text-[#6E4A3E] cursor-pointer"
              >
                Reset
              </button>
            )}
          </div>
        </div>

        {historyLoading ? (
          <div className="py-10 flex items-center justify-center gap-3 text-sm text-[#6E4A3E]">
            <RefreshCw className="w-4 h-4 animate-spin text-[#D1510A]" />
            <span>Memuat riwayat absensi...</span>
          </div>
        ) : historyError ? (
          <div className="mt-4 rounded-md border border-[#FECACA] bg-[#FEF2F2] p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 text-sm text-[#B91C1C]">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{historyError}</span>
            </div>
            <button
              type="button"
              onClick={loadHistory}
              className="min-h-[44px] px-3.5 rounded-md border border-[#FECACA] bg-white text-sm font-medium text-[#B91C1C] cursor-pointer"
            >
              Muat Ulang
            </button>
          </div>
        ) : !history || history.items.length === 0 ? (
          <div className="py-10 text-center text-sm text-[#6E4A3E]">
            Belum ada data absensi WFH pada rentang tanggal yang dipilih.
          </div>
        ) : (
          <>
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="border-b border-[#EADCD3] text-xs font-semibold uppercase tracking-wider text-[#6E4A3E]">
                    <th className="py-3 pr-4">Tanggal</th>
                    <th className="py-3 px-4">Jam Masuk</th>
                    <th className="py-3 px-4">Catatan</th>
                    <th className="py-3 pl-4 text-right">Bukti Foto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EADCD3]">
                  {history.items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#FAF6F3]">
                      <td className="py-3.5 pr-4 whitespace-nowrap font-medium text-[#3A0B07]">
                        {formatDateId(item.attendanceDate, true)}
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono-tabular text-[#3A0B07]">
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

            {history.meta.totalPages > 1 && (
              <div className="mt-4 pt-4 border-t border-[#EADCD3] flex items-center justify-between text-xs text-[#6E4A3E]">
                <span>
                  Halaman <strong className="text-[#3A0B07]">{history.meta.page}</strong> dari{' '}
                  <strong className="text-[#3A0B07]">{history.meta.totalPages}</strong> (
                  {history.meta.total} data)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    className="min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white disabled:opacity-50 text-xs font-medium text-[#3A0B07] cursor-pointer"
                  >
                    Sebelumnya
                  </button>
                  <button
                    type="button"
                    disabled={page >= history.meta.totalPages}
                    onClick={() => setPage((p) => p + 1)}
                    className="min-h-[44px] px-3 rounded-md border border-[#D2BBAE] bg-white disabled:opacity-50 text-xs font-medium text-[#3A0B07] cursor-pointer"
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
  );
}
