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
          <p className="text-xs text-rose-100 mt-1 font-medium">{t.expiredBannerSub}</p>

          <button
            onClick={onClose}
            aria-label={t.close}
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
              <span className="text-slate-500 font-semibold">{t.expiredLicenseUuidLabel}</span>
              <span className="font-mono font-bold text-slate-800">{licenseKey || 'N/A'}</span>
            </div>
            {dueDate && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-rose-700 font-bold">{t.expiredDueDateLabel}</span>
                <span className="font-mono font-black text-rose-700 bg-white px-2 py-0.5 rounded border border-rose-200">
                  {dueDate}
                </span>
              </div>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium">
            {t.expiredBodyLine1}<br />
            {t.expiredBodyLine2}
          </p>

          {/* Payment CTA Link Button */}
          <div className="space-y-2 pt-1">
            <a
              href={paymentUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-sm rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>{t.expiredPaymentBtn}</span>
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </a>
            <p className="text-[11px] text-slate-400">
              {t.expiredOfficialLinkLabel} <span className="font-mono text-blue-600 font-semibold">https://litt.ly/plymaster</span>
            </p>
          </div>

          {/* Secondary Action */}
          <div className="pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer py-1"
            >
              {t.expiredReenterKey}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
