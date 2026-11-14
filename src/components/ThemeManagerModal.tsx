import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Plus,
  Trash2,
  Edit3,
  Check,
  RefreshCw,
  FolderKanban,
  Sparkles,
  FileText,
  Cloud,
  CloudOff,
  Download,
  Upload,
  LogIn,
  LogOut
} from 'lucide-react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { ensureFirebaseInitialized, getFirebaseDiagnostics, signInWithGoogleForAdmin, signOutFirebase } from '../firebase';
import { Theme } from '../types';
import {
  createTheme,
  updateTheme,
  deleteTheme,
  resetThemesToDefault,
  syncThemesToFirestore,
  fetchThemes,
  importThemesBulk
} from '../services/api';

interface ThemeManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  themes: Theme[];
  currentThemeId: string;
  onSelectTheme: (theme: Theme) => void;
  onThemesUpdated: (themes: Theme[]) => void;
}

export const ThemeManagerModal: React.FC<ThemeManagerModalProps> = ({
  isOpen,
  onClose,
  themes,
  currentThemeId,
  onSelectTheme,
  onThemesUpdated
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formId, setFormId] = useState('');
  const [formName, setFormName] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formSop, setFormSop] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [syncNotice, setSyncNotice] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [cloudUser, setCloudUser] = useState<User | null>(null);
  const [firebaseReady, setFirebaseReady] = useState<boolean | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    let unsub: (() => void) | undefined;

    ensureFirebaseInitialized().then(({ auth: activeAuth, configured }) => {
      if (cancelled) return;
      setFirebaseReady(configured);
      if (!activeAuth) return;
      setCloudUser(activeAuth.currentUser || null);
      unsub = onAuthStateChanged(activeAuth, (user) => {
        if (!cancelled) setCloudUser(user);
      });
    });

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const formatErrorForUi = (err: any, fallback: string) => {
    const raw = err?.message || '';
    const code = err?.code || '';
    if (raw.includes('Missing or insufficient permissions') || raw.includes('PERMISSION_DENIED')) {
      return '클라우드 DB 쓰기 권한이 없습니다. 관리자 Google 계정(nimomusicceo@gmail.com)으로 로그인했는지 확인해 주세요.';
    }
    if (code === 'auth/unauthorized-domain' || raw.includes('auth/unauthorized-domain')) {
      const host = typeof window !== 'undefined' ? window.location.hostname : '';
      return `현재 접속 도메인(${host})이 Firebase 승인된 도메인에 등록되지 않았습니다. Firebase Console → Authentication → Settings → Authorized domains에 '${host}'를 추가해 주세요.`;
    }
    if (code === 'auth/popup-blocked' || raw.includes('auth/popup-blocked')) {
      return '브라우저에서 Google 로그인 팝업 창이 차단되었습니다. 주소창 오른쪽의 팝업 차단 해제를 허용한 뒤 다시 눌러 주세요.';
    }
    if (code === 'auth/popup-closed-by-user' || raw.includes('auth/popup-closed-by-user')) {
      return 'Google 로그인 창이 닫혔습니다. 다시 시도해 주세요.';
    }
    return raw || fallback;
  };

  const handleGoogleCloudConnect = async () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSyncNotice(null);
    try {
      const cred = await signInWithGoogleForAdmin();
      const res = await syncThemesToFirestore(themes);
      const refreshed = await fetchThemes();
      onThemesUpdated(refreshed);
      if (refreshed.length > 0 && !refreshed.some((t) => t.id === currentThemeId)) {
        onSelectTheme(refreshed[0]);
      } else {
        const updatedCur = refreshed.find((t) => t.id === currentThemeId);
        if (updatedCur) onSelectTheme(updatedCur);
      }
      setSyncNotice(
        `${cred.user.email} 계정으로 클라우드 DB가 연결되었습니다. (${res.syncedCount}개 항목 동기화 완료)`
      );
    } catch (err: any) {
      setErrorMsg(formatErrorForUi(err, 'Google 클라우드 로그인에 실패했습니다.'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    setErrorMsg(null);
    setSyncNotice(null);
    try {
      const res = await syncThemesToFirestore(themes);
      const refreshed = await fetchThemes();
      onThemesUpdated(refreshed);
      const updatedCur = refreshed.find((t) => t.id === currentThemeId);
      if (updatedCur) onSelectTheme(updatedCur);
      setSyncNotice(`클라우드 DB 동기화 완료 (${res.syncedCount}건 반영, 총 ${refreshed.length}개 테마)`);
    } catch (err: any) {
      setErrorMsg(formatErrorForUi(err, '클라우드 동기화 중 오류가 발생했습니다.'));
    } finally {
      setIsSyncing(false);
    }
  };

  const handleGoogleCloudDisconnect = async () => {
    try {
      await signOutFirebase();
      setSyncNotice('Google 클라우드 연결이 해제되었습니다.');
    } catch (err: any) {
      setErrorMsg(err?.message || '로그아웃 중 오류가 발생했습니다.');
    }
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(themes, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plymaster-themes-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsSyncing(true);
    setErrorMsg(null);
    setSyncNotice(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!Array.isArray(parsed)) {
        throw new Error('올바른 테마 JSON 배열 형식이 아닙니다.');
      }
      const updated = await importThemesBulk(parsed);
      onThemesUpdated(updated);
      if (updated.length > 0) {
        onSelectTheme(updated[0]);
      }
      setSyncNotice(`JSON 백업에서 ${parsed.length}개 테마를 복원했습니다.`);
    } catch (err: any) {
      setErrorMsg(formatErrorForUi(err, '백업 파일 가져오기에 실패했습니다.'));
    } finally {
      setIsSyncing(false);
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const handleStartAdd = () => {
    setIsEditing(true);
    setEditingId(null);
    setFormId(`THEME_${Date.now().toString().slice(-6)}`);
    setFormName('');
    setFormCategory('재즈 / 팝');
    setFormSop('');
    setErrorMsg(null);
  };

  const handleStartEdit = (t: Theme) => {
    setIsEditing(true);
    setEditingId(t.id);
    setFormId(t.id);
    setFormName(t.name);
    setFormCategory(t.category || '');
    setFormSop(t.sop || '');
    setErrorMsg(null);
  };

  const handleFillTemplate = () => {
    setFormSop(
`1. 장르 및 분위기: 감미롭고 세련된 어쿠스틱 라운지 팝
2. 사운드 구성: 따뜻한 핑거스타일 어쿠스틱 기타, 펠트 피아노, 부드러운 카혼 퍼커션
3. 템포: 90~105 BPM 미디엄 스윙
4. Style Prompt 지침: 'warm cozy acoustic pop, fingerstyle guitar, soft piano, relaxed swing groove, 95 bpm'
5. 가사 구성: [Verse 1] - [Chorus] - [Verse 2] - [Chorus] - [Bridge] - [Outro] 완성형 가사
6. 유튜브 타겟: 카페 음악, 업무 및 공부 집중 BGM, 오후의 감성 휴식`
    );
  };

  const handleSaveForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setErrorMsg('테마 이름을 입력해 주세요.');
      return;
    }
    if (!formSop.trim()) {
      setErrorMsg('SOP 내용을 입력해 주세요.');
      return;
    }

    setIsSaving(true);
    setErrorMsg(null);

    try {
      if (editingId) {
        const updated = await updateTheme(editingId, {
          name: formName,
          category: formCategory,
          sop: formSop
        });
        const updatedList = themes.map((t) => (t.id === editingId ? updated : t));
        onSelectTheme(updated);
        onThemesUpdated(updatedList);
        setIsEditing(false);
        onClose();
      } else {
        const created = await createTheme({
          id: formId,
          name: formName,
          category: formCategory,
          sop: formSop
        });
        const updatedList = [created, ...themes];
        onSelectTheme(created);
        onThemesUpdated(updatedList);
        setIsEditing(false);
        onClose();
      }
    } catch (err: any) {
      setErrorMsg(formatErrorForUi(err, '저장 중 오류가 발생했습니다.'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`'${name}' 테마를 삭제하시겠습니까?`)) return;
    setErrorMsg(null);
    try {
      await deleteTheme(id);
      const remaining = themes.filter((t) => t.id !== id);
      onThemesUpdated(remaining);
      if (currentThemeId === id && remaining.length > 0) {
        onSelectTheme(remaining[0]);
      }
    } catch (err: any) {
      setErrorMsg(formatErrorForUi(err, '삭제에 실패했습니다.'));
    }
  };

  const handleClearAllThemes = async () => {
    if (!confirm('등록된 모든 테마를 초기화(전체 삭제)하시겠습니까?')) return;
    setErrorMsg(null);
    try {
      const restored = await resetThemesToDefault();
      onThemesUpdated(restored);
      onSelectTheme(null as any);
    } catch (err: any) {
      setErrorMsg(formatErrorForUi(err, '초기화에 실패했습니다.'));
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <FolderKanban className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">테마 관리자 (Theme Manager)</h2>
              <p className="text-xs text-slate-500">
                테마 아이디, 이름, SOP 내용을 등록·수정하며 클라우드 데이터베이스(Firestore)에 영구 저장됩니다
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cloud DB Connection & Backup Status Bar */}
        <div className="px-6 py-2.5 border-b border-slate-100 bg-slate-50/70 flex flex-wrap items-center justify-between gap-2 text-xs">
          {cloudUser ? (
            <div className="flex items-center gap-2 text-emerald-700">
              <Cloud className="w-4 h-4 shrink-0" />
              <span className="font-semibold">
                클라우드 영구 저장 연결됨 ({cloudUser.email})
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-amber-700">
              <CloudOff className="w-4 h-4 shrink-0" />
              <span className="font-medium">
                클라우드 DB 미연결 (현재 브라우저 저장소에만 임시 보관됨)
              </span>
            </div>
          )}

          <div className="flex items-center gap-1.5 flex-wrap">
            {cloudUser ? (
              <>
                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? '동기화 중...' : '클라우드 동기화'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleGoogleCloudDisconnect}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 cursor-pointer"
                  title="Google 클라우드 연결 해제"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={handleGoogleCloudConnect}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-xs cursor-pointer disabled:opacity-60"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{isSyncing ? '연결 중...' : 'Google 로그인으로 클라우드 영구 저장 연동'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleExportJson}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium cursor-pointer"
              title="테마 목록 JSON 백업 다운로드"
            >
              <Download className="w-3 h-3" />
              <span>백업</span>
            </button>
            <button
              type="button"
              onClick={() => importInputRef.current?.click()}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-medium cursor-pointer"
              title="백업된 JSON 파일에서 복원"
            >
              <Upload className="w-3 h-3" />
              <span>복원</span>
            </button>
            <input
              ref={importInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>

        {/* Content area */}
        <div className="p-6 overflow-y-auto flex-1">
          {!cloudUser && firebaseReady === true && !syncNotice && !errorMsg && (
            <div className="mb-4 p-3 bg-blue-50/70 border border-blue-200/80 text-blue-800 text-xs rounded-xl leading-relaxed">
              라이선스 키 입장과 별개로, 클라우드 DB(Firestore)에 테마를 영구 저장하려면 위 <strong>「Google 로그인으로 클라우드 영구 저장 연동」</strong> 버튼을 눌러 관리자 Google 계정(팝업 창)으로 1회 인증해 주세요.
            </div>
          )}

          {!cloudUser && firebaseReady === false && !errorMsg && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl leading-relaxed">
              {(() => {
                const diag = getFirebaseDiagnostics();
                if (diag.missingKeys.length > 0) {
                  return `현재 접속 호스트(${diag.hostname})에 Firebase 환경 변수가 아직 설정되지 않았습니다. 누락: ${diag.missingKeys.join(', ')}`;
                }
                return `현재 접속 주소(${diag.hostname})에서 Firebase 설정을 불러오지 못했습니다. 새로고침하거나 최신 버전을 Publish / 재배포한 뒤 다시 시도해 주세요.`;
              })()}
            </div>
          )}

          {syncNotice && (
            <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-xl font-medium">
              {syncNotice}
            </div>
          )}

          {errorMsg && !isEditing && (
            <div className="mb-4 p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium whitespace-pre-line">
              {errorMsg}
            </div>
          )}

          {isEditing ? (
            /* Theme Add / Edit Form */
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>{editingId ? '테마 수정 양식' : '새 테마 등록 양식'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 cursor-pointer"
                >
                  ← 목록으로 돌아가기
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl">
                  {errorMsg}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    테마 아이디 (Theme ID)
                  </label>
                  <input
                    type="text"
                    value={formId}
                    onChange={(e) => setFormId(e.target.value)}
                    disabled={!!editingId}
                    placeholder="예: THEME_XMAS_01"
                    className="w-full px-3 py-2 text-xs font-mono rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">영문/숫자/언더스코어(_) 고유 식별자</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    카테고리 / 태그
                  </label>
                  <input
                    type="text"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    placeholder="예: 재즈 / 겨울 / 캐롤"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-[10px] text-slate-400 mt-0.5">분류 태그</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  테마 이름 (Theme Name) *
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="예: 기분좋은 크리스마스 재즈팝"
                  className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    SOP 내용 (Standard Operating Procedure 지침) *
                  </label>
                  <button
                    type="button"
                    onClick={handleFillTemplate}
                    className="text-[11px] text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>표준 가이드 템플릿 채우기</span>
                  </button>
                </div>
                <textarea
                  value={formSop}
                  onChange={(e) => setFormSop(e.target.value)}
                  placeholder="특정 양식에 구애받지 않고 자유롭게 입력하세요.&#10;예: # Role, 아티스트 특징, 사운드 정체성, 보컬 디렉션, 편곡 지침, 곡 분위기, 가사 방향성 등 입력된 내용을 그대로 분석하여 각 곡에 반영합니다."
                  rows={9}
                  className="w-full p-3 text-xs font-mono leading-relaxed rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-slate-50/50"
                  required
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  * 특정 양식 없이 자유롭게 입력된 내용(Role, 아티스트 특징, 보컬 디렉션 등)을 AI가 그대로 분석하여 각 곡별 트랙 넘버, 곡 제목, 스타일 프롬프트, 전곡 가사를 출력합니다.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? '저장 중...' : editingId ? '수정 내용 저장' : '데이터베이스에 테마 등록'}
                </button>
              </div>
            </form>
          ) : (
            /* Theme List View */
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">
                    현재 저장된 테마 목록 ({themes.length}개)
                  </h3>
                  <p className="text-xs text-slate-500">
                    원하는 테마를 선택하면 메인 1번 테마 필드에 즉시 로드됩니다.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {themes.length > 0 && (
                    <button
                      onClick={handleClearAllThemes}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 text-xs font-medium cursor-pointer transition-colors"
                      title="등록된 모든 테마 비우기"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>전체 비우기</span>
                    </button>
                  )}
                  <button
                    onClick={handleStartAdd}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>새 테마 등록</span>
                  </button>
                </div>
              </div>

              {themes.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  등록된 테마가 없습니다. [새 테마 등록]을 클릭해 SOP를 추가하세요.
                </div>
              ) : (
                <div className="space-y-3">
                  {themes.map((t) => {
                    const isSelected = t.id === currentThemeId;
                    return (
                      <div
                        key={t.id}
                        className={`p-4 rounded-xl border transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50/40 ring-2 ring-blue-500/20'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1.5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold">
                                {t.id}
                              </span>
                              <h4 className="font-bold text-slate-900 text-sm">{t.name}</h4>
                              {t.category && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                                  {t.category}
                                </span>
                              )}
                              {isSelected && (
                                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-100 px-2 py-0.5 rounded-full">
                                  <Check className="w-3 h-3" />
                                  선택됨
                                </span>
                              )}
                            </div>

                            <p className="text-xs text-slate-600 line-clamp-2 font-mono whitespace-pre-line bg-slate-50 p-2 rounded-lg border border-slate-100">
                              {t.sop}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-1">
                            <button
                              onClick={() => {
                                onSelectTheme(t);
                                onClose();
                              }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                isSelected
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-slate-100 hover:bg-blue-600 hover:text-white text-slate-700'
                              }`}
                            >
                              선택
                            </button>
                            <button
                              onClick={() => handleStartEdit(t)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-slate-100 rounded-lg cursor-pointer"
                              title="수정"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(t.id, t.name)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>* 등록·수정된 테마는 Firebase Firestore 클라우드 DB에 영구 보관됩니다.</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold cursor-pointer"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
};
