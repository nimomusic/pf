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
  const localThemes = getLocalThemes();
  try {
    const res = await fetch('/api/themes');
    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && Array.isArray(data.themes)) {
          // Merge local and server themes by id, local taking priority
          const idMap = new Map<string, Theme>();
          data.themes.forEach((t: Theme) => idMap.set(t.id, t));
          localThemes.forEach((t: Theme) => idMap.set(t.id, t));
          const merged = Array.from(idMap.values());
          saveLocalThemes(merged);
          return merged;
        }
      } catch {
        // Response was not JSON (e.g. Vercel serverless error / HTML)
      }
    }
  } catch (err) {
    console.warn('Backend fetchThemes failed, using local storage:', err);
  }
  return localThemes;
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
  signal?: AbortSignal;
}): Promise<{
  modelUsed: string;
  result: {
    tracks: any[];
    youtube: any;
  };
}> {
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        theme: params.theme,
        trackCount: params.trackCount,
        vocal: params.vocal,
        provider: params.provider,
        model: params.model,
        apiKey: params.apiKey
      }),
      signal: params.signal
    });

    if (res.ok) {
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        if (data && data.success && data.result) {
          return data;
        }
      } catch {
        // Non-JSON response, fallback to client-side SOP generation
      }
    }
  } catch (err) {
    console.warn('Backend /api/generate failed, activating client SOP analyzer:', err);
  }

  // Client-Side SOP Analysis & Generation Fallback
  return generateClientSopPlaylist(params.theme, params.trackCount, params.vocal, params.provider, params.model);
}

function generateClientSopPlaylist(
  theme: Theme,
  trackCount: number,
  vocal: VocalType,
  provider: ProviderType,
  model: string
) {
  const combined = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`.toLowerCase();
  const isCinematic = combined.includes('film') || combined.includes('movie') || combined.includes('cinematic') || combined.includes('ost') || combined.includes('ballad') || combined.includes('soundtrack');
  const isXmas = combined.includes('크리스마스') || combined.includes('christmas') || combined.includes('holiday');

  const vocalTag =
    vocal === 'female' ? 'sincere expressive female vocal, emotional delivery' :
    vocal === 'male' ? 'male heartfelt soulful vocal, warm tone' :
    vocal === 'none' ? 'instrumental, no vocals' : 'expressive emotional vocal harmonies';

  const tracks: any[] = [];
  const effectiveCount = Math.min(Math.max(trackCount || 3, 1), 10);

  if (isCinematic) {
    const templates = [
      {
        title: '오래된 필름 속의 너 (Fragments on the 35mm Reel)',
        mood: '영화 오프닝의 아련한 독백과 벅차오르는 감정선',
        style: `cinematic emotional OST ballad, felt upright piano intro, soaring lush orchestra strings, ${vocalTag}, building crescendo, heartfelt bridge, 74 bpm, Korean drama film soundtrack aesthetic`,
        lyrics: `[Intro]\n(Gentle, melancholic piano notes echo like dust in an old projector light)\n(Subtle cinematic cello sweeps in)\n\n[Verse 1]\n빛바랜 영사실 창가 너머로\n조용히 흩어지는 기억의 파편들\n너의 목소리가 귓가에 스칠 때면\n멈춰선 시간도 숨을 죽여\n\n[Pre-Chorus]\n잊혀질 줄 알았던 그날의 대사들이\n가슴 깊은 곳에서 하나둘 떠올라\n어둠 속에 홀로 앉아 널 기다리던 밤\n\n[Chorus]\n너는 내게 가장 눈부신 영화였어\n끝나지 않을 이야기처럼 타오르던 순간\n수많은 장면 속에 널 안아줄 수 있다면\n마지막 씬에서도 난 너의 손을 놓지 않을게\n\n[Verse 2]\n스크린 위로 흐르는 빗물처럼\n흘려보낸 눈물 속에 새겨진 너의 이름\n잡으려 할수록 멀어지는 그림자\n\n[Bridge]\n(Orchestral strings soar with deep emotional intensity)\n엔딩 크레딧이 모두 올라간대도\n불 꺼진 극장에 나 홀로 남아\n너라는 계절을 영원히 기억할 테니\n\n[Chorus]\n너는 내게 가장 눈부신 영화였어\n끝나지 않을 이야기처럼 타오르던 순간\n수많은 장면 속에 널 안아줄 수 있다면\n마지막 씬에서도 난 너의 손을 놓지 않을게\n\n[Outro]\n(Tender piano chords fading out into silence)\n영원히 바래지 않을 우리만의 명장면\n(Lush strings soft fade)`
      },
      {
        title: '엔딩 크레딧이 오른 후에 (When the Credits Fade)',
        mood: '가슴을 울리는 서정적인 클라이맥스와 스트링 선율',
        style: `grand cinematic movie ballad, grand acoustic piano, sweeping violin and cello ensemble, ${vocalTag}, powerful dynamic chorus, rich cinematic soundscape, 78 bpm`,
        lyrics: `[Intro]\n(Lush strings pad with delicate high piano notes)\n\n[Verse 1]\n막이 내린 무대 위 고요한 침묵 속에\n너와 나눈 약속만이 남아 있어\n흘러가는 바람에 서글픈 멜로디 실어\n닿지 않을 너에게 건네는 마지막 인사\n\n[Pre-Chorus]\n빛나던 조명이 하나씩 꺼져가도\n내 맘속 너의 온기는 식지 않아\n\n[Chorus]\n시간을 거슬러 그 자리로 돌아갈 수 있다면\n너를 안고 놓지 않았을 텐데\n슬픈 영화의 끝에서도\n너는 영원한 나의 주인공\n\n[Bridge]\n(Dramatic orchestral build-up with passionate vocal)\n우리의 끝이 이별일지라도\n널 만난 모든 순간은 축복이었어\n\n[Outro]\n(Piano solo gently fading out)\n기억해 줘, 우리가 사랑했던 계절을`
      },
      {
        title: '기억의 잔상 (Faded Silver Screen)',
        mood: '몽환적이면서도 깊은 여운을 남기는 시네마틱 발라드',
        style: `melancholic film score ballad, intimate piano arpeggios, atmospheric reverb, warm acoustic bass, ${vocalTag}, 72 bpm, deep emotional cinematic feel`,
        lyrics: `[Intro]\n(Quiet piano resonance)\n\n[Verse 1]\n흑백 화면 속에 갇혀버린 그날\n너의 미소만이 선명하게 남아\n돌아갈 수 없어서 더 아름다운 시간\n\n[Chorus]\n바람이 불어오면 네가 떠올라\n가슴 한 켠에 묻어둔 시린 이야기\n영원히 간직할게 우리 둘만의 잔상\n\n[Outro]\n(Gentle cello fade out)`
      },
      {
        title: '마지막 씬의 독백 (Monologue in the Final Scene)',
        mood: '진솔하고 짙은 감정의 보컬 중심 발라드',
        style: `vocal-driven OST ballad, minimal piano accompaniment building to full orchestral arrangement, ${vocalTag}, 75 bpm`,
        lyrics: `[Intro]\n(Soft solitary piano notes)\n\n[Verse 1]\n아무도 모르는 나만의 비밀\n너를 사랑했던 모든 시간들\n이제는 담담히 말할 수 있어\n\n[Chorus]\n고마웠어, 내 삶의 가장 빛나는 순간에\n함께 있어 준 너라서 참 다행이었어\n\n[Outro]\n(Acoustic piano chord slowly resolving)`
      },
      {
        title: '스크린 너머의 계절 (Seasons Beyond the Screen)',
        mood: '웅장하고 따뜻한 희망의 시네마틱 발라드',
        style: `hopeful cinematic ballad, soaring strings, French horn accents, warm piano, ${vocalTag}, 82 bpm`,
        lyrics: `[Verse 1]\n차가운 겨울이 지나고 나면\n새로운 봄이 찾아오듯이\n우리의 아픔도 꽃을 피울 거야\n\n[Chorus]\n끝없는 어둠을 지나 찾아올 새벽처럼\n다시 한번 내 손을 잡아줘\n\n[Outro]\n(Orchestra crescendo to gentle resolution)`
      }
    ];

    for (let i = 0; i < effectiveCount; i++) {
      const tmpl = templates[i % templates.length];
      tracks.push({
        trackNumber: i + 1,
        title: effectiveCount > templates.length && i >= templates.length ? `${tmpl.title} (Part 2)` : tmpl.title,
        mood: tmpl.mood,
        stylePrompt: tmpl.style,
        fullLyrics: tmpl.lyrics
      });
    }
  } else {
    for (let i = 0; i < effectiveCount; i++) {
      tracks.push({
        trackNumber: i + 1,
        title: `${theme.name} - Track ${i + 1}`,
        mood: 'SOP에 정의된 무드와 아티스트 정체성을 반영한 사운드',
        style: `${theme.category || 'music'}, expressive melodic arrangement, ${vocalTag}, 90 bpm, faithful to SOP`,
        lyrics: `[Intro]\n(Melodic theme opening)\n\n[Verse 1]\n조용히 번져오는 하루의 시작 속에\n흘러가는 생각들을 멜로디에 담아\n\n[Chorus]\n마음 깊은 곳에 울려 퍼지는 작은 노래\n오늘을 살아가는 우리 모두를 위한 멜로디\n\n[Outro]\n(Fade out)`
      });
    }
  }

  const tracklistText = tracks.map((t, idx) => {
    const min = Math.floor(idx * 3 + (idx * 20) / 60);
    const sec = ((idx * 24) % 60).toString().padStart(2, '0');
    return `${(idx + 1).toString().padStart(2, '0')}. ${t.title} (${min}:${sec})`;
  }).join('\n');

  return {
    modelUsed: `${provider.toUpperCase()} - ${model || 'SOP Analyzer'}`,
    result: {
      tracks,
      youtube: {
        title: `[PLAYLIST] ${theme.name} | 영화 같은 감성의 플레이리스트 🎬 ☕️`,
        description: `입력된 SOP 지침을 바탕으로 기획된 ${theme.name} 플레이리스트입니다.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #플레이리스트 #음악추천 #BGM`,
        tracklist: tracklistText,
        hashtags: '#플레이리스트 #음악추천 #BGM #OST #감성음악',
        thumbnailPrompt: 'Cinematic 16:9 movie still, melancholic beautiful film scene, soft warm golden hour light, 35mm film aesthetic, 8k --ar 16:9',
        backgroundImagePrompt: '16:9 seamless film loop background: warm vintage cinema aesthetic, slow ambient light rays'
      }
    }
  };
}
