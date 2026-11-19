import { useEffect } from 'react';
import { X } from 'lucide-react';

interface PhotoPreviewModalProps {
  photoUrl: string | null;
  onClose: () => void;
}

export function PhotoPreviewModal({ photoUrl, onClose }: PhotoPreviewModalProps) {
  useEffect(() => {
    if (!photoUrl) return;
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [photoUrl, onClose]);

  if (!photoUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Pratinjau Foto Bukti WFH"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#1C070B]/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-3xl border border-[#ECE4E7] p-4 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F2ECEE]">
          <span className="text-sm font-bold text-[#2A040A]">Foto Bukti Presensi WFH</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau foto"
            className="min-h-[40px] min-w-[40px] inline-flex items-center justify-center rounded-full hover:bg-[#F7F4F5] text-[#634E53] hover:text-[#2A040A] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <img
          src={photoUrl}
          alt="Bukti WFH"
          className="w-full max-h-[75vh] object-contain rounded-2xl bg-[#F7F4F5] border border-[#ECE4E7]"
        />
      </div>
    </div>
  );
}
