import React, { useState } from 'react';
import { X, Copy, Check, Download, Music2, Youtube, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { PlaylistResult, TrackItem } from '../types';
import { getTranslation } from '../i18n/translations';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlaylistResult | null;
  lang?: string;
  isAdmin?: boolean;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, data, lang = 'ko', isAdmin = false }) => {
  const t = getTranslation(lang);
  const [activeTab, setActiveTab] = useState<'tracks' | 'youtube' | 'all'>('tracks');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  if (!isOpen || !data) return null;

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => {
      setCopiedKey((prev) => (prev === key ? null : prev));
    }, 2000);
  };

  const generateFullText = () => {
    let full = `========================================\n`;
    full += `[PLYMASTER FACTORY] 유튜브 플레이리스트 제작 결과\n`;
    full += `테마: ${data.themeName}\n`;
    if (data.lyricConcept) {
      full += `가사 컨셉: ${data.lyricConcept}\n`;
    }
    full += `사용 모델: ${data.modelUsed}\n`;
    full += `생성 일시: ${new Date(data.generatedAt).toLocaleString('ko-KR')}\n`;
    full += `========================================\n\n`;

    full += `### 1. 트랙 리스트 (총 ${data.tracks.length}곡)\n\n`;
    data.tracks.forEach((t) => {
      full += `----------------------------------------\n`;
      full += `Track ${t.trackNumber} — ${t.title}\n\n`;
      if (t.metaInfo) {
        full += `Meta Info\n`;
        full += `Vocal: ${t.metaInfo.vocal || (data.vocal === 'male' ? 'Male Lead Vocal' : data.vocal === 'female' ? 'Female Lead Vocal' : 'Vocal')}\n`;
        full += `Genre: ${t.metaInfo.genre || data.themeName}\n`;
        full += `Mood: ${t.metaInfo.mood || t.mood || 'Emotional'}\n`;
        full += `BPM: ${t.metaInfo.bpm || '80 BPM'}\n`;
        full += `Target Length: ${t.metaInfo.targetLength || '3:10'}\n\n`;
      }
      full += `Title\n${t.title}\n\n`;
      full += `Style Prompt\n${t.stylePrompt}\n\n`;
      full += `Lyrics\n${t.fullLyrics}\n\n`;
    });

    const titleKo = data.youtube.titleKo || data.youtube.title;
    const titleEn = data.youtube.titleEn || '';
    const descKo = data.youtube.descriptionKo || data.youtube.description;
    const descEn = data.youtube.descriptionEn || '';

    full += `\n### 2. 유튜브 업로드 패키지\n\n`;
    full += `[영상 제목 - 한국어]\n${titleKo}\n\n`;
    if (titleEn) {
      full += `[영상 제목 - English]\n${titleEn}\n\n`;
    }
    full += `[영상 설명 - 한국어]\n${descKo}\n\n`;
    if (descEn) {
      full += `[영상 설명 - English]\n${descEn}\n\n`;
    }
    full += `[트랙리스트]\n${data.youtube.tracklist}\n\n`;
    full += `[해시태그]\n${data.youtube.hashtags}\n\n`;
    full += `[썸네일 프롬프트]\n${data.youtube.thumbnailPrompt}\n`;

    return full;
  };

  const handleDownloadTxt = () => {
    const text = generateFullText();
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Plymaster_${data.themeName.replace(/\s+/g, '_')}_${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[94vh] sm:max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-4 py-3 sm:px-6 sm:py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 space-y-2">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shrink-0">
                <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                  <h2 className="text-base sm:text-lg font-bold text-slate-900 whitespace-nowrap">
                    {t.completedModalTitle}
                  </h2>
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-blue-100 text-blue-700 whitespace-nowrap shrink-0">
                    {data.tracks.length}곡 완성
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-200/80 text-slate-700 whitespace-nowrap max-w-[160px] sm:max-w-none truncate">
                    {data.modelUsed}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              <button
                onClick={handleDownloadTxt}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs cursor-pointer whitespace-nowrap"
              >
                <Download className="w-3.5 h-3.5 text-blue-600" />
                <span>{t.downloadTxt}</span>
              </button>
              <button
                onClick={() => handleCopy(generateFullText(), 'copy_all')}
                className="inline-flex items-center gap-1 sm:gap-1.5 px-2.5 py-1.5 sm:px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] sm:text-xs font-bold shadow-xs cursor-pointer whitespace-nowrap shrink-0"
              >
                {copiedKey === 'copy_all' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                <span>{copiedKey === 'copy_all' ? t.copied : t.copyAll}</span>
              </button>
              <button
                onClick={onClose}
                aria-label="닫기"
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-600 font-medium flex flex-wrap items-center gap-1.5 sm:gap-2 pl-0 sm:pl-[52px]">
            <span className="leading-snug">
              선택 테마: <strong className="text-blue-900">{data.themeName}</strong>
            </span>
            {data.lyricConcept && (
              <span className="text-[11px] bg-blue-100/80 text-blue-900 font-semibold px-2 py-0.5 rounded-md border border-blue-200 leading-snug break-words max-w-full">
                가사 컨셉: {data.lyricConcept}
              </span>
            )}
            {data.modelUsed.includes('시뮬레이션') && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                로컬 시뮬레이션 모드
              </span>
            )}
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-3 sm:flex border-b border-slate-200 bg-slate-50/50 px-2 sm:px-6 pt-1.5 sm:pt-2 gap-1 sm:gap-0">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 text-[11px] sm:text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
              activeTab === 'tracks'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-500 shrink-0" />
            <span className="sm:hidden truncate">{lang === 'ko' ? '트랙' : 'Tracks'} ({data.tracks.length})</span>
            <span className="hidden sm:inline">{t.tracksTab} ({data.tracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 text-[11px] sm:text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
              activeTab === 'youtube'
                ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Youtube className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-500 shrink-0" />
            <span className="sm:hidden truncate">{lang === 'ko' ? '유튜브 패키지' : 'YouTube'}</span>
            <span className="hidden sm:inline">{t.youtubeTab}</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center justify-center sm:justify-start gap-1.5 sm:gap-2 py-2.5 sm:py-3 px-2 sm:px-4 text-[11px] sm:text-xs font-bold border-b-2 transition-all cursor-pointer whitespace-nowrap min-w-0 ${
              activeTab === 'all'
                ? 'border-slate-800 text-slate-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-500 shrink-0" />
            <span className="sm:hidden truncate">{lang === 'ko' ? '전체 보기' : 'All'}</span>
            <span className="hidden sm:inline">{t.allInOneTab}</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-3.5 sm:p-6 overflow-y-auto flex-1 space-y-4 sm:space-y-6">
          {/* TAB 1: TRACKS */}
          {activeTab === 'tracks' && (
            <div className="space-y-4 sm:space-y-6">
              {data.tracks.map((track: TrackItem, idx: number) => {
                const trackNum = idx + 1;
                const metaStr = track.metaInfo
                  ? `Meta Info\nVocal: ${track.metaInfo.vocal || 'Female'}\nGenre: ${track.metaInfo.genre || 'Vintage Pop'}\nMood: ${track.metaInfo.mood || track.mood || 'Nostalgic'}\nBPM: ${track.metaInfo.bpm || '80 BPM'}\nTarget Length: ${track.metaInfo.targetLength || '3:05'}\n\n`
                  : '';
                const trackFullText = `Track ${trackNum} — ${track.title}\n\n${metaStr}Title\n${track.title}\n\nStyle Prompt\n${track.stylePrompt}\n\nLyrics\n${track.fullLyrics}`;

                return (
                  <div
                    key={`${trackNum}-${idx}`}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
                  >
                    {/* Track Header */}
                    <div className="px-3.5 py-3 sm:px-5 sm:py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-blue-600 text-white font-black text-[11px] sm:text-xs flex items-center justify-center shrink-0">
                          {track.trackNumber}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-xs sm:text-sm whitespace-nowrap">
                          Track {track.trackNumber}
                        </h3>
                        {track.mood && (
                          <span className="text-[10px] sm:text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200 truncate max-w-[110px] sm:max-w-none">
                            {track.mood}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(trackFullText, `track_all_${track.trackNumber}`)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 sm:px-3 bg-white hover:bg-slate-100 text-slate-700 text-[11px] sm:text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer shadow-2xs whitespace-nowrap shrink-0"
                      >
                        {copiedKey === `track_all_${track.trackNumber}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span>
                          {copiedKey === `track_all_${track.trackNumber}` ? '복사됨!' : '트랙 전체 복사'}
                        </span>
                      </button>
                    </div>

                    <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-xs">
                      {/* Meta Info (if present in SOP) */}
                      {track.metaInfo && (
                        <div className="p-3 sm:p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200/80 flex flex-wrap items-center gap-1.5 sm:gap-2">
                          <span className="font-extrabold text-indigo-950 text-[11px] sm:text-xs mr-1 whitespace-nowrap">Meta Info:</span>
                          {track.metaInfo.vocal && (
                            <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              🎙️ {track.metaInfo.vocal}
                            </span>
                          )}
                          {track.metaInfo.genre && (
                            <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              🎵 {track.metaInfo.genre}
                            </span>
                          )}
                          {track.metaInfo.bpm && (
                            <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs whitespace-nowrap">
                              ⏱️ {track.metaInfo.bpm}
                            </span>
                          )}
                          {track.metaInfo.targetLength && (
                            <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs whitespace-nowrap">
                              ⏳ {track.metaInfo.targetLength}
                            </span>
                          )}
                          {track.metaInfo.mood && (
                            <span className="bg-white px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              ✨ {track.metaInfo.mood}
                            </span>
                          )}
                        </div>
                      )}

                      {/* 1. 곡 제목 (Song Title) */}
                      <div className="p-3 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              곡 제목 <span className="hidden sm:inline font-semibold text-slate-500">(Song Title)</span>
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(track.title, `title_${track.trackNumber}`)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs border whitespace-nowrap shrink-0 ${
                              copiedKey === `title_${track.trackNumber}`
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            {copiedKey === `title_${track.trackNumber}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>제목 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-bold text-slate-900 text-sm sm:text-base bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 select-all break-words">
                          {track.title}
                        </div>
                      </div>

                      {/* 2. 스타일 프롬프트 (Style Prompt for Suno/Udio) */}
                      <div className="p-3 sm:p-4 bg-blue-50/50 rounded-xl border border-blue-200/80">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-blue-950 tracking-tight text-xs flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              스타일 프롬프트 <span className="hidden sm:inline font-semibold text-blue-700/80">(Style Prompt - Suno / Udio)</span>
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(track.stylePrompt, `style_${track.trackNumber}`)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs border whitespace-nowrap shrink-0 ${
                              copiedKey === `style_${track.trackNumber}`
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            {copiedKey === `style_${track.trackNumber}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>프롬프트 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-slate-800 bg-white p-2.5 sm:p-3 rounded-lg border border-blue-100 text-[11px] sm:text-xs leading-relaxed select-all break-words">
                          {track.stylePrompt}
                        </div>
                      </div>

                      {/* 3. 가사 (Full Lyrics) */}
                      <div className="p-3 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              가사 <span className="hidden sm:inline font-semibold text-slate-500">(Full Lyrics)</span>
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(track.fullLyrics, `lyrics_${track.trackNumber}`)}
                            className={`inline-flex items-center gap-1 px-2.5 py-1.5 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all cursor-pointer shadow-2xs border whitespace-nowrap shrink-0 ${
                              copiedKey === `lyrics_${track.trackNumber}`
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            {copiedKey === `lyrics_${track.trackNumber}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                <span>복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>가사 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono whitespace-pre-wrap break-words bg-white p-3 sm:p-3.5 rounded-lg border border-slate-200 text-[11px] sm:text-xs text-slate-800 leading-relaxed max-h-64 overflow-y-auto select-all">
                          {track.fullLyrics}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* TAB 2: YOUTUBE UPLOAD PACKAGE */}
          {activeTab === 'youtube' && (() => {
            const titleKo = data.youtube.titleKo || data.youtube.title;
            const titleEn = data.youtube.titleEn || '';
            const descKo = data.youtube.descriptionKo || data.youtube.description;
            const descEn = data.youtube.descriptionEn || '';

            const buildYoutubeAllText = () => {
              const parts = [
                `[영상 제목 - 한국어]\n${titleKo}`,
                titleEn ? `[영상 제목 - English]\n${titleEn}` : '',
                `[영상 설명 - 한국어]\n${descKo}`,
                descEn ? `[영상 설명 - English]\n${descEn}` : '',
                `[트랙리스트]\n${data.youtube.tracklist}`,
                `[해시태그]\n${data.youtube.hashtags}`,
                `[썸네일 프롬프트]\n${data.youtube.thumbnailPrompt}`,
              ].filter(Boolean);
              return parts.join('\n\n');
            };

            return (
              <div className="space-y-3.5 sm:space-y-4">
                <div className="p-3.5 sm:p-4 bg-rose-50/60 border border-rose-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-rose-900 text-xs sm:text-sm flex items-center gap-2">
                      <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
                      <span>유튜브 플레이리스트 업로드 원스톱 패키지</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-rose-700 mt-1 leading-relaxed">
                      한국어/영어 듀얼 제목·설명문, 트랙리스트, SEO 해시태그 5종 및 실사 사진급 2,000자+ 썸네일 프롬프트
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(buildYoutubeAllText(), 'youtube_all')}
                    className="w-full sm:w-auto justify-center shrink-0 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === 'youtube_all' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedKey === 'youtube_all' ? '패키지 전체 복사됨' : '유튜브 패키지 일괄 복사'}</span>
                  </button>
                </div>

                {/* 1. Video Title (Korean & English) */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span>영상 제목 <span className="hidden sm:inline">(YouTube Title — 한국어 / English)</span></span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇰🇷 한국어 버전</span>
                      <button
                        onClick={() => handleCopy(titleKo, 'yt_title_ko')}
                        className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'yt_title_ko' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                        <span>{copiedKey === 'yt_title_ko' ? '복사됨' : '한국어 제목 복사'}</span>
                      </button>
                    </div>
                    <div className="font-bold text-slate-900 text-xs sm:text-base bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 select-all break-words leading-snug">
                      {titleKo}
                    </div>
                  </div>

                  {titleEn && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇺🇸 English Version</span>
                        <button
                          onClick={() => handleCopy(titleEn, 'yt_title_en')}
                          className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedKey === 'yt_title_en' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                          <span>{copiedKey === 'yt_title_en' ? '복사됨' : '영문 제목 복사'}</span>
                        </button>
                      </div>
                      <div className="font-bold text-slate-800 text-xs sm:text-base bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 select-all break-words leading-snug">
                        {titleEn}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Video Description (Korean & English) */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span>영상 설명 <span className="hidden sm:inline">(Description — 한국어 / English)</span></span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇰🇷 한국어 버전</span>
                      <button
                        onClick={() => handleCopy(descKo, 'yt_desc_ko')}
                        className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'yt_desc_ko' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                        <span>{copiedKey === 'yt_desc_ko' ? '복사됨' : '한국어 설명 복사'}</span>
                      </button>
                    </div>
                    <div className="font-mono text-[11px] sm:text-xs text-slate-800 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto select-all">
                      {descKo}
                    </div>
                  </div>

                  {descEn && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇺🇸 English Version</span>
                        <button
                          onClick={() => handleCopy(descEn, 'yt_desc_en')}
                          className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedKey === 'yt_desc_en' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                          <span>{copiedKey === 'yt_desc_en' ? '복사됨' : '영문 설명 복사'}</span>
                        </button>
                      </div>
                      <div className="font-mono text-[11px] sm:text-xs text-slate-800 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto select-all">
                        {descEn}
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Tracklist */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="truncate">트랙리스트 (Tracklist)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(data.youtube.tracklist, 'yt_tracklist')}
                      className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedKey === 'yt_tracklist' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                      <span>{copiedKey === 'yt_tracklist' ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] sm:text-xs text-slate-800 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 whitespace-pre-line break-words">
                    {data.youtube.tracklist}
                  </div>
                </div>

                {/* 4. Hashtags */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span className="truncate">해시태그 (5 Core SEO Hashtags)</span>
                    </span>
                    <button
                      onClick={() => handleCopy(data.youtube.hashtags, 'yt_hashtags')}
                      className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedKey === 'yt_hashtags' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                      <span>{copiedKey === 'yt_hashtags' ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                  <div className="font-semibold text-blue-700 text-[11px] sm:text-xs bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 select-all break-words leading-relaxed">
                    {data.youtube.hashtags}
                  </div>
                </div>

                {/* 5. Thumbnail Prompt */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5 min-w-0">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0"></span>
                      <span>
                        썸네일 프롬프트 <span className="hidden sm:inline text-slate-500 font-semibold">(16:9 Single Scene · No Text)</span>
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap">
                        {data.youtube.thumbnailPrompt.length.toLocaleString()}자
                      </span>
                      <button
                        onClick={() => handleCopy(data.youtube.thumbnailPrompt, 'yt_thumb')}
                        className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {copiedKey === 'yt_thumb' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                        <span>{copiedKey === 'yt_thumb' ? '복사됨' : '복사'}</span>
                      </button>
                    </div>
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 leading-relaxed max-h-64 overflow-y-auto select-all break-words">
                    {data.youtube.thumbnailPrompt}
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: ALL IN ONE */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <span className="text-[11px] sm:text-xs text-slate-500 font-semibold leading-snug">
                  원클릭 복사 또는 텍스트 파일 저장에 유용한 통합 형식입니다.
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTxt}
                    className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>TXT 파일 저장</span>
                  </button>
                  <button
                    onClick={() => handleCopy(generateFullText(), 'raw_all')}
                    className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === 'raw_all' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedKey === 'raw_all' ? '전체 복사됨!' : '전체 텍스트 복사'}</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={generateFullText()}
                rows={16}
                className="w-full p-3 sm:p-4 font-mono text-[11px] sm:text-xs leading-relaxed bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none select-all"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-4 py-3 sm:px-6 sm:py-3.5 border-t border-slate-100 bg-slate-50 flex flex-col-reverse sm:flex-row sm:items-center justify-between gap-2.5 text-[11px] sm:text-xs text-slate-500">
          <div className="flex items-center gap-1.5 text-emerald-600 font-medium leading-snug">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>생성된 프롬프트와 가사는 Suno, Udio 및 유튜브에 즉시 사용 가능합니다.</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 text-center"
          >
            확인 및 창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
