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
                    {t.tracksCompletedBadge.replace('{count}', String(data.tracks.length))}
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
                aria-label={t.close}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-600 font-medium flex flex-wrap items-center gap-1.5 sm:gap-2 pl-0 sm:pl-[52px]">
            <span className="leading-snug">
              {t.selectedThemeLabel}: <strong className="text-blue-900">{data.themeName}</strong>
            </span>
            {data.lyricConcept && (
              <span className="text-[11px] bg-blue-100/80 text-blue-900 font-semibold px-2 py-0.5 rounded-md border border-blue-200 leading-snug break-words max-w-full">
                {t.lyricConceptLabel}: {data.lyricConcept}
              </span>
            )}
            {data.modelUsed.includes('시뮬레이션') && (
              <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded whitespace-nowrap">
                {t.localSimulationMode}
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
            <span className="sm:hidden truncate">{t.tracksTabShort} ({data.tracks.length})</span>
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
            <span className="sm:hidden truncate">{t.youtubeTabShort}</span>
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
            <span className="sm:hidden truncate">{t.allInOneTabShort}</span>
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
                          {copiedKey === `track_all_${track.trackNumber}` ? t.copied : t.copyTrackAll}
                        </span>
                      </button>
                    </div>

                    <div className="p-3.5 sm:p-5 space-y-3 sm:space-y-4 text-xs">
                      {/* Meta Info */}
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

                      {/* 1. Song Title */}
                      <div className="p-3 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              {t.songTitleLabel}{' '}
                              {lang === 'ko' && <span className="hidden sm:inline font-semibold text-slate-500">(Song Title)</span>}
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
                                <span>{t.copyCompleted}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>{t.copyTitle}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-bold text-slate-900 text-sm sm:text-base bg-white p-2.5 sm:p-3 rounded-lg border border-slate-200 select-all break-words">
                          {track.title}
                        </div>
                      </div>

                      {/* 2. Style Prompt */}
                      <div className="p-3 sm:p-4 bg-blue-50/50 rounded-xl border border-blue-200/80">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-blue-950 tracking-tight text-xs flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              {t.stylePromptLabel}{' '}
                              <span className="hidden sm:inline font-semibold text-blue-700/80">(Suno / Udio)</span>
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
                                <span>{t.copyCompleted}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>{t.copyPrompt}</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-slate-800 bg-white p-2.5 sm:p-3 rounded-lg border border-blue-100 text-[11px] sm:text-xs leading-relaxed select-all break-words">
                          {track.stylePrompt}
                        </div>
                      </div>

                      {/* 3. Full Lyrics */}
                      <div className="p-3 sm:p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5 min-w-0">
                            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0"></span>
                            <span className="truncate">
                              {t.lyricsLabel}{' '}
                              {lang === 'ko' && <span className="hidden sm:inline font-semibold text-slate-500">(Full Lyrics)</span>}
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
                                <span>{t.copyCompleted}</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 shrink-0" />
                                <span>{t.copyLyrics}</span>
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
                `[YouTube Title - KO]\n${titleKo}`,
                titleEn ? `[YouTube Title - EN]\n${titleEn}` : '',
                `[Description - KO]\n${descKo}`,
                descEn ? `[Description - EN]\n${descEn}` : '',
                `[Tracklist]\n${data.youtube.tracklist}`,
                `[Hashtags]\n${data.youtube.hashtags}`,
                `[Thumbnail Prompt]\n${data.youtube.thumbnailPrompt}`,
              ].filter(Boolean);
              return parts.join('\n\n');
            };

            return (
              <div className="space-y-3.5 sm:space-y-4">
                <div className="p-3.5 sm:p-4 bg-rose-50/60 border border-rose-200/70 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-extrabold text-rose-900 text-xs sm:text-sm flex items-center gap-2">
                      <Youtube className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0" />
                      <span>{t.ytPackageTitle}</span>
                    </h3>
                    <p className="text-[11px] sm:text-xs text-rose-700 mt-1 leading-relaxed">
                      {t.ytPackageDesc}
                    </p>
                  </div>
                  <button
                    onClick={() => handleCopy(buildYoutubeAllText(), 'youtube_all')}
                    className="w-full sm:w-auto justify-center shrink-0 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === 'youtube_all' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedKey === 'youtube_all' ? t.ytPackageCopied : t.copyYoutubeAll}</span>
                  </button>
                </div>

                {/* 1. Video Title */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span>
                        {t.ytVideoTitleLabel}{' '}
                        <span className="hidden sm:inline">(KO / EN)</span>
                      </span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇰🇷 {t.ytKoreanVersion}</span>
                      <button
                        onClick={() => handleCopy(titleKo, 'yt_title_ko')}
                        className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'yt_title_ko' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                        <span>{copiedKey === 'yt_title_ko' ? t.copied : t.ytCopyTitleKo}</span>
                      </button>
                    </div>
                    <div className="font-bold text-slate-900 text-xs sm:text-base bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 select-all break-words leading-snug">
                      {titleKo}
                    </div>
                  </div>

                  {titleEn && (
                    <div className="space-y-1.5 pt-1 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇺🇸 {t.ytEnglishVersion}</span>
                        <button
                          onClick={() => handleCopy(titleEn, 'yt_title_en')}
                          className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedKey === 'yt_title_en' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                          <span>{copiedKey === 'yt_title_en' ? t.copied : t.ytCopyTitleEn}</span>
                        </button>
                      </div>
                      <div className="font-bold text-slate-800 text-xs sm:text-base bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 select-all break-words leading-snug">
                        {titleEn}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Video Description */}
                <div className="p-3.5 sm:p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
                      <span>
                        {t.ytVideoDescLabel}{' '}
                        <span className="hidden sm:inline">(KO / EN)</span>
                      </span>
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇰🇷 {t.ytKoreanVersion}</span>
                      <button
                        onClick={() => handleCopy(descKo, 'yt_desc_ko')}
                        className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                      >
                        {copiedKey === 'yt_desc_ko' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                        <span>{copiedKey === 'yt_desc_ko' ? t.copied : t.ytCopyDescKo}</span>
                      </button>
                    </div>
                    <div className="font-mono text-[11px] sm:text-xs text-slate-800 bg-slate-50 p-2.5 sm:p-3 rounded-lg border border-slate-100 whitespace-pre-wrap break-words leading-relaxed max-h-72 overflow-y-auto select-all">
                      {descKo}
                    </div>
                  </div>

                  {descEn && (
                    <div className="space-y-1.5 pt-2 border-t border-slate-100">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-bold text-slate-500 whitespace-nowrap">🇺🇸 {t.ytEnglishVersion}</span>
                        <button
                          onClick={() => handleCopy(descEn, 'yt_desc_en')}
                          className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                        >
                          {copiedKey === 'yt_desc_en' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                          <span>{copiedKey === 'yt_desc_en' ? t.copied : t.ytCopyDescEn}</span>
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
                      <span className="truncate">{t.ytTracklistLabel}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(data.youtube.tracklist, 'yt_tracklist')}
                      className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedKey === 'yt_tracklist' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                      <span>{copiedKey === 'yt_tracklist' ? t.copied : t.copy}</span>
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
                      <span className="truncate">{t.ytHashtagsLabel}</span>
                    </span>
                    <button
                      onClick={() => handleCopy(data.youtube.hashtags, 'yt_hashtags')}
                      className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap shrink-0"
                    >
                      {copiedKey === 'yt_hashtags' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                      <span>{copiedKey === 'yt_hashtags' ? t.copied : t.copy}</span>
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
                        {t.ytThumbPromptLabel}{' '}
                        <span className="hidden sm:inline text-slate-500 font-semibold">(16:9 Single Scene · No Text)</span>
                      </span>
                    </span>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[10px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 whitespace-nowrap">
                        {data.youtube.thumbnailPrompt.length.toLocaleString()} {t.charsUnit}
                      </span>
                      <button
                        onClick={() => handleCopy(data.youtube.thumbnailPrompt, 'yt_thumb')}
                        className="text-[11px] sm:text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer whitespace-nowrap"
                      >
                        {copiedKey === 'yt_thumb' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                        <span>{copiedKey === 'yt_thumb' ? t.copied : t.copy}</span>
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
                  {t.allInOneDesc}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleDownloadTxt}
                    className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>{t.saveTxtFile}</span>
                  </button>
                  <button
                    onClick={() => handleCopy(generateFullText(), 'raw_all')}
                    className="flex-1 sm:flex-none justify-center px-3 py-2 sm:py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer whitespace-nowrap"
                  >
                    {copiedKey === 'raw_all' ? <Check className="w-3.5 h-3.5 shrink-0" /> : <Copy className="w-3.5 h-3.5 shrink-0" />}
                    <span>{copiedKey === 'raw_all' ? t.allCopiedText : t.copyAllText}</span>
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
            <span>{t.resultFooterNote}</span>
          </div>
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 sm:py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer whitespace-nowrap shrink-0 text-center"
          >
            {t.confirmAndClose}
          </button>
        </div>
      </div>
    </div>
  );
};
