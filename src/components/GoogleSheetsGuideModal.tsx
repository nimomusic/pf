import React, { useState } from 'react';
import { X, Copy, Check, ExternalLink, FileSpreadsheet, Code2, Sparkles, CheckCircle2 } from 'lucide-react';

interface GoogleSheetsGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  savedSheetUrl: string;
  onSaveSheetUrl: (url: string) => void;
}

export const GoogleSheetsGuideModal: React.FC<GoogleSheetsGuideModalProps> = ({
  isOpen,
  onClose,
  savedSheetUrl,
  onSaveSheetUrl
}) => {
  const [activeTab, setActiveTab] = useState<'appsscript' | 'csv'>('appsscript');
  const [inputUrl, setInputUrl] = useState(savedSheetUrl);
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error'; message: string }>({
    status: 'idle',
    message: ''
  });

  if (!isOpen) return null;

  const appsScriptCode = `function doGet(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var data = sheet.getDataRange().getValues();
  var rows = [];

  for (var i = 1; i < data.length; i++) {
    var rawDate = data[i][2]; // C열: due date
    var dueDateStr = '';
    if (rawDate instanceof Date) {
      dueDateStr = Utilities.formatDate(rawDate, 'GMT+9', 'yyyy-MM-dd');
    } else if (rawDate) {
      dueDateStr = rawDate.toString().trim();
    }

    rows.push({
      uuid: data[i][0] ? data[i][0].toString().trim() : '', // A열: uuid
      'due date': dueDateStr,                               // C열: due date
      tier: data[i][5] ? data[i][5].toString().trim() : 'Standard' // F열: tier
    });
  }

  return ContentService.createTextOutput(JSON.stringify(rows))
    .setMimeType(ContentService.MimeType.JSON);
}`;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(appsScriptCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleSaveAndTest = async () => {
    onSaveSheetUrl(inputUrl);
    if (!inputUrl.trim()) {
      setTestResult({ status: 'error', message: 'URL을 입력해주세요.' });
      return;
    }
    setTestResult({ status: 'loading', message: '구글 스프레드시트 연결 확인 중...' });
    try {
      const res = await fetch(inputUrl.trim());
      if (res.ok) {
        setTestResult({
          status: 'success',
          message: '성공적으로 구글 시트와 통신되었습니다! 이제 시트에 키를 추가하면 실시간 인증됩니다.'
        });
      } else {
        setTestResult({
          status: 'error',
          message: `응답 코드 ${res.status}: 스프레드시트 권한이 '모든 사용자'로 공개되었는지 확인해 주세요.`
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: '연결 실패: URL이 정확한지, 배포 시 액세스 권한이 [모든 사용자(Anyone)]로 설정되었는지 확인하세요.'
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800">구글 스프레드시트 라이선스 연동 안내</h2>
              <p className="text-xs text-slate-500">내 스프레드시트에 직접 라이선스 키를 입력하고 실시간으로 인증하는 방법</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-sm">
          {/* Method Selector Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => setActiveTab('appsscript')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'appsscript'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              방법 1: Google Apps Script 웹앱 (추천 · 실시간 JSON)
            </button>
            <button
              onClick={() => setActiveTab('csv')}
              className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'csv'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              방법 2: CSV 웹 게시 (코드 없음 · 30초 완성)
            </button>
          </div>

          {activeTab === 'appsscript' ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-2">
                <h4 className="font-semibold text-blue-900 flex items-center gap-1.5 text-xs sm:text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  스프레드시트 컬럼 구성 (1행)
                </h4>
                <p className="text-xs text-blue-800">
                  새 구글 시트를 만들고 첫 번째 행에 다음 헤더를 입력하세요:
                </p>
                <div className="grid grid-cols-3 gap-2 text-xs font-mono bg-white p-2.5 rounded-lg border border-blue-200 text-center">
                  <div className="bg-slate-50 p-1.5 rounded font-bold text-slate-700">A1: LicenseKey</div>
                  <div className="bg-slate-50 p-1.5 rounded text-slate-600">B1: User</div>
                  <div className="bg-slate-50 p-1.5 rounded text-slate-600">C1: Tier</div>
                </div>
                <p className="text-[11px] text-slate-500">
                  예시: A2에 <code className="text-blue-700 font-bold">PLY-2025-VIP</code>, B2에 <code className="text-slate-700">홍길동</code>, C2에 <code className="text-slate-700">VIP</code> 입력
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-slate-700 text-xs flex items-center gap-1">
                    <Code2 className="w-3.5 h-3.5 text-blue-600" />
                    Apps Script 코드 (복사하여 붙여넣기)
                  </label>
                  <button
                    onClick={handleCopyCode}
                    className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium cursor-pointer"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? '복사 완료!' : '코드 복사'}</span>
                  </button>
                </div>
                <div className="relative bg-slate-900 text-slate-200 p-3 rounded-xl font-mono text-[11px] max-h-40 overflow-y-auto leading-relaxed">
                  <pre>{appsScriptCode}</pre>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <p className="font-semibold text-slate-800">배포 순서:</p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>구글 시트 상단 메뉴 <strong>[확장 프로그램] → [Apps Script]</strong> 클릭</li>
                  <li>기존 코드를 지우고 위 코드를 그대로 붙여넣은 뒤 <strong>저장(Ctrl+S)</strong></li>
                  <li>우측 상단 <strong>[배포] → [새 배포]</strong> 클릭</li>
                  <li>유형 선택에서 <strong>[웹 앱]</strong> 선택</li>
                  <li>
                    액세스 권한 항목을 반드시 <strong className="text-blue-700 underline">[모든 사용자 (Anyone)]</strong>로 설정 후 배포!
                  </li>
                  <li>생성된 <strong>웹 앱 URL</strong>을 아래 입력칸에 붙여넣으세요.</li>
                </ol>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <h4 className="font-semibold text-emerald-900 text-xs sm:text-sm">
                  코드 없이 30초 만에 CSV로 웹 게시하기
                </h4>
                <ol className="list-decimal pl-5 space-y-1.5 text-xs text-emerald-800">
                  <li>구글 스프레드시트에 A열에 유효한 라이선스 키들을 쭉 적습니다.</li>
                  <li>시트 상단 메뉴 <strong>[파일] → [공유] → [웹에 게시]</strong>를 누릅니다.</li>
                  <li>형식을 웹페이지 대신 <strong>[쉼표로 구분된 값(.csv)]</strong>로 선택합니다.</li>
                  <li><strong>[게시]</strong> 버튼을 누르고 생성된 링크를 복사합니다.</li>
                </ol>
              </div>
            </div>
          )}

          {/* URL Input & Test Area */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="block text-xs font-bold text-slate-700">
              구글 시트 연동 URL (Apps Script 웹 앱 URL 또는 CSV 링크)
            </label>
            <div className="flex gap-2">
              <input
                type="url"
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://script.google.com/macros/s/.../exec 또는 docs.google.com/.../pub?output=csv"
                className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSaveAndTest}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                저장 및 연결 테스트
              </button>
            </div>

            {testResult.status !== 'idle' && (
              <div
                className={`p-3 rounded-xl text-xs flex items-start gap-2 ${
                  testResult.status === 'success'
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    : testResult.status === 'loading'
                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                    : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}
              >
                {testResult.status === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : null}
                <div>{testResult.message}</div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>* 아직 시트를 연결하지 않았더라도 마스터 키 <code className="font-bold text-blue-600">PLYMASTER-VIP</code>로 바로 이용할 수 있습니다.</span>
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
