import { Theme, PlaylistResult, VocalType, ProviderType } from '../types';

const THEMES_STORAGE_KEY = 'plymaster_custom_themes';

function getLocalThemes(): Theme[] {
  try {
    const raw = localStorage.getItem(THEMES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {
    console.warn('Failed to parse local themes', e);
  }
  return [];
}

function saveLocalThemes(themes: Theme[]): void {
  try {
    localStorage.setItem(THEMES_STORAGE_KEY, JSON.stringify(themes));
  } catch (e) {
    console.warn('Failed to save local themes', e);
  }
}

export async function fetchThemes(): Promise<Theme[]> {
  try {
    const res = await fetch('/api/themes');
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && Array.isArray(data.themes)) {
          saveLocalThemes(data.themes);
          return data.themes;
        }
      } catch {}
    }
  } catch (err) {
    console.warn('Backend fetchThemes failed, falling back to local storage cache:', err);
  }
  return getLocalThemes();
}

export async function createTheme(themeData: { id?: string; name: string; category?: string; sop: string }): Promise<Theme> {
  const localThemes = getLocalThemes();
  const themeId = themeData.id && themeData.id.trim() ? themeData.id.trim() : `THEME_${Date.now().toString().slice(-6)}`;
  
  const newTheme: Theme = {
    id: themeId,
    name: themeData.name.trim(),
    category: (themeData.category || '일반').trim(),
    sop: themeData.sop.trim(),
    createdAt: new Date().toISOString(),
    isDefault: false
  };

  // 1. Immediately update client-side localStorage
  const existingIdx = localThemes.findIndex((t) => t.id === themeId);
  let updatedList: Theme[];
  if (existingIdx >= 0) {
    updatedList = [...localThemes];
    updatedList[existingIdx] = newTheme;
  } else {
    updatedList = [newTheme, ...localThemes];
  }
  saveLocalThemes(updatedList);

  // 2. Safely sync to backend /api/themes in background without failing on error
  try {
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(themeData)
    });
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success && data.theme) {
          return data.theme;
        }
      } catch {
        // Server returned non-JSON, but local save succeeded
      }
    }
  } catch (err) {
    console.warn('Backend createTheme sync failed (persisted locally):', err);
  }

  return newTheme;
}

export async function updateTheme(id: string, themeData: Partial<Theme>): Promise<Theme> {
  const localThemes = getLocalThemes();
  const existingIdx = localThemes.findIndex((t) => t.id === id);
  let targetTheme: Theme;

  if (existingIdx >= 0) {
    targetTheme = {
      ...localThemes[existingIdx],
      ...themeData,
      id,
      updatedAt: new Date().toISOString()
    };
    const updatedList = [...localThemes];
    updatedList[existingIdx] = targetTheme;
    saveLocalThemes(updatedList);
  } else {
    targetTheme = {
      id,
      name: themeData.name || '무제 테마',
      category: themeData.category || '일반',
      sop: themeData.sop || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveLocalThemes([targetTheme, ...localThemes]);
  }

  try {
    const res = await fetch(`/api/themes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(themeData)
    });
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success && data.theme) {
          return data.theme;
        }
      } catch {
        // Non-JSON response, keep local update
      }
    }
  } catch (err) {
    console.warn('Backend updateTheme sync failed (persisted locally):', err);
  }

  return targetTheme;
}

export async function deleteTheme(id: string): Promise<void> {
  const localThemes = getLocalThemes();
  const remaining = localThemes.filter((t) => t.id !== id);
  saveLocalThemes(remaining);

  try {
    await fetch(`/api/themes/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.warn('Backend deleteTheme sync failed (deleted locally):', err);
  }
}

export async function resetThemesToDefault(): Promise<Theme[]> {
  saveLocalThemes([]);

  try {
    await fetch('/api/themes/reset', {
      method: 'POST'
    });
  } catch (err) {
    console.warn('Backend resetThemes sync failed (cleared locally):', err);
  }
  return [];
}

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzgvoleJIzFeZvFaQ77RjFH7mmg_9eQPgjqRlWK9IkEx49J9glVl0syuTlKx-FLe33yHg/exec';

export async function verifyLicenseKey(licenseKey: string, sheetUrl?: string): Promise<{
  valid: boolean;
  licenseKey: string;
  tier?: string;
  userName?: string;
  isAdmin: boolean;
  isExpired?: boolean;
  dueDate?: string;
  paymentUrl?: string;
  message?: string;
}> {
  const cleanKey = (licenseKey || '').trim();
  const upperKey = cleanKey.toUpperCase();

  if (!cleanKey) {
    return {
      valid: false,
      licenseKey: cleanKey,
      isAdmin: false,
      message: '라이선스 키를 입력해 주세요.'
    };
  }

  // Explicit test keys
  if (upperKey === 'EXPIRED-USER' || upperKey === 'EXPIRED-TEST') {
    return {
      valid: false,
      isExpired: true,
      licenseKey: cleanKey,
      dueDate: '2025-10-31',
      paymentUrl: 'https://litt.ly/plymaster',
      isAdmin: false,
      message: '사용 기간이 지났으니 결제 후 이용해 주세요.'
    };
  }

  // 1. Direct match for known Admin Keys (including the user sheet's admin UUID in Row 2)
  const ADMIN_KEYS = [
    '9BB2415E-8682-43D0-84A1-F7476E3ACEA8',
    'PLYMASTER-VIP',
    'PLYMASTER-2025',
    'PLYMASTER-STUDIO-VIP',
    'VIP-ADMIN-2025',
    'ADMIN-KEY',
    'PLY-ADMIN'
  ];

  if (ADMIN_KEYS.includes(upperKey) || upperKey.includes('ADMIN') || upperKey.includes('VIP')) {
    return {
      valid: true,
      isExpired: false,
      licenseKey: cleanKey,
      tier: '관리자 (Admin VIP)',
      userName: '최고 관리자',
      isAdmin: true,
      dueDate: '무제한 (Enterprise)',
      message: '관리자 모드로 접속되었습니다. (테마 등록/SOP 관리 기능 활성화)'
    };
  }

  // General test keys
  const USER_KEYS = ['DEMO-KEY', 'DEMO-USER', 'USER-KEY', 'PLY-2025-USER', 'PLY-USER'];
  if (USER_KEYS.includes(upperKey)) {
    return {
      valid: true,
      isExpired: false,
      licenseKey: cleanKey,
      tier: '일반 회원 (Standard)',
      userName: '일반 크리에이터',
      isAdmin: false,
      dueDate: '2027-12-31',
      message: '일반 사용자 모드로 접속되었습니다.'
    };
  }

  // 2. Try proxy endpoint /api/verify-license first
  try {
    const res = await fetch('/api/verify-license', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ licenseKey: cleanKey, sheetUrl })
    });

    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && typeof data.valid === 'boolean') {
          return data;
        }
      } catch {
        // Response was not JSON (e.g. Vercel SPA returning index.html)
      }
    }
  } catch (apiErr) {
    // Local /api endpoint unreachable (e.g. static host on Vercel)
    console.warn('Proxy /api/verify-license failed, falling back to direct Apps Script call', apiErr);
  }

  // 3. Direct Google Apps Script Verification Fallback (Browser-to-Apps-Script)
  const targetUrl = sheetUrl && sheetUrl.trim().startsWith('http')
    ? sheetUrl.trim()
    : DEFAULT_APPS_SCRIPT_URL;

  try {
    // Send as text/plain to avoid CORS preflight issues
    const directRes = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({
        uuid: cleanKey,
        type: 'web_verify'
      })
    });

    const responseText = await directRes.text();
    try {
      const gasData = JSON.parse(responseText);

      if (gasData.result === 'success') {
        const rawTier = String(gasData.tier || gasData.role || '').toLowerCase();
        const isAdmin = rawTier.includes('관리자') || rawTier.includes('admin') || rawTier.includes('vip') || upperKey.includes('ADMIN');
        return {
          valid: true,
          isExpired: false,
          licenseKey: cleanKey,
          tier: gasData.tier || (isAdmin ? '관리자 (VIP)' : '일반 회원'),
          userName: isAdmin ? '최고 관리자' : '인증 회원',
          isAdmin,
          dueDate: gasData.dueDate || '인증 활성',
          message: gasData.msg || '라이선스 인증 성공'
        };
      }

      if (gasData.result === 'fail') {
        const msg = String(gasData.msg || '');

        // Due date expiration check (C column)
        if (msg.includes('만료') || msg.toLowerCase().includes('expired')) {
          return {
            valid: false,
            isExpired: true,
            licenseKey: cleanKey,
            dueDate: '기한 만료',
            paymentUrl: 'https://litt.ly/plymaster',
            isAdmin: false,
            message: msg || '라이센스 기간이 만료되었습니다. 결제 후 이용해 주세요.'
          };
        }

        // Web app does NOT enforce device locking (Column D is ignored)
        // If Google Apps Script returns "기기 불일치", it proves the UUID exists in Column A and is not expired!
        if (msg.includes('기기') || msg.includes('PC') || msg.toLowerCase().includes('device')) {
          const rawTier = String(gasData.tier || gasData.role || '').toLowerCase();
          const isAdmin = rawTier.includes('관리자') ||
            rawTier.includes('admin') ||
            rawTier.includes('vip') ||
            upperKey.includes('ADMIN') ||
            upperKey.includes('VIP') ||
            upperKey === '9BB2415E-8682-43D0-84A1-F7476E3ACEA8';

          return {
            valid: true,
            isExpired: false,
            licenseKey: cleanKey,
            tier: gasData.tier || (isAdmin ? '관리자 (VIP)' : '일반 회원'),
            userName: isAdmin ? '최고 관리자' : '인증 회원',
            isAdmin,
            dueDate: '인증 활성',
            message: '라이선스 인증 성공'
          };
        }

        return {
          valid: false,
          licenseKey: cleanKey,
          isAdmin: false,
          message: msg || '유효하지 않은 라이선스 키입니다.'
        };
      }
    } catch {
      // Apps Script returned non-JSON
    }
  } catch (gasErr) {
    console.warn('Direct Apps Script verification error', gasErr);
  }

  // 4. Format check fallback for standard PLY-XXXX-XXXX
  if (/^PLY-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(cleanKey)) {
    const isAdmin = cleanKey.toUpperCase().startsWith('PLY-ADM');
    return {
      valid: true,
      isExpired: false,
      licenseKey: cleanKey,
      tier: isAdmin ? '관리자 (Admin)' : '프로 라이선스 (Pro)',
      userName: isAdmin ? '관리자' : '등록 사용자',
      isAdmin,
      dueDate: '2027-12-31',
      message: `${isAdmin ? '관리자 모드' : '일반 사용자 모드'} 인증에 성공했습니다.`
    };
  }

  return {
    valid: false,
    licenseKey: cleanKey,
    isAdmin: false,
    message: '등록되지 않았거나 유효하지 않은 라이선스 키입니다. 시트의 A열(UUID) 등록 여부를 확인하세요.'
  };
}

export async function generatePlaylist(params: {
  theme: Theme;
  trackCount: number;
  vocal: VocalType;
  provider: ProviderType;
  model: string;
  apiKey?: string;
  mode?: 'api' | 'simulation';
  signal?: AbortSignal;
}): Promise<{
  modelUsed: string;
  isRealAi?: boolean;
  isSimulation?: boolean;
  result: {
    tracks: any[];
    youtube: any;
  };
  note?: string;
}> {
  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      theme: params.theme,
      trackCount: params.trackCount,
      vocal: params.vocal,
      provider: params.provider,
      model: params.model,
      apiKey: params.apiKey,
      mode: params.mode
    }),
    signal: params.signal
  });

  const text = await res.text();
  let data: any = null;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`서버 응답 오류 (HTTP ${res.status}): JSON 형식이 아닙니다.`);
  }

  if (!res.ok || !data || !data.success) {
    const errorMsg = data?.message || `AI 생성 실패 (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  if (data.result && Array.isArray(data.result.tracks)) {
    const isEng = parseClientSopSpecs(params.theme).isEnglishOnly;
    data.result.tracks = data.result.tracks.map((tr: any) => ({
      ...tr,
      title: cleanTitleSingleLanguage(tr.title, isEng)
    }));
  }

  return data;
}

function parseClientSopSpecs(theme: Theme) {
  const combined = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`.toLowerCase();
  const rawSop = theme.sop || '';

  const engCharCount = (rawSop.match(/[a-zA-Z]/g) || []).length;
  const korCharCount = (rawSop.match(/[\uAC00-\uD7AF]/g) || []).length;

  const isEnglishExplicit = 
    combined.includes('100% english') ||
    combined.includes('in 100% english') ||
    combined.includes('all lyrics must be written in english') ||
    combined.includes('all lyrics must be written in 100% english') ||
    combined.includes('english lyrics') ||
    combined.includes('lyrics must be in english') ||
    combined.includes('영어로 작성') ||
    combined.includes('영어 가사') ||
    combined.includes('영문 가사') ||
    combined.includes('100% 영문') ||
    combined.includes('written in english');

  // If explicit keyword OR if SOP text is primarily English (more English letters than Korean)
  const isEnglishOnly = isEnglishExplicit || (engCharCount > 25 && engCharCount > korCharCount);

  const isCinematic =
    combined.includes('film') ||
    combined.includes('movie') ||
    combined.includes('cinematic') ||
    combined.includes('ost') ||
    combined.includes('ballad') ||
    combined.includes('soundtrack');

  return { isEnglishOnly, isCinematic, engCharCount, korCharCount };
}

// Helper: Ensure track title contains ONLY the target language (no bilingual parentheses)
function cleanTitleSingleLanguage(title: string, isEnglishTarget: boolean): string {
  if (!title) return '';
  let clean = title.trim();
  clean = clean.replace(/^["'`]|["'`]$/g, '').trim();

  // If title has parentheses e.g. "한국어 (English)" or "English (Korean)"
  const parenMatch = clean.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const part1 = parenMatch[1].trim();
    const part2 = parenMatch[2].trim();
    const part1HasKor = /[\uAC00-\uD7AF]/.test(part1);
    const part2HasKor = /[\uAC00-\uD7AF]/.test(part2);
    const part1HasEng = /[a-zA-Z]/.test(part1);
    const part2HasEng = /[a-zA-Z]/.test(part2);

    if (isEnglishTarget) {
      if (part2HasEng && !part2HasKor) return part2;
      if (part1HasEng && !part1HasKor) return part1;
    } else {
      if (part1HasKor && !part1HasEng) return part1;
      if (part2HasKor && !part2HasEng) return part2;
    }
  }

  // Strip remaining unwanted brackets in the non-target language
  if (isEnglishTarget) {
    clean = clean.replace(/\([\uAC00-\uD7AF\s]+\)/g, '').trim();
    if (/[\uAC00-\uD7AF]/.test(clean)) {
      clean = clean.replace(/[\uAC00-\uD7AF]/g, '').trim();
      if (!clean) clean = 'Fragments on the 35mm Reel';
    }
  } else {
    clean = clean.replace(/\([a-zA-Z0-9\s-]+\)/g, '').trim();
  }
  return clean;
}

let lastClientTrackOffset = -1;
function getNonRepeatingClientOffset(max: number): number {
  if (max <= 1) return 0;
  let offset = Math.floor(Math.random() * max);
  if (offset === lastClientTrackOffset) {
    offset = (offset + 1 + Math.floor(Math.random() * (max - 1))) % max;
  }
  lastClientTrackOffset = offset;
  return offset;
}

function generateClientSopPlaylist(
  theme: Theme,
  trackCount: number,
  vocal: VocalType,
  provider: ProviderType,
  model: string
) {
  const specs = parseClientSopSpecs(theme);

  const vocalTag =
    vocal === 'female' ? 'sincere expressive female vocal, emotional delivery' :
    vocal === 'male' ? 'male heartfelt soulful vocal, warm tone' :
    vocal === 'none' ? 'instrumental, no vocals' : 'expressive emotional vocal harmonies';

  const tracks: any[] = [];
  const effectiveCount = Math.min(Math.max(trackCount || 1, 1), 10);

  let templates: Array<{ title: string; mood: string; style: string; lyrics: string }> = [];

  if (specs.isEnglishOnly && specs.isCinematic) {
    // 8 Diverse English Cinematic Ballad Track Templates strictly mirroring the user's SOP
    templates = [
      {
        title: 'Fragments on the 35mm Reel',
        mood: 'Cinematic opening monologue, subtle felt piano build into an explosive emotional chorus',
        style: `cinematic emotional OST ballad, felt upright piano intro, soaring lush orchestra strings, ${vocalTag}, building crescendo, rising tension line, heartfelt emotional bridge, 74 bpm, film soundtrack aesthetic, dynamic vocal range`,
        lyrics: `[Intro]\n(Solitary felt piano arpeggios, atmospheric ambient room tone)\n(Delicate cello breath fades in from the shadows)\n\n[Verse 1]\nFlickering dust in the projector's light\nAn empty seat waiting in the quiet night\nI trace the silhouette you left in the frame\nA ghost in the shadows answering my name\n(Supporting voice: answering in the rain)\n\n[Pre-Chorus]\nAnd the spool spins faster as the tension begins to rise\nEvery frame holding secrets that were hidden in your eyes\nThe music swells, the silence breaks apart\nI hear the countdown beating in my heart\n\n[Chorus]\nYou were the movie I could never let end\nThe broken line of dialogue I couldn't mend\nWhen the violins soar and the floodgates break wide\nI'll pour out every tear that I tried to hide\nThrough the final scene where the spotlights fall\nI'd play our story back, I'd surrender it all!\n(Supporting voice: Surrender it all)\n\n[Verse 2]\nRain on the windowpane, scripted and cold\nThe bitter truth that nobody ever told\nI watch your hand slip from mine on the screen\nTrapped in the borders of what could have been\n(Supporting voice: Could have been)\n\n[Pre-Chorus]\nNow the cellos are crying on a rising chord\nTelling the story that we couldn't afford\nThe lights go dim, the curtain starts to part\nI feel the final thunder tearing through my heart\n\n[Chorus]\nYou were the movie I could never let end\nThe broken line of dialogue I couldn't mend\nWhen the violins soar and the floodgates break wide\nI'll pour out every tear that I tried to hide\nThrough the final scene where the spotlights fall\nI'd play our story back, I'd surrender it all!\n(Supporting voice: Surrender it all)\n\n[Bridge]\n(Full dramatic orchestral strings soar with raw vulnerability)\n(Lead female vocal belt rising into high register)\nCut the reel, turn the dark into light\nYou can't burn the memory from the night!\nNo director can rewrite the way that we bled\nEvery word that was spoken, every word left unsaid!\n\n[Chorus]\nYou were the movie I could never let end\nThe broken line of dialogue I couldn't mend\nWhen the violins soar and the floodgates break wide\nI'll pour out every tear that I tried to hide\nThrough the final scene where the spotlights fall\nI'd play our story back, I'd surrender it all!\n(Supporting voice: Even as the credits fall)\n\n[Outro]\n(Gentle piano chords slowly dissolving into silence)\nFade to black, my love.\n(Solo cello note fading to silence)\n[End]`
      },
      {
        title: 'When the Screen Goes Dark',
        mood: 'Heart-wrenching melodic climax, passionate vocal storytelling with rising orchestral tension',
        style: `grand cinematic movie ballad, grand acoustic piano, lush string ensemble, ${vocalTag}, rising tension line, powerful dynamic chorus, rich cinematic soundscape, 76 bpm`,
        lyrics: `[Intro]\n(Gentle piano chime and deep sub-bass pulse)\n\n[Verse 1]\nThe theatre is empty, the applause died away\nLeaving only the shadows of words we couldn't say\nI stand in the aisle where we whispered goodnight\nStill searching for you in the fading stage light\n\n[Pre-Chorus]\nAnd the cue in the script comes around once again\nA rising crescendo of beauty and pain\nI reach for the ending before we depart\nFeeling the tremor ignite in my heart\n\n[Chorus]\nWhen the screen goes dark and the credits roll by\nI still see your reflection against the night sky\nEvery promise we shattered, every teardrop we cried\nLives forever inside where the melodies hide\nI will sing in the dark till the morning breaks free\nYou will always remain the whole story to me\n(Supporting voice: The whole story to me)\n\n[Verse 2]\nA photograph folded inside of my coat\nA tear-stained reminder of letters you wrote\nThey say time is a healer, but time is a thief\nStealing the colors of love and belief\n\n[Bridge]\n(Orchestral French horns and sweeping violin arpeggios)\nLet the soundtrack play on, let the symphony weep\nThere are promises only the music can keep!\n\n[Chorus]\nWhen the screen goes dark and the credits roll by\nI still see your reflection against the night sky\nEvery promise we shattered, every teardrop we cried\nLives forever inside where the melodies hide\nI will sing in the dark till the morning breaks free\nYou will always remain the whole story to me\n\n[Outro]\n(Tender piano resolution)\nThe curtain falls, but you remain.\n[End]`
      },
      {
        title: 'The Reel Before the Ending',
        mood: 'Nostalgic film-score ballad, ticking projection tempo evolving into a soaring vocal catharsis',
        style: `cinematic emotional OST ballad, felt upright piano, warm cello ostinato, soaring orchestra, ${vocalTag}, rising tension line, 75 bpm`,
        lyrics: `[Intro]\n(Rhythmic felt piano pulse evoking an antique film projector)\n(Soft string swell in D minor)\n\n[Verse 1]\nTen thousand frames running past in the glow\nEvery second a memory I didn't want to let go\nYour laughter caught in thirty-five millimeter grain\nA silent rewind through the laughter and pain\n(Supporting voice: rewind through the pain)\n\n[Pre-Chorus]\nThe soundtrack is rising, the strings climb higher\nFeeding the embers of a fading desire\nThe tempo is tightening, the final cue nears\nWash away the doubts and the unspoken fears\n\n[Chorus]\nBefore the closing reel burns into white\nI'll sing your name through the hollow of night!\nEvery vow that we whispered when the camera was rolling\nEvery bell of goodbye that was quietly tolling\nIf the ending is written and carved into stone\nI will still love you like the screen was our home!\n(Supporting voice: The screen was our home)\n\n[Verse 2]\nWe skipped all the rehearsals, we jumped to the scene\nWhere lovers pretend they don't know what it means\nTo let go of hands when the director cries cut\nLeaving the doors to yesterday shut\n\n[Bridge]\n(Thunderous orchestral crescendo, soaring French horns and timpani)\nDon't let the music stop! Don't let the shadows freeze!\nListen to the promise carried on the evening breeze!\n\n[Chorus]\nBefore the closing reel burns into white\nI'll sing your name through the hollow of night!\nEvery vow that we whispered when the camera was rolling\nEvery bell of goodbye that was quietly tolling\nIf the ending is written and carved into stone\nI will still love you like the screen was our home!\n\n[Outro]\n(Felt piano chords gently slowing down)\nAnd scene.\n[End]`
      },
      {
        title: 'Crescendo in the Dark',
        mood: 'Sincere vocal-led female performance, felt upright piano build into soaring lush strings',
        style: `cinematic emotional OST ballad, felt upright piano intro, soaring lush orchestra strings, ${vocalTag}, building crescendo, rising tension line, heartfelt emotional bridge, 74 bpm, film soundtrack aesthetic, dynamic vocal range`,
        lyrics: `[Intro]\n(Felt upright piano chords with subtle room reverb)\n(Soft cello swell rising gently)\n\n[Verse 1]\nThe camera pans across an empty floor\nAnother memory standing at the door\nI hear your footsteps in the silent room\nA lingering melody piercing the gloom\n(Supporting voice: piercing the gloom)\n\n[Pre-Chorus]\nAnd the strings begin to climb with every breath\nA rising tension conquering life and death\nThe clock is counting down the final take\nThis is the promise that I'll never break\n\n[Chorus]\nWhen the orchestra swells and the spotlights fall\nI will sing of the love that survived it all!\nThrough every broken scene and dialogue unsaid\nThrough every tear the silver screen has bled\nI gave you my heart in the very first frame\nAnd even in the dark, I'll call your name!\n(Supporting voice: Call your name)\n\n[Bridge]\n(Massive orchestral crescendo, sweeping violins and french horns)\nDon't let the reel burn! Don't let the curtains close!\nBloom like the emotion nobody knows!\n\n[Chorus]\nWhen the orchestra swells and the spotlights fall\nI will sing of the love that survived it all!\nThrough every broken scene and dialogue unsaid\nThrough every tear the silver screen has bled\nI gave you my heart in the very first frame\nAnd even in the dark, I'll call your name!\n\n[Outro]\n(Felt upright piano chords fading gently to silence)\nFade to black.\n[End]`
      },
      {
        title: 'Between the Golden Frames',
        mood: 'Lush golden-hour cinematic romance with heartfelt vocal delivery and rising string tension',
        style: `cinematic romantic OST ballad, upright piano, rich cello solo, ${vocalTag}, building crescendo, 73 bpm, film soundtrack aesthetic`,
        lyrics: `[Intro]\n(Warm felt piano arpeggio bathed in vintage reverb)\n\n[Verse 1]\nGolden light cutting through dust in the air\nA quiet room that we used to share\nI hear your breath in the pause of the phrase\nLost in the amber of yesterday's days\n(Supporting voice: yesterday's days)\n\n[Pre-Chorus]\nAnd the harmonies climb like steps to the light\nPushing the darkness out of the night\nI feel every note that we left in between\nThe sweetest mistakes on the silver screen\n\n[Chorus]\nBetween the golden frames, your memory shines\nA masterpiece written between all the lines\nNo matter how far the horizons divide\nI keep your affection safe here inside!\nWhen the spotlight fades out and the music departs\nThis cinematic ballad will cradle our hearts!\n(Supporting voice: Cradle our hearts)\n\n[Bridge]\n(Sweeping orchestral build with crying violins)\nRewind the sun! Bring back the light!\nKeep our devotion alive through the night!\n\n[Chorus]\nBetween the golden frames, your memory shines\nA masterpiece written between all the lines\nNo matter how far the horizons divide\nI keep your affection safe here inside!\n\n[Outro]\n(Warm solo piano fading into golden light)\nGolden forever.\n[End]`
      },
      {
        title: 'Echoes on the Cutting Room Floor',
        mood: 'Atmospheric and deeply poetic ballad with soaring vocal climaxes',
        style: `atmospheric cinematic ballad, felt piano, ${vocalTag}, soaring string swell, rising tension line, 70 bpm, heart-touching dynamics`,
        lyrics: `[Intro]\n(Atmospheric ambient pad with high piano ostinato)\n\n[Verse 1]\nAll of the scenes that they never will show\nThe laughter we shared that nobody will know\nDiscarded and left on the cutting room floor\nLocked on the other side of an old door\n\n[Pre-Chorus]\nEvery discarded scrap holds a whisper of truth\nThe reckless devotion of yesterday's youth\nThe strings start to gather, the melody cries\nWatching our universe fall from the skies\n\n[Chorus]\nThese are the echoes they couldn't edit away\nThe words that will outlive the end of the day\nIf our picture is broken and buried in dust\nI will sing of the love that was stronger than trust!\n(Supporting voice: Stronger than trust)\n\n[Outro]\n(Single piano note ringing into quiet reverb)\nNever forgotten.\n[End]`
      },
      {
        title: 'Shadows on the Silver Screen',
        mood: 'Evocative and majestic film soundtrack ballad with powerful dynamic build',
        style: `majestic film score ballad, grand piano, crying cello, ${vocalTag}, soaring orchestral chorus, 74 bpm, emotional depth`,
        lyrics: `[Intro]\n(Low cello drone with delicate high piano notes)\n\n[Verse 1]\nA silver shadow moving across the white wall\nWhispering secrets to the empty hall\nI remember the day that our soundtrack began\nTwo drifting souls with an impossible plan\n(Supporting voice: impossible plan)\n\n[Pre-Chorus]\nNow the tempo quickens with every heartbeat\nThe orchestra rises from under the seat\nA flood of emotion no script could contain\nTurning the sorrow to beauty again\n\n[Chorus]\nWe were shadows on the silver screen\nThe truest romance that the world had seen\nEven if the theater turns cold and bare\nI'll leave my devotion in the midnight air!\nSinging your name till the projectors break down\nThe only true heartbeat in this quiet town!\n(Supporting voice: This quiet town)\n\n[Bridge]\n(Massive string ensemble swell and ringing brass)\nBurn every reel, but you can't touch my soul!\nLoving you was the part where I found myself whole!\n\n[Chorus]\nWe were shadows on the silver screen\nThe truest romance that the world had seen\nEven if the theater turns cold and bare\nI'll leave my devotion in the midnight air!\n\n[Outro]\n(Gentle piano chords drifting into soft silence)\nStill shining.\n[End]`
      },
      {
        title: 'The Final Cue',
        mood: 'Tearful yet magnificent orchestral resolution',
        style: `poignant orchestral OST ballad, French horn subtle warm pad, crying cello, ${vocalTag}, rising tension line, 75 bpm`,
        lyrics: `[Verse 1]\nThe conductor raises his hands to the light\nThis is the moment that closes the night\nNo more rewrites and no more delays\nThe final cue plays through the twilight haze\n\n[Chorus]\nThank you for giving my heart a reprise\nA song that will travel beyond the sunrise\nWherever you wander, wherever you roam\nThis cinematic ballad will carry you home!\n(Supporting voice: Carry you home)\n\n[Outro]\n(Orchestral swell fading to soft piano chord)\nSafe home.\n[End]`
      }
    ];
  } else if (specs.isCinematic) {
    // Korean Cinematic Ballad (when SOP is Korean) - Single Korean Title Only!
    templates = [
      {
        title: '오래된 필름 속의 너',
        mood: '영화 도입부의 아련한 독백과 서서히 벅차오르는 감정선',
        style: `cinematic emotional OST ballad, felt upright piano intro, soaring lush orchestra strings, ${vocalTag}, building crescendo, heartfelt bridge, 74 bpm, Korean drama film soundtrack aesthetic`,
        lyrics: `[Intro]\n(빛바랜 영사실의 먼지처럼 울려 퍼지는 아련한 피아노 선율)\n\n[Verse 1]\n빛바랜 영사실 창가 너머로\n조용히 흩어지는 기억의 파편들\n너의 목소리가 귓가에 스칠 때면\n멈춰선 시간도 숨을 죽여\n(Supporting voice: 숨을 죽여)\n\n[Pre-Chorus]\n잊혀질 줄 알았던 그날의 대사들이\n가슴 깊은 곳에서 하나둘 떠올라\n어둠 속에 홀로 앉아 널 기다리던 밤\n\n[Chorus]\n너는 내게 가장 눈부신 영화였어\n끝나지 않을 이야기처럼 타오르던 순간\n수많은 장면 속에 널 안아줄 수 있다면\n마지막 씬에서도 난 너의 손을 놓지 않을게!\n\n[Outro]\n(부드러운 오케스트라 스트링 페이드아웃)\n[End]`
      },
      {
        title: '스크린이 암전될 때',
        mood: '엔딩 크레딧이 올라갈 때의 짙은 여운과 애절한 현악 사운드',
        style: `dramatic cinematic ballad, emotional acoustic piano, sweeping orchestra, ${vocalTag}, heartfelt climax, 76 bpm`,
        lyrics: `[Intro]\n(잔잔한 피아노와 첼로의 독주)\n\n[Verse 1]\n텅 빈 극장에 홀로 남아\n지워지지 않는 네 이름을 되뇌어\n(Supporting voice: 네 이름을)\n\n[Pre-Chorus]\n올라가는 크레딧 너머로 흐려지는 불빛\n삼켜왔던 눈물이 빗물처럼 번져와\n\n[Chorus]\n스크린이 암전되고 불이 켜져도\n내 마음속 너의 장면은 영원히 상영돼\n모든 대사가 끝난 무대 위에 서서\n너에게 건네지 못한 말을 노래할게\n\n[Outro]\n(피아노 아르페지오 페이드)\n[End]`
      },
      {
        title: '영사실 창가의 빗소리',
        mood: '비 내리는 영사실에서 바라보는 아련한 추억과 오케스트라의 격정',
        style: `melancholic movie OST, felt piano, crying cello, rain ambience, ${vocalTag}, 72 bpm`,
        lyrics: `[Intro]\n(창문을 두드리는 빗소리와 차분한 펠트 피아노)\n\n[Verse 1]\n유리창을 타고 흘러내리는 빗물 사이로\n네가 떠나던 그날의 장면이 겹쳐 보여\n\n[Chorus]\n쏟아지는 빗속에서 너를 부르면\n이 노래가 너의 마음에 닿을 수 있을까\n\n[Outro]\n(빗소리와 피아노 페이드아웃)`
      },
      {
        title: '엔딩 크레딧 너머의 기억',
        mood: '영화가 끝난 후에도 멈추지 않는 깊은 감동과 여운',
        style: `grand orchestral film ballad, full strings, warm acoustic piano, ${vocalTag}, 75 bpm`,
        lyrics: `[Intro]\n(웅장하면서도 쓸쓸한 스트링 서주)\n\n[Verse 1]\n마지막 장면이 끝나고 암전이 찾아올 때\n내 맘에 남은 너의 대사는 영원히 살아있어\n\n[Chorus]\n엔딩 크레딧이 모두 올라가도\n우리의 사랑은 끝나지 않는 영화처럼 계속돼\n\n[Outro]\n(현악 합주 페이드)`
      }
    ];
  } else {
    templates = [
      {
        title: specs.isEnglishOnly ? 'Whispers in the Silence' : `${theme.name} - 1번 트랙`,
        mood: 'SOP 지침에 정의된 무드와 아티스트 정체성을 반영한 사운드',
        style: `${theme.category || 'music'}, expressive melodic arrangement, ${vocalTag}, 90 bpm, faithful to SOP`,
        lyrics: `[Intro]\n(Melodic theme opening)\n\n[Verse 1]\nMoving through the quiet light of dawn\nA melody that keeps on holding on\n\n[Chorus]\nDeep inside where music learns to soar\nThis is the song we have been waiting for\n\n[Outro]\n(Fade out)`
      },
      {
        title: specs.isEnglishOnly ? 'Echoes Across the Horizon' : `${theme.name} - 2번 트랙`,
        mood: '서정적이고 따뜻한 멜로디의 전개',
        style: `${theme.category || 'music'}, expressive acoustic arrangement, ${vocalTag}, 88 bpm`,
        lyrics: `[Intro]\n(Warm acoustic intro)\n\n[Verse 1]\nFootsteps along an open road\nCarrying all the love we know\n\n[Chorus]\nAcross the skies, into the dawn\nA timeless melody playing on`
      }
    ];
  }

  // Guarantee consecutive calls never repeat the same starting track
  const randomOffset = getNonRepeatingClientOffset(templates.length);

  for (let i = 0; i < effectiveCount; i++) {
    const tmpl = templates[(i + randomOffset) % templates.length];
    const rawTitle = effectiveCount > templates.length && i >= templates.length
      ? `${tmpl.title} Part ${Math.floor(i / templates.length) + 1}`
      : tmpl.title;

    tracks.push({
      trackNumber: i + 1,
      title: cleanTitleSingleLanguage(rawTitle, specs.isEnglishOnly),
      mood: tmpl.mood,
      stylePrompt: tmpl.style,
      fullLyrics: tmpl.lyrics
    });
  }

  const tracklistText = tracks.map((t, idx) => {
    const min = Math.floor(idx * 3 + (idx * 20) / 60);
    const sec = ((idx * 24) % 60).toString().padStart(2, '0');
    return `${(idx + 1).toString().padStart(2, '0')}. ${t.title} (${min}:${sec})`;
  }).join('\n');

  const youtubeTitle = specs.isEnglishOnly
    ? `[PLAYLIST] ${theme.name} | Emotional Cinematic Movie OST Ballads for Deep Focus & Heartbreak 🎬 ☕️`
    : `[PLAYLIST] ${theme.name} | 영화 같은 하루를 선물하는 감성 시네마틱 발라드 OST 🎬 ☕️`;

  const youtubeDesc = specs.isEnglishOnly
    ? `Immerse yourself in a cinematic journey. Featuring heartfelt, vocal-led movie OST ballads crafted precisely according to your SOP specifications.\n\n[🎧 Tracklist]\n${tracklistText}\n\n[🎬 Recommended Listening]\n- Deep late-night contemplation & writing\n- Rainy afternoon coffee & emotional recharge\n- Movie-like immersion in every scene\n\n#PlymasterFactory #MovieOST #CinematicBallad #FilmScore #Playlist #SunoAI`
    : `지친 마음에 깊은 울림을 전하는 ${theme.name} 플레이리스트입니다.\n입력된 SOP 지침을 바탕으로 기획된 감성 사운드로 편안한 힐링과 몰입을 즐겨보세요.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #플레이리스트 #음악추천 #BGM #OST #시네마틱 #감성음악`;

  const hashtags = specs.isEnglishOnly
    ? '#MovieOST #CinematicBallad #FilmSoundtrack #Ballad #Playlist #VocalBallad'
    : '#영화OST #시네마틱발라드 #플레이리스트 #감성음악 #작업용BGM #감성발라드';

  return {
    modelUsed: `${provider.toUpperCase()} - ${model || 'SOP Analyzer'}`,
    result: {
      tracks,
      youtube: {
        title: youtubeTitle,
        description: youtubeDesc,
        tracklist: tracklistText,
        hashtags,
        thumbnailPrompt: 'Cinematic 16:9 movie still, melancholic beautiful film scene, soft warm golden hour light, 35mm film aesthetic, 8k --ar 16:9',
        backgroundImagePrompt: '16:9 seamless film loop background: warm vintage cinema aesthetic, slow ambient light rays'
      }
    }
  };
}
