import { useEffect } from 'react';
import { X } from 'lucide-react';

interface PhotoPreviewModalProps {
  photoUrl: string | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photoUrl, onClose }: PhotoPreviewModalProps) {
  useEffect(() => {
    if (!photoUrl) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [photoUrl, onClose]);

  if (!photoUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau Foto Bukti WFH"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#160305]/75 backdrop-blur-xs p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-2xl border border-[#E2E8F0] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#E2E8F0]">
          <span className="text-sm font-bold text-[#0F172A]">Foto Bukti Presensi WFH</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau foto"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-lg hover:bg-[#F1F5F9] text-[#64748B] hover:text-[#0F172A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <img
          src={photoUrl}
          alt="Bukti WFH"
          className="w-full max-h-[75vh] object-contain rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]"
        />
      </div>
    </div>
  );
}
