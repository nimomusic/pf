import React, { useState } from 'react';
import { X, Copy, Check, Download, Music2, Youtube, Sparkles, FileText, CheckCircle2 } from 'lucide-react';
import { PlaylistResult, TrackItem } from '../types';
import { getTranslation } from '../i18n/translations';

interface ResultModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: PlaylistResult | null;
  lang?: string;
}

export const ResultModal: React.FC<ResultModalProps> = ({ isOpen, onClose, data, lang = 'ko' }) => {
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

    full += `\n### 2. 유튜브 업로드 패키지\n\n`;
    full += `[영상 제목]\n${data.youtube.title}\n\n`;
    full += `[영상 설명]\n${data.youtube.description}\n\n`;
    full += `[트랙리스트]\n${data.youtube.tracklist}\n\n`;
    full += `[해시태그]\n${data.youtube.hashtags}\n\n`;
    full += `[썸네일 프롬프트]\n${data.youtube.thumbnailPrompt}\n\n`;
    full += `[배경 이미지 프롬프트]\n${data.youtube.backgroundImagePrompt}\n`;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{t.completedModalTitle}</h2>
                <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-700">
                  {data.tracks.length}곡 완성
                </span>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-200/80 text-slate-700">
                  {data.modelUsed}
                </span>
              </div>
              <p className="text-xs text-slate-600 font-medium flex flex-wrap items-center gap-2">
                <span>선택 테마: <strong className="text-blue-900">{data.themeName}</strong></span>
                {data.lyricConcept && (
                  <span className="text-[11px] bg-blue-100/80 text-blue-900 font-semibold px-2 py-0.5 rounded-md border border-blue-200">
                    가사 컨셉: {data.lyricConcept}
                  </span>
                )}
                {data.modelUsed.includes('시뮬레이션') && (
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                    로컬 시뮬레이션 모드
                  </span>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownloadTxt}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 text-xs font-semibold border border-slate-200 shadow-xs cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-blue-600" />
              <span>{t.downloadTxt}</span>
            </button>
            <button
              onClick={() => handleCopy(generateFullText(), 'copy_all')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
            >
              {copiedKey === 'copy_all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedKey === 'copy_all' ? t.copied : t.copyAll}</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50/50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'tracks'
                ? 'border-blue-600 text-blue-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Music2 className="w-4 h-4 text-blue-500" />
            <span>{t.tracksTab} ({data.tracks.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('youtube')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'youtube'
                ? 'border-rose-600 text-rose-600 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Youtube className="w-4 h-4 text-rose-500" />
            <span>{t.youtubeTab}</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`flex items-center gap-2 py-3 px-4 text-xs font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'all'
                ? 'border-slate-800 text-slate-800 bg-white rounded-t-lg shadow-2xs'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{t.allInOneTab}</span>
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: TRACKS */}
          {activeTab === 'tracks' && (
            <div className="space-y-6">
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
                    <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span className="w-7 h-7 rounded-lg bg-blue-600 text-white font-black text-xs flex items-center justify-center">
                          {track.trackNumber}
                        </span>
                        <h3 className="font-extrabold text-slate-800 text-sm">
                          Track {track.trackNumber}
                        </h3>
                        {track.mood && (
                          <span className="text-[11px] text-slate-500 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                            {track.mood}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => handleCopy(trackFullText, `track_all_${track.trackNumber}`)}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg border border-slate-200 cursor-pointer shadow-2xs"
                      >
                        {copiedKey === `track_all_${track.trackNumber}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5 text-slate-400" />
                        )}
                        <span>
                          {copiedKey === `track_all_${track.trackNumber}` ? '트랙 전체 복사됨!' : '트랙 전체 복사'}
                        </span>
                      </button>
                    </div>

                    <div className="p-5 space-y-4 text-xs">
                      {/* Meta Info (if present in SOP) */}
                      {track.metaInfo && (
                        <div className="p-3.5 bg-indigo-50/70 rounded-xl border border-indigo-200/80 flex flex-wrap items-center gap-2">
                          <span className="font-extrabold text-indigo-950 text-xs mr-1">Meta Info:</span>
                          {track.metaInfo.vocal && (
                            <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              🎙️ {track.metaInfo.vocal}
                            </span>
                          )}
                          {track.metaInfo.genre && (
                            <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              🎵 {track.metaInfo.genre}
                            </span>
                          )}
                          {track.metaInfo.bpm && (
                            <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              ⏱️ {track.metaInfo.bpm}
                            </span>
                          )}
                          {track.metaInfo.targetLength && (
                            <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              ⏳ {track.metaInfo.targetLength}
                            </span>
                          )}
                          {track.metaInfo.mood && (
                            <span className="bg-white px-2.5 py-1 rounded-md text-[11px] font-semibold text-indigo-700 border border-indigo-100 shadow-2xs">
                              ✨ {track.metaInfo.mood}
                            </span>
                          )}
                        </div>
                      )}
                      {/* 1. 곡 제목 (Song Title) */}
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            곡 제목 (Song Title)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(track.title, `title_${track.trackNumber}`)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                              copiedKey === `title_${track.trackNumber}`
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            {copiedKey === `title_${track.trackNumber}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>곡 제목 복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>곡 제목 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-bold text-slate-900 text-sm sm:text-base bg-white p-3 rounded-lg border border-slate-200 select-all">
                          {track.title}
                        </div>
                      </div>

                      {/* 2. 스타일 프롬프트 (Style Prompt for Suno/Udio) */}
                      <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-200/80">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-blue-950 tracking-tight text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            스타일 프롬프트 (Style Prompt - Suno / Udio)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(track.stylePrompt, `style_${track.trackNumber}`)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                              copiedKey === `style_${track.trackNumber}`
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            {copiedKey === `style_${track.trackNumber}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>프롬프트 복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>스타일 프롬프트 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono text-slate-800 bg-white p-3 rounded-lg border border-blue-100 text-xs leading-relaxed select-all">
                          {track.stylePrompt}
                        </div>
                      </div>

                      {/* 3. 가사 (Full Lyrics) */}
                      <div className="p-4 bg-slate-50/80 rounded-xl border border-slate-200">
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className="font-extrabold text-slate-800 tracking-tight text-xs flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            가사 (Full Lyrics)
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(track.fullLyrics, `lyrics_${track.trackNumber}`)}
                            className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs border ${
                              copiedKey === `lyrics_${track.trackNumber}`
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                : 'bg-white hover:bg-blue-50 text-blue-600 border-blue-200 hover:border-blue-300'
                            }`}
                          >
                            {copiedKey === `lyrics_${track.trackNumber}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-600" />
                                <span>가사 복사완료!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span>가사 복사</span>
                              </>
                            )}
                          </button>
                        </div>
                        <div className="font-mono whitespace-pre-wrap bg-white p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed max-h-64 overflow-y-auto select-all">
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
          {activeTab === 'youtube' && (
            <div className="space-y-4">
              <div className="p-4 bg-rose-50/60 border border-rose-200/70 rounded-2xl flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-rose-900 text-sm flex items-center gap-2">
                    <Youtube className="w-5 h-5 text-rose-600" />
                    유튜브 플레이리스트 업로드 원스톱 패키지
                  </h3>
                  <p className="text-xs text-rose-700">
                    조회수를 이끄는 제목, 상세 설명문, 타임스탬프 트랙리스트, SEO 해시태그 및 AI 이미지 생성 프롬프트
                  </p>
                </div>
                <button
                  onClick={() => {
                    const pkgText = `[영상 제목]\n${data.youtube.title}\n\n[영상 설명]\n${data.youtube.description}\n\n[트랙리스트]\n${data.youtube.tracklist}\n\n[해시태그]\n${data.youtube.hashtags}\n\n[썸네일 프롬프트]\n${data.youtube.thumbnailPrompt}\n\n[배경 이미지 프롬프트]\n${data.youtube.backgroundImagePrompt}`;
                    handleCopy(pkgText, 'youtube_all');
                  }}
                  className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedKey === 'youtube_all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedKey === 'youtube_all' ? '패키지 전체 복사됨' : '유튜브 패키지 일괄 복사'}</span>
                </button>
              </div>

              {/* 1. Video Title */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    영상 제목 (YouTube Title)
                  </span>
                  <button
                    onClick={() => handleCopy(data.youtube.title, 'yt_title')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'yt_title' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_title' ? '복사됨' : '복사'}</span>
                  </button>
                </div>
                <div className="font-bold text-slate-900 text-sm sm:text-base bg-slate-50 p-3 rounded-lg border border-slate-100 select-all">
                  {data.youtube.title}
                </div>
              </div>

              {/* 2. Video Description */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    영상 설명 (Description)
                  </span>
                  <button
                    onClick={() => handleCopy(data.youtube.description, 'yt_desc')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'yt_desc' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_desc' ? '설명 복사됨' : '설명 복사'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line leading-relaxed max-h-52 overflow-y-auto">
                  {data.youtube.description}
                </div>
              </div>

              {/* 3. Tracklist */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    트랙리스트 (Tracklist with Timestamps)
                  </span>
                  <button
                    onClick={() => handleCopy(data.youtube.tracklist, 'yt_tracklist')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'yt_tracklist' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_tracklist' ? '복사됨' : '복사'}</span>
                  </button>
                </div>
                <div className="font-mono text-xs text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-100 whitespace-pre-line">
                  {data.youtube.tracklist}
                </div>
              </div>

              {/* 4. Hashtags */}
              <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-500"></span>
                    해시태그 (Hashtags)
                  </span>
                  <button
                    onClick={() => handleCopy(data.youtube.hashtags, 'yt_hashtags')}
                    className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                  >
                    {copiedKey === 'yt_hashtags' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'yt_hashtags' ? '복사됨' : '복사'}</span>
                  </button>
                </div>
                <div className="font-semibold text-blue-700 text-xs bg-slate-50 p-3 rounded-lg border border-slate-100">
                  {data.youtube.hashtags}
                </div>
              </div>

              {/* 5. Thumbnail Prompt & 6. Background Image Prompt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                      썸네일 프롬프트 (Thumbnail Prompt)
                    </span>
                    <button
                      onClick={() => handleCopy(data.youtube.thumbnailPrompt, 'yt_thumb')}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedKey === 'yt_thumb' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'yt_thumb' ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed select-all">
                    {data.youtube.thumbnailPrompt}
                  </div>
                </div>

                <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
                      배경 이미지 프롬프트 (16:9 Loop Visual)
                    </span>
                    <button
                      onClick={() => handleCopy(data.youtube.backgroundImagePrompt, 'yt_bg')}
                      className="text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1 font-semibold cursor-pointer"
                    >
                      {copiedKey === 'yt_bg' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'yt_bg' ? '복사됨' : '복사'}</span>
                    </button>
                  </div>
                  <div className="font-mono text-[11px] text-slate-700 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed select-all">
                    {data.youtube.backgroundImagePrompt}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ALL IN ONE */}
          {activeTab === 'all' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-semibold">
                  원클릭 복사 또는 텍스트 파일 저장에 유용한 통합 형식입니다.
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownloadTxt}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-blue-600" />
                    <span>TXT 파일 저장</span>
                  </button>
                  <button
                    onClick={() => handleCopy(generateFullText(), 'raw_all')}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    {copiedKey === 'raw_all' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === 'raw_all' ? '전체 복사됨!' : '전체 텍스트 복사'}</span>
                  </button>
                </div>
              </div>
              <textarea
                readOnly
                value={generateFullText()}
                rows={20}
                className="w-full p-4 font-mono text-xs leading-relaxed bg-slate-900 text-slate-100 rounded-xl border border-slate-800 focus:outline-none select-all"
              />
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1 text-emerald-600 font-medium">
            <CheckCircle2 className="w-4 h-4" />
            <span>생성된 프롬프트와 가사는 Suno, Udio 및 유튜브에 즉시 사용 가능합니다.</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors cursor-pointer"
          >
            확인 및 창 닫기
          </button>
        </div>
      </div>
    </div>
  );
};
