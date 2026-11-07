import React, { useState } from 'react';
import { KeyRound, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';
import { verifyLicenseKey } from '../services/api';
import { LanguageSelector } from './LanguageSelector';
import { getTranslation } from '../i18n/translations';

interface LicenseGateProps {
  onSuccess: (licenseData: { licenseKey: string; tier?: string; userName?: string; isAdmin: boolean }) => void;
  onExpired: (dueDate?: string, licenseKey?: string) => void;
  onOpenGoogleSheetGuide?: () => void;
  sheetUrl: string;
  currentLang: string;
  onSelectLang: (lang: string) => void;
}

export const LicenseGate: React.FC<LicenseGateProps> = ({
  onSuccess,
  onExpired,
  sheetUrl,
  currentLang,
  onSelectLang
}) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const t = getTranslation(currentLang);

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanKey = licenseKey.trim();
    if (!cleanKey) {
      setErrorMessage(t.enterLicensePrompt);
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const result = await verifyLicenseKey(cleanKey, sheetUrl);
      if (result.valid) {
        onSuccess({
          licenseKey: cleanKey,
          tier: result.tier || (result.isAdmin ? '관리자 (VIP)' : '일반 회원'),
          userName: result.userName || '인증 사용자',
          isAdmin: !!result.isAdmin
        });
      } else if (result.isExpired) {
        onExpired(result.dueDate, cleanKey);
      } else {
        setErrorMessage(result.message || '유효하지 않은 라이선스 키입니다.');
      }
    } catch (err: any) {
      setErrorMessage('라이선스 검증 서버 통신 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-[#eef2f7] to-[#e2e8f0] relative">
      {/* Top Right G20 Language Selector */}
      <div className="absolute top-4 right-4 z-20">
        <LanguageSelector currentLang={currentLang} onSelectLang={onSelectLang} />
      </div>

      <div className="w-full max-w-md mx-auto">
        {/* Brand Banner */}
        <div className="text-center mb-6 select-none">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center gap-2 mb-2">
            <span className="title-plymaster">Plymaster</span>
            <span className="title-factory">Factory</span>
          </h1>
          <p className="text-xs sm:text-sm font-semibold text-slate-500 uppercase tracking-widest px-2">
            {t.subtitle}
          </p>
        </div>

        {/* License Verification Card */}
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200/90 p-6 sm:p-8 backdrop-blur-xs">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-lg mb-1">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <span>{t.licenseVerification}</span>
          </div>
          <p className="text-xs text-slate-500 mb-6">
            {t.enterLicensePrompt}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                {t.licenseKeyLabel}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => {
                    setLicenseKey(e.target.value);
                    if (errorMessage) setErrorMessage(null);
                  }}
                  placeholder={t.licenseKeyPlaceholder}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm font-mono tracking-wide transition-all bg-slate-50/50"
                  autoFocus
                />
                <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              </div>
            </div>

            {errorMessage && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading || !licenseKey.trim()}
              className="w-full py-3.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t.loginButton}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400 mt-6">
          © Plymaster Factory • Cross-Platform YouTube Playlist Studio
        </p>
      </div>
    </div>
  );
};
