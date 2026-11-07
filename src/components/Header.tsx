import React from 'react';
import { Settings, FolderKanban, FileSpreadsheet, LogOut, Sparkles } from 'lucide-react';
import { LanguageSelector } from './LanguageSelector';
import { getTranslation } from '../i18n/translations';

interface HeaderProps {
  onOpenThemeManager: () => void;
  onOpenModelSettings: () => void;
  onOpenGoogleSheetGuide: () => void;
  onLogout?: () => void;
  licenseInfo?: { tier?: string; userName?: string; isAdmin?: boolean } | null;
  currentLang: string;
  onSelectLang: (lang: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenThemeManager,
  onOpenModelSettings,
  onOpenGoogleSheetGuide,
  onLogout,
  licenseInfo,
  currentLang,
  onSelectLang
}) => {
  const isAdmin = !!licenseInfo?.isAdmin;
  const t = getTranslation(currentLang);

  return (
    <header className="w-full pt-6 pb-4 px-4">
      <div className="max-w-6xl mx-auto flex flex-col items-center justify-center relative">
        {/* Top Utility Nav */}
        <div className="w-full flex items-center justify-between mb-3 text-xs text-slate-500 px-2">
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-bold border ${
              isAdmin
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : 'bg-blue-50 text-blue-700 border-blue-200'
            }`}>
              <Sparkles className="w-3 h-3 text-current" />
              {isAdmin ? '관리자 모드 (Admin)' : '스튜디오 에디션'}
            </span>
            {licenseInfo && (
              <span className="text-slate-600 font-medium hidden sm:inline-flex items-center gap-1">
                인증: <strong className={isAdmin ? 'text-purple-700 font-bold' : 'text-emerald-600 font-semibold'}>{licenseInfo.tier || (isAdmin ? '관리자' : '일반')}</strong> ({licenseInfo.userName || '회원'})
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Theme Manager: ONLY visible in Admin Mode */}
            {isAdmin && (
              <button
                onClick={onOpenThemeManager}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold border border-purple-200 shadow-xs transition-colors cursor-pointer"
                title="테마 관리자 (관리자 전용)"
              >
                <FolderKanban className="w-3.5 h-3.5 text-purple-600" />
                <span>테마 관리 (Admin)</span>
              </button>
            )}

            <button
              onClick={onOpenModelSettings}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-medium border border-slate-200 shadow-xs hover:border-slate-300 transition-colors cursor-pointer"
              title="AI 모델 및 API 키 설정"
            >
              <Settings className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">{t.modelSettings}</span>
            </button>

            <button
              onClick={onOpenGoogleSheetGuide}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-medium border border-emerald-200 shadow-xs transition-colors cursor-pointer"
              title="구글 스프레드시트 연동 가이드"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">{t.googleSheetSync}</span>
            </button>

            {/* Language Selector Dropdown (G20) */}
            <LanguageSelector currentLang={currentLang} onSelectLang={onSelectLang} />

            {onLogout && (
              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                title={t.logout}
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Central Logo - Matching the exact style of the uploaded screenshot */}
        <div className="py-2 text-center select-none">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight flex items-center justify-center gap-2.5">
            <span className="title-plymaster">Plymaster</span>
            <span className="title-factory">Factory</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
            YouTube Playlist Planning & Audio Production Suite
          </p>
        </div>
      </div>
    </header>
  );
};
