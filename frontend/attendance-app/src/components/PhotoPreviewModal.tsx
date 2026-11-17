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
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/60 p-4"
      onClick={onClose}
    >
      <div
        className="relative max-w-2xl w-full bg-white rounded-xl border border-[#CBD5E1] p-3 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#E2E8F0]">
          <span className="text-sm font-semibold text-[#0F172A]">Foto Bukti WFH</span>
          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup pratinjau foto"
            className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-[#F8FAFC] text-[#475569] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <img
          src={photoUrl}
          alt="Bukti WFH"
          className="w-full max-h-[75vh] object-contain rounded-lg bg-[#F8FAFC]"
        />
      </div>
    </div>
  );
}
