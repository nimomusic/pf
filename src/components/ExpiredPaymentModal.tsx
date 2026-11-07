import React from 'react';
import { AlertTriangle, ExternalLink, CalendarX, ArrowRight, ShieldAlert, X } from 'lucide-react';
import { getTranslation } from '../i18n/translations';

interface ExpiredPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  dueDate?: string;
  licenseKey?: string;
  lang?: string;
}

export const ExpiredPaymentModal: React.FC<ExpiredPaymentModalProps> = ({
  isOpen,
  onClose,
  dueDate,
  licenseKey,
  lang = 'ko'
}) => {
  if (!isOpen) return null;

  const t = getTranslation(lang);
  const paymentUrl = 'https://litt.ly/plymaster';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl shadow-2xl border border-rose-200/80 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Top Warning Banner */}
        <div className="bg-gradient-to-r from-rose-500 to-amber-500 p-6 text-white text-center relative">
          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center mx-auto mb-3 shadow-inner">
            <CalendarX className="w-8 h-8 text-white" />
          </div>
          <h3 className="text-xl font-black tracking-tight">{t.expiredTitle}</h3>
          <p className="text-xs text-rose-100 mt-1 font-medium">Plymaster Factory 라이선스 만료 안내</p>

          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-full bg-black/10 hover:bg-black/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 text-center">
          {/* Expiration Details Card */}
          <div className="p-4 bg-rose-50/80 rounded-2xl border border-rose-200/70 text-left space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 font-semibold">라이선스 (UUID):</span>
              <span className="font-mono font-bold text-slate-800">{licenseKey || 'N/A'}</span>
            </div>
            {dueDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-700 font-bold">만료 일자 (Due Date):</span>
                <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                  {dueDate}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            사용 기간이 만료되어 스튜디오 접속이 제한되었습니다.<br />
            아래 <strong>결제 사이트 바로가기</strong>에서 결제 후 새로운 사용 기간을 발급받아 이용해 주시기 바랍니다.
          </p>

          {/* Payment CTA Link Button */}
          <div className="space-y-2 pt-1">
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>결제 사이트 바로가기</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <p className="text-[11px] text-slate-400">
              공식 결제 링크: <span className="font-mono text-blue-600 font-semibold">https://litt.ly/plymaster</span>
            </p>
          </div>

          {/* Secondary Action */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer py-1"
            >
              다른 라이선스 키 입력하기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
