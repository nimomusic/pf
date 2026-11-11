import React, { useState, useEffect, useRef } from 'react';
import {
  ClipboardList,
  Music,
  Headphones,
  CheckSquare,
  Play,
  Square,
  ChevronDown,
  X as XIcon,
  Sparkles,
  Cpu,
  FolderKanban,
  FileSpreadsheet,
  AlertCircle,
  Eye,
  EyeOff
} from 'lucide-react';
import { Header } from './components/Header';
import { LicenseGate } from './components/LicenseGate';
import { GoogleSheetsGuideModal } from './components/GoogleSheetsGuideModal';
import { ModelSettingsModal } from './components/ModelSettingsModal';
import { ThemeManagerModal } from './components/ThemeManagerModal';
import { ResultModal } from './components/ResultModal';
import { ExpiredPaymentModal } from './components/ExpiredPaymentModal';
import { getTranslation } from './i18n/translations';
import { Theme, VocalType, ProviderType, PlaylistResult, StepId } from './types';
import { fetchThemes, generatePlaylist, verifyLicenseKey } from './services/api';
import { PROVIDER_AUTO_MODELS, PROVIDER_LABELS } from './constants/models';

export default function App() {
  // G20 Language State
  const [currentLang, setCurrentLang] = useState<string>(() => localStorage.getItem('plymaster_lang') || 'ko');
  const t = getTranslation(currentLang);

  // License Auth & Expiration State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [licenseInfo, setLicenseInfo] = useState<{ licenseKey: string; tier?: string; userName?: string; isAdmin: boolean } | null>(null);
  const [showExpiredModal, setShowExpiredModal] = useState<boolean>(false);
  const [expiredDueDate, setExpiredDueDate] = useState<string>('');
  const [expiredLicenseKey, setExpiredLicenseKey] = useState<string>('');
  const [sheetUrl, setSheetUrl] = useState<string>(() => localStorage.getItem('plymaster_sheet_url') || '');

  // Modals
  const [showGoogleSheetGuide, setShowGoogleSheetGuide] = useState(false);
  const [showModelSettings, setShowModelSettings] = useState(false);
  const [showThemeManager, setShowThemeManager] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);

  // Themes State
  const [themes, setThemes] = useState<Theme[]>([]);
  const [selectedTheme, setSelectedTheme] = useState<Theme | null>(null);
  const [isThemeDropdownOpen, setIsThemeDropdownOpen] = useState(false);
  const themeDropdownRef = useRef<HTMLDivElement>(null);

  // Track Count & Vocal Settings - Default track count is 1, default vocal is random
  const [trackCount, setTrackCount] = useState<number>(1);
  const [vocal, setVocal] = useState<VocalType>('random');

  // AI Provider & Model State
  const [provider, setProvider] = useState<ProviderType>('gpt');
  const [isAutoModel, setIsAutoModel] = useState<boolean>(true);
  const [model, setModel] = useState<string>('gpt-5.4-mini');
  const [apiKeys, setApiKeys] = useState<Record<ProviderType, string>>({
    gpt: '',
    gemini: '',
    claude: ''
  });
  const [showApiKeyText, setShowApiKeyText] = useState(false);

  // Generation & Progress State
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<StepId>('plan');
  const [stepIndex, setStepIndex] = useState<number>(0); // 0: PLAN, 1: CREATE, 2: PRODUCE, 3: COMPLETE
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string>('대기 중...');
  const [resultData, setResultData] = useState<PlaylistResult | null>(null);
  const [apiErrorMessage, setApiErrorMessage] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Check stored license on initial load (using sessionStorage so new browser sessions require re-entering the key)
  useEffect(() => {
    // Clear legacy permanent localStorage keys
    localStorage.removeItem('plymaster_license_key');
    localStorage.removeItem('plymaster_license_tier');
    localStorage.removeItem('plymaster_license_user');
    localStorage.removeItem('plymaster_license_is_admin');

    const savedKey = sessionStorage.getItem('plymaster_license_key');
    const savedTier = sessionStorage.getItem('plymaster_license_tier');
    const savedUser = sessionStorage.getItem('plymaster_license_user');
    const savedIsAdmin = sessionStorage.getItem('plymaster_license_is_admin') === 'true';

    if (savedKey) {
      setLicenseInfo({
        licenseKey: savedKey,
        tier: savedTier || (savedIsAdmin ? '관리자 (VIP)' : '일반 회원'),
        userName: savedUser || '인증 사용자',
        isAdmin: savedIsAdmin
      });
      setIsAuthenticated(true);
    }

    // Load saved API Keys & Model preference
    try {
      const savedKeys = localStorage.getItem('plymaster_api_keys');
      if (savedKeys) setApiKeys(JSON.parse(savedKeys));

      const savedProvider = localStorage.getItem('plymaster_provider') as ProviderType;
      if (savedProvider) setProvider(savedProvider);

      const savedModel = localStorage.getItem('plymaster_model');
      if (savedModel) setModel(savedModel);

      const savedAuto = localStorage.getItem('plymaster_is_auto_model');
      if (savedAuto !== null) setIsAutoModel(savedAuto === 'true');
    } catch (e) {
      console.warn('Failed to parse saved settings', e);
    }
  }, []);

  // Fetch Themes on load
  useEffect(() => {
    const loadThemes = async () => {
      try {
        const loaded = await fetchThemes();
        setThemes(loaded);
        if (loaded.length > 0) {
          setSelectedTheme(loaded[0]);
        } else {
          setSelectedTheme(null);
        }
      } catch (err) {
        console.error('Failed to load themes:', err);
      }
    };
    loadThemes();
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (themeDropdownRef.current && !themeDropdownRef.current.contains(e.target as Node)) {
        setIsThemeDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handlers for License (session-scoped for security)
  const handleLicenseSuccess = (info: { licenseKey: string; tier?: string; userName?: string; isAdmin: boolean }) => {
    sessionStorage.setItem('plymaster_license_key', info.licenseKey);
    if (info.tier) sessionStorage.setItem('plymaster_license_tier', info.tier);
    if (info.userName) sessionStorage.setItem('plymaster_license_user', info.userName);
    sessionStorage.setItem('plymaster_license_is_admin', String(info.isAdmin));
    // Also remove from permanent localStorage
    localStorage.removeItem('plymaster_license_key');
    localStorage.removeItem('plymaster_license_tier');
    localStorage.removeItem('plymaster_license_user');
    localStorage.removeItem('plymaster_license_is_admin');
    setLicenseInfo(info);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    sessionStorage.removeItem('plymaster_license_key');
    sessionStorage.removeItem('plymaster_license_tier');
    sessionStorage.removeItem('plymaster_license_user');
    sessionStorage.removeItem('plymaster_license_is_admin');
    localStorage.removeItem('plymaster_license_key');
    localStorage.removeItem('plymaster_license_tier');
    localStorage.removeItem('plymaster_license_user');
    localStorage.removeItem('plymaster_license_is_admin');
    setLicenseInfo(null);
    setIsAuthenticated(false);
  };

  const handleSaveSheetUrl = (url: string) => {
    setSheetUrl(url);
    localStorage.setItem('plymaster_sheet_url', url);
  };

  // Model settings update
  const handleSaveModelSettings = (newSettings: {
    provider: ProviderType;
    model: string;
    isAutoModel: boolean;
    apiKeys: Record<ProviderType, string>;
  }) => {
    setProvider(newSettings.provider);
    setModel(newSettings.model);
    setIsAutoModel(newSettings.isAutoModel);
    setApiKeys(newSettings.apiKeys);

    localStorage.setItem('plymaster_provider', newSettings.provider);
    localStorage.setItem('plymaster_model', newSettings.model);
    localStorage.setItem('plymaster_is_auto_model', String(newSettings.isAutoModel));
    localStorage.setItem('plymaster_api_keys', JSON.stringify(newSettings.apiKeys));
  };

  // Provider toggle in top bar
  const handleSwitchProvider = (p: ProviderType) => {
    setProvider(p);
    localStorage.setItem('plymaster_provider', p);
    if (isAutoModel) {
      const autoM = PROVIDER_AUTO_MODELS[p];
      setModel(autoM);
      localStorage.setItem('plymaster_model', autoM);
    }
  };

  // Start Generation
  const handleStart = async (isSimulation = false) => {
    if (!selectedTheme) {
      alert('테마를 먼저 선택해 주세요.');
      return;
    }

    if (isRunning) return;

    setApiErrorMessage(null);
    setResultData(null);
    setIsRunning(true);
    setProgressPercent(5);
    setStepIndex(0);
    setCurrentStep('plan');
    setStatusMessage(
      isSimulation
        ? `01 PLAN: '${selectedTheme.name}' 테마 SOP 분석 및 시뮬레이션 기획 수립 중...`
        : `01 PLAN: '${selectedTheme.name}' 테마 SOP 분석 및 ${provider.toUpperCase()} AI 기획 수립 중...`
    );

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Step 1: PLAN simulation animation
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (abortController.signal.aborted) return;

      setProgressPercent(28);
      setStepIndex(1);
      setCurrentStep('create');
      setStatusMessage(`02 CREATE: 트랙별 무드, Suno/Udio 스타일 프롬프트 및 완성형 가사 작성 중... (총 ${trackCount}곡)`);

      // Call API
      const apiResult = await generatePlaylist({
        theme: selectedTheme,
        trackCount,
        vocal,
        provider,
        model: isAutoModel ? PROVIDER_AUTO_MODELS[provider] : model,
        apiKey: apiKeys[provider],
        mode: isSimulation ? 'simulation' : 'api',
        signal: abortController.signal
      });

      if (abortController.signal.aborted) return;

      // Step 2: PRODUCE animation
      setProgressPercent(75);
      setStepIndex(2);
      setCurrentStep('produce');
      setStatusMessage(`03 PRODUCE: 유튜브 SEO 타이틀, 영상 설명문, 썸네일 & 배경 프롬프트 패키징 중...`);

      await new Promise((resolve) => setTimeout(resolve, 600));
      if (abortController.signal.aborted) return;

      // Step 3: COMPLETE
      setProgressPercent(100);
      setStepIndex(3);
      setCurrentStep('complete');
      setStatusMessage(`04 COMPLETE: 기획 및 제작 완료! 결과 팝업을 엽니다.`);

      const finalData: PlaylistResult = {
        themeId: selectedTheme.id,
        themeName: selectedTheme.name,
        modelUsed: apiResult.modelUsed,
        vocal,
        generatedAt: new Date().toISOString(),
        tracks: apiResult.result.tracks || [],
        youtube: apiResult.result.youtube || {
          title: '',
          description: '',
          tracklist: '',
          hashtags: '',
          thumbnailPrompt: '',
          backgroundImagePrompt: ''
        }
      };

      setResultData(finalData);

      // Open popup after a brief moment
      setTimeout(() => {
        setShowResultModal(true);
        setIsRunning(false);
      }, 500);

    } catch (err: any) {
      if (err.name === 'AbortError') {
        setStatusMessage('작업이 사용자에 의해 중지되었습니다.');
      } else {
        console.error('Generation error:', err);
        const errorMsg = err.message || '요청 처리에 실패했습니다.';
        setStatusMessage(`오류 발생: ${errorMsg}`);
        setApiErrorMessage(errorMsg);
      }
      setIsRunning(false);
    }
  };

  // Stop Generation
  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsRunning(false);
    setStatusMessage('작업이 중지되었습니다.');
    setProgressPercent(0);
    setStepIndex(0);
    setCurrentStep('plan');
  };

  const handleSelectLang = (lang: string) => {
    setCurrentLang(lang);
    localStorage.setItem('plymaster_lang', lang);
  };

  const handleExpiredLicense = (dueDate?: string, key?: string) => {
    setExpiredDueDate(dueDate || '');
    setExpiredLicenseKey(key || '');
    setShowExpiredModal(true);
  };

  // If not authenticated, show License Gate
  if (!isAuthenticated) {
    return (
      <>
        <LicenseGate
          onSuccess={handleLicenseSuccess}
          onExpired={handleExpiredLicense}
          onOpenGoogleSheetGuide={() => setShowGoogleSheetGuide(true)}
          sheetUrl={sheetUrl}
          currentLang={currentLang}
          onSelectLang={handleSelectLang}
        />
        <GoogleSheetsGuideModal
          isOpen={showGoogleSheetGuide}
          onClose={() => setShowGoogleSheetGuide(false)}
          savedSheetUrl={sheetUrl}
          onSaveSheetUrl={handleSaveSheetUrl}
        />
        <ExpiredPaymentModal
          isOpen={showExpiredModal}
          onClose={() => setShowExpiredModal(false)}
          dueDate={expiredDueDate}
          licenseKey={expiredLicenseKey}
          lang={currentLang}
        />
      </>
    );
  }

  const isAdmin = !!licenseInfo?.isAdmin;

  // Active model display text
  const currentModelDisplayName = isAutoModel
    ? `${provider.toUpperCase()} - ${PROVIDER_AUTO_MODELS[provider]} (${t.autoTokenOptimized})`
    : `${provider.toUpperCase()} - ${model}`;

  return (
    <div className="min-h-screen bg-[#f3f4f6] text-slate-800 flex flex-col font-sans">
      {/* Top Header */}
      <Header
        onOpenThemeManager={() => setShowThemeManager(true)}
        onOpenModelSettings={() => setShowModelSettings(true)}
        onOpenGoogleSheetGuide={() => setShowGoogleSheetGuide(true)}
        onLogout={handleLogout}
        licenseInfo={licenseInfo}
        currentLang={currentLang}
        onSelectLang={handleSelectLang}
      />

      {/* Main Studio Container */}
      <main className="w-full max-w-5xl mx-auto px-4 pb-12 flex-1">
        {/* API Key Bar - exactly like screenshot */}
        <div className="w-full bg-white rounded-2xl border border-slate-200/90 shadow-xs p-4 sm:p-5 mb-6">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                  {PROVIDER_LABELS[provider].label}:
                </span>
                {/* Provider switcher badges */}
                <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
                  {(['gpt', 'gemini', 'claude'] as ProviderType[]).map((p) => (
                    <button
                      key={p}
                      onClick={() => handleSwitchProvider(p)}
                      className={`px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                        provider === p
                          ? 'bg-white text-blue-600 shadow-2xs'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {p.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowModelSettings(true)}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1 cursor-pointer self-end sm:self-auto"
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>{t.modelSettings}</span>
              </button>
            </div>

            <div className="relative flex items-center">
              <input
                type={showApiKeyText ? 'text' : 'password'}
                value={apiKeys[provider]}
                onChange={(e) => {
                  const newKeys = { ...apiKeys, [provider]: e.target.value };
                  setApiKeys(newKeys);
                  localStorage.setItem('plymaster_api_keys', JSON.stringify(newKeys));
                }}
                placeholder={
                  provider === 'gemini'
                    ? '****************************************************************************************************'
                    : PROVIDER_LABELS[provider].placeholder
                }
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-50/60 rounded-xl border border-slate-200 font-mono text-xs focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
              />
              <button
                type="button"
                onClick={() => setShowApiKeyText(!showApiKeyText)}
                className="absolute right-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                title={showApiKeyText ? '키 숨기기' : '키 보기'}
              >
                {showApiKeyText ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Model status indicator below the input - identical to the screenshot */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-0.5">
              <div className="flex items-center gap-1.5 font-medium">
                <span className="text-sm">🐱</span>
                <span>{t.currentModel}: {currentModelDisplayName}</span>
                {isAutoModel && (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                    {t.autoTokenOptimized}
                  </span>
                )}
              </div>
              <button
                onClick={() => setShowModelSettings(true)}
                className="text-[11px] text-blue-600 hover:underline cursor-pointer"
              >
                {t.changeModel}
              </button>
            </div>
          </div>
        </div>

        {/* Studio Body Grid: Left Form Column & Right Progress Column */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* LEFT COLUMN: 1. 테마 / 2. 제작 곡 수 / 3. 보컬 설정 / 시작 & 중지 */}
          <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* 1. 테마 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-base font-bold text-blue-600 flex items-center gap-1.5">
                    <span>{t.themeLabel}</span>
                  </label>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setShowThemeManager(true)}
                      className="text-xs text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 cursor-pointer bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200"
                    >
                      <FolderKanban className="w-3.5 h-3.5" />
                      <span>{t.themeManager}</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2" ref={themeDropdownRef}>
                  {/* Custom Theme Dropdown Select Box */}
                  <div className="relative flex-1">
                    <button
                      type="button"
                      onClick={() => setIsThemeDropdownOpen(!isThemeDropdownOpen)}
                      className="w-full flex items-center justify-between px-4 py-3 bg-white rounded-xl border border-slate-300 hover:border-slate-400 text-left text-sm font-semibold text-slate-800 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
                    >
                      <span className="truncate">
                        {selectedTheme
                          ? selectedTheme.name
                          : themes.length === 0
                          ? (isAdmin ? t.noThemesAdminPrompt : t.noThemesRegistered)
                          : t.selectThemePlaceholder}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-500 transition-transform ${
                          isThemeDropdownOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    {/* Dropdown Menu */}
                    {isThemeDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1.5 bg-white rounded-xl border border-slate-200 shadow-xl z-30 max-h-64 overflow-y-auto py-1 animate-in fade-in duration-150">
                        {themes.length === 0 ? (
                          <div className="px-4 py-3 text-xs text-slate-500 text-center">
                            {isAdmin ? t.noThemesAdminPrompt : t.noThemesRegistered}
                          </div>
                        ) : (
                          themes.map((th) => {
                            const isSel = selectedTheme?.id === th.id;
                            return (
                              <button
                                key={th.id}
                                type="button"
                                onClick={() => {
                                  setSelectedTheme(th);
                                  setResultData(null);
                                  setIsThemeDropdownOpen(false);
                                }}
                                className={`w-full px-4 py-2.5 text-left text-xs sm:text-sm font-medium flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer ${
                                  isSel ? 'bg-blue-50/70 text-blue-700 font-bold' : 'text-slate-700'
                                }`}
                              >
                                <div className="truncate pr-2">
                                  <div>{th.name}</div>
                                  {th.category && (
                                    <div className="text-[10px] text-slate-400 font-normal">{th.category}</div>
                                  )}
                                </div>
                                <span className="text-[10px] text-slate-400 font-mono shrink-0">{th.id}</span>
                              </button>
                            );
                          })
                        )}

                        {isAdmin && (
                          <div className="border-t border-slate-100 p-2 bg-slate-50">
                            <button
                              type="button"
                              onClick={() => {
                                setIsThemeDropdownOpen(false);
                                setShowThemeManager(true);
                              }}
                              className="w-full py-1.5 text-xs text-center font-bold text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            >
                              {t.addThemeAdmin}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Black Square X Button - ONLY visible in Admin mode */}
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        if (themes.length > 0) {
                          setSelectedTheme(themes[0]);
                        } else {
                          setSelectedTheme(null);
                        }
                      }}
                      title="첫 번째 테마로 리셋"
                      className="w-11 h-11 rounded-xl bg-[#2b2d42] hover:bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-2xs transition-colors cursor-pointer"
                    >
                      <XIcon className="w-5 h-5 stroke-[2.5]" />
                    </button>
                  )}
                </div>

                {/* SOP 지침 요약 - ONLY visible in Admin mode */}
                {isAdmin && selectedTheme && (
                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-1 px-1">
                    <strong className="text-purple-700">[SOP 요약]</strong> {selectedTheme.sop}
                  </p>
                )}
              </div>

              {/* 2. 제작 곡 수 - Clean input as in screenshot without quick pills */}
              <div>
                <label className="block text-base font-bold text-blue-600 mb-2">
                  {t.trackCountLabel}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={1}
                    max={10}
                    value={trackCount}
                    onChange={(e) => setTrackCount(Math.min(10, Math.max(1, parseInt(e.target.value) || 1)))}
                    className="w-24 px-4 py-2.5 text-center font-bold text-base rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <span className="font-semibold text-slate-700 text-sm">{t.tracksUnit}</span>
                </div>
              </div>

              {/* 3. 보컬 설정 */}
              <div>
                <label className="block text-base font-bold text-blue-600 mb-2.5">
                  {t.vocalLabel}
                </label>
                <div className="flex items-center gap-5 sm:gap-7 flex-wrap">
                  {[
                    { id: 'random', label: t.vocalRandom },
                    { id: 'male', label: t.vocalMale },
                    { id: 'female', label: t.vocalFemale },
                    { id: 'none', label: t.vocalNone },
                  ].map((item) => {
                    const isChecked = vocal === item.id;
                    return (
                      <label
                        key={item.id}
                        className="inline-flex items-center gap-2 cursor-pointer select-none text-sm font-semibold text-slate-700"
                      >
                        <div
                          onClick={() => setVocal(item.id as VocalType)}
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isChecked
                              ? 'border-blue-600 bg-white'
                              : 'border-slate-400 bg-white hover:border-slate-600'
                          }`}
                        >
                          {isChecked && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                        </div>
                        <span>{item.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* API Error Notification Card */}
            {apiErrorMessage && (
              <div className="mt-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 animate-in fade-in duration-200">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1 text-xs">
                    <strong className="font-bold text-rose-900 block mb-1">AI 모델 연동 오류 안내</strong>
                    <p className="whitespace-pre-wrap text-rose-700 leading-relaxed mb-3">{apiErrorMessage}</p>
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-rose-200/80">
                      <button
                        type="button"
                        onClick={() => setShowModelSettings(true)}
                        className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-colors cursor-pointer shadow-2xs"
                      >
                        API 키 및 모델 설정 열기
                      </button>
                      <button
                        type="button"
                        onClick={() => handleStart(true)}
                        className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs border border-slate-300 transition-colors cursor-pointer shadow-2xs"
                      >
                        시뮬레이션 모드로 테스트 생성 (SOP 기반)
                      </button>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setApiErrorMessage(null)}
                    className="p-1 text-rose-400 hover:text-rose-700 cursor-pointer"
                  >
                    <XIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Controls: 시작 & 중지 버튼 */}
            <div className="pt-6 border-t border-slate-100 mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStart(false)}
                disabled={isRunning}
                className="flex-1 py-3.5 px-6 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-bold text-base shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                {isRunning ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>작업 진행 중...</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" />
                    <span>{t.startButton}</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleStop}
                disabled={!isRunning}
                className="py-3.5 px-6 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold text-base shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              >
                <Square className="w-4 h-4 fill-current" />
                <span>{t.stopButton}</span>
              </button>
            </div>
          </div>

          {/* RIGHT COLUMN: 제작 진행 상황 / 전체 진행률 / 현재 작업 */}
          <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/90 shadow-xs p-6 flex flex-col justify-between">
            <div className="space-y-6">
              {/* 제작 진행 상황 Header */}
              <div>
                <h3 className="font-extrabold text-slate-800 text-base mb-4">
                  {t.progressTitle}
                </h3>

                {/* 4-Step Horizontal Stepper - Matches screenshot */}
                <div className="relative flex items-center justify-between px-2 pt-2 pb-4">
                  {/* Background connecting line */}
                  <div className="absolute top-7 left-6 right-6 h-0.5 bg-slate-200 -z-0" />
                  {/* Active filled connecting line */}
                  <div
                    className="absolute top-7 left-6 h-0.5 bg-blue-600 transition-all duration-300 -z-0"
                    style={{
                      width: `${(stepIndex / 3) * 85}%`
                    }}
                  />

                  {[
                    { id: 'plan', label: '01 PLAN', icon: ClipboardList, idx: 0 },
                    { id: 'create', label: '02 CREATE', icon: Music, idx: 1 },
                    { id: 'produce', label: '03 PRODUCE', icon: Headphones, idx: 2 },
                    { id: 'complete', label: '04 COMPLETE', icon: CheckSquare, idx: 3 },
                  ].map((step) => {
                    const isDone = stepIndex > step.idx;
                    const isCurrent = stepIndex === step.idx && isRunning;
                    const Icon = step.icon;

                    return (
                      <div key={step.id} className="flex flex-col items-center z-10">
                        <div
                          className={`w-12 h-12 rounded-full border-2 flex items-center justify-center transition-all bg-white shadow-xs ${
                            isDone
                              ? 'border-blue-600 text-blue-600 bg-blue-50/50'
                              : isCurrent
                              ? 'border-blue-600 text-blue-600 ring-4 ring-blue-100 scale-105 animate-pulse'
                              : 'border-slate-200 text-slate-400'
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <span
                          className={`text-[10px] font-bold mt-2 tracking-tight ${
                            isDone || isCurrent ? 'text-blue-700' : 'text-slate-400'
                          }`}
                        >
                          {step.label}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 전체 진행률 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-slate-700">{t.totalProgress}</span>
                  <span className="text-xs font-bold text-blue-600 font-mono">{progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                  <div
                    className="h-full bg-blue-600 rounded-full transition-all duration-300 shadow-xs"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* 현재 작업 Card - Matches screenshot */}
              <div>
                <span className="block text-xs font-bold text-slate-700 mb-2">{t.currentTaskTitle}</span>
                <div className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50/60 min-h-[120px] flex flex-col justify-center">
                  <div className="flex items-start gap-2.5">
                    {isRunning ? (
                      <div className="w-2.5 h-2.5 rounded-full bg-blue-600 animate-ping mt-1 shrink-0" />
                    ) : (
                      <div className="w-2.5 h-2.5 rounded-full bg-slate-400 mt-1 shrink-0" />
                    )}
                    <div className="text-xs text-slate-700 font-medium leading-relaxed">
                      {statusMessage === '대기 중...' ? t.waiting : statusMessage}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Result Viewer trigger if results exist */}
            {resultData && !isRunning && (
              <div className="pt-4 border-t border-slate-100 mt-4">
                <button
                  type="button"
                  onClick={() => setShowResultModal(true)}
                  className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span>이전 생성 결과 팝업 다시 열기</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      <GoogleSheetsGuideModal
        isOpen={showGoogleSheetGuide}
        onClose={() => setShowGoogleSheetGuide(false)}
        savedSheetUrl={sheetUrl}
        onSaveSheetUrl={handleSaveSheetUrl}
      />

      <ModelSettingsModal
        isOpen={showModelSettings}
        onClose={() => setShowModelSettings(false)}
        currentProvider={provider}
        currentModel={model}
        isAutoModel={isAutoModel}
        apiKeys={apiKeys}
        onSave={handleSaveModelSettings}
      />

      <ThemeManagerModal
        isOpen={showThemeManager}
        onClose={() => setShowThemeManager(false)}
        themes={themes}
        currentThemeId={selectedTheme?.id || ''}
        onSelectTheme={(th) => {
          setSelectedTheme(th);
          setResultData(null);
        }}
        onThemesUpdated={(updated) => {
          setThemes(updated);
          setSelectedTheme((prev) => {
            if (!prev) return updated[0] || null;
            const matching = updated.find((t) => t.id === prev.id);
            return matching || updated[0] || null;
          });
        }}
      />

      <ResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        data={resultData}
        lang={currentLang}
      />

      <ExpiredPaymentModal
        isOpen={showExpiredModal}
        onClose={() => setShowExpiredModal(false)}
        dueDate={expiredDueDate}
        licenseKey={expiredLicenseKey}
        lang={currentLang}
      />
    </div>
  );
}
