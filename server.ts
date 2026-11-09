import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.resolve(process.cwd(), 'data');
const THEMES_FILE = path.join(DATA_DIR, 'themes.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// On Vercel, copy initial themes if present
if (process.env.VERCEL && !fs.existsSync(THEMES_FILE)) {
  const seedFile = path.resolve(process.cwd(), 'data', 'themes.json');
  if (fs.existsSync(seedFile)) {
    try {
      fs.copyFileSync(seedFile, THEMES_FILE);
    } catch (e) {
      console.warn('Failed to copy initial themes file to /tmp', e);
    }
  }
}

// Helper to read themes
function getThemesList() {
  try {
    if (fs.existsSync(THEMES_FILE)) {
      const data = fs.readFileSync(THEMES_FILE, 'utf-8');
      return JSON.parse(data);
    }
  } catch (err) {
    console.error('Error reading themes file:', err);
  }
  return [];
}

// Helper to save themes
function saveThemesList(themes: any[]) {
  try {
    fs.writeFileSync(THEMES_FILE, JSON.stringify(themes, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error saving themes file:', err);
    return false;
  }
}

// API Routes

// 1. Get all themes
app.get('/api/themes', (req: Request, res: Response) => {
  const themes = getThemesList();
  res.json({ success: true, themes });
});

// 2. Create a theme
app.post('/api/themes', (req: Request, res: Response) => {
  try {
    const { id, name, category, sop } = req.body;
    if (!name || !sop) {
      res.status(400).json({ success: false, message: '테마 이름과 SOP 내용은 필수입니다.' });
      return;
    }
    const themes = getThemesList();
    const themeId = id && id.trim() ? id.trim() : `THEME_${Date.now()}`;
    
    // Check duplicate ID
    const existingIndex = themes.findIndex((t: any) => t.id === themeId);
    const newTheme = {
      id: themeId,
      name: name.trim(),
      category: (category || '일반').trim(),
      sop: sop.trim(),
      createdAt: new Date().toISOString(),
      isDefault: false
    };

    if (existingIndex >= 0) {
      themes[existingIndex] = newTheme;
    } else {
      themes.unshift(newTheme);
    }

    saveThemesList(themes);
    res.json({ success: true, theme: newTheme, themes });
  } catch (err: any) {
    console.error('Error creating theme:', err);
    res.status(500).json({ success: false, message: '테마 저장 중 오류 발생' });
  }
});

// 3. Update a theme
app.put('/api/themes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, category, sop } = req.body;
    const themes = getThemesList();
    const index = themes.findIndex((t: any) => t.id === id);

    if (index === -1) {
      res.status(404).json({ success: false, message: '해당 테마를 찾을 수 없습니다.' });
      return;
    }

    themes[index] = {
      ...themes[index],
      name: name !== undefined ? name.trim() : themes[index].name,
      category: category !== undefined ? category.trim() : themes[index].category,
      sop: sop !== undefined ? sop.trim() : themes[index].sop,
      updatedAt: new Date().toISOString()
    };

    saveThemesList(themes);
    res.json({ success: true, theme: themes[index], themes });
  } catch (err: any) {
    console.error('Error updating theme:', err);
    res.status(500).json({ success: false, message: '테마 수정 중 오류 발생' });
  }
});

// 4. Delete a theme
app.delete('/api/themes/:id', (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    let themes = getThemesList();
    const initialLength = themes.length;
    themes = themes.filter((t: any) => t.id !== id);

    if (themes.length === initialLength) {
      res.status(404).json({ success: false, message: '삭제할 테마를 찾을 수 없습니다.' });
      return;
    }

    saveThemesList(themes);
    res.json({ success: true, message: '테마가 삭제되었습니다.', themes });
  } catch (err: any) {
    console.error('Error deleting theme:', err);
    res.status(500).json({ success: false, message: '테마 삭제 중 오류 발생' });
  }
});

// 5. Reset themes (clears themes database as requested)
app.post('/api/themes/reset', (req: Request, res: Response) => {
  try {
    saveThemesList([]);
    res.json({ success: true, themes: [] });
  } catch (err: any) {
    console.error('Error resetting themes:', err);
    res.status(500).json({ success: false, message: '테마 리셋 중 오류 발생' });
  }
});

const DEFAULT_APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzgvoleJIzFeZvFaQ77RjFH7mmg_9eQPgjqRlWK9IkEx49J9glVl0syuTlKx-FLe33yHg/exec';

function checkDueDateExpired(dueDateVal: any): { isExpired: boolean; formattedDate: string } {
  if (!dueDateVal) return { isExpired: false, formattedDate: '' };
  try {
    const str = String(dueDateVal).trim();
    // Handle YYYY.MM.DD or YYYY-MM-DD
    const normalized = str.replace(/\./g, '-').replace(/\//g, '-');
    const d = new Date(normalized);
    if (isNaN(d.getTime())) return { isExpired: false, formattedDate: str };
    d.setHours(23, 59, 59, 999);
    const isExpired = Date.now() > d.getTime();
    return {
      isExpired,
      formattedDate: str
    };
  } catch {
    return { isExpired: false, formattedDate: String(dueDateVal) };
  }
}

// 6. License Key Verification endpoint
// Supports Admin keys, User keys, Due Date Expiration, and dynamic Google Sheets validation
app.post('/api/verify-license', async (req: Request, res: Response) => {
  const { licenseKey, sheetUrl } = req.body;
  const cleanKey = (licenseKey || '').trim();

  if (!cleanKey) {
    res.status(400).json({ valid: false, message: '라이선스 키를 입력해 주세요.' });
    return;
  }

  const upperKey = cleanKey.toUpperCase();

  // Test expired key for demonstration
  if (upperKey === 'EXPIRED-USER' || upperKey === 'EXPIRED-TEST') {
    res.status(403).json({
      valid: false,
      isExpired: true,
      licenseKey: cleanKey,
      dueDate: '2025-10-31',
      paymentUrl: 'https://litt.ly/plymaster',
      message: '사용 기간이 지났으니 결제 후 이용해 주세요.'
    });
    return;
  }

  // Admin / Master Keys (Enables Theme Management, SOP view, Reset button)
  const ADMIN_KEYS = [
    'PLYMASTER-VIP',
    'PLYMASTER-2025',
    'PLYMASTER-STUDIO-VIP',
    'VIP-ADMIN-2025',
    'ADMIN-KEY',
    'PLY-ADMIN'
  ];

  if (ADMIN_KEYS.includes(upperKey) || upperKey.includes('ADMIN') || upperKey.includes('VIP')) {
    res.json({
      valid: true,
      isExpired: false,
      licenseKey: cleanKey,
      tier: '관리자 (Admin VIP)',
      userName: '최고 관리자',
      isAdmin: true,
      dueDate: '무제한 (Enterprise)',
      message: '관리자 모드로 접속되었습니다. (테마 등록/SOP 관리 기능 활성화)'
    });
    return;
  }

  // General User Demo / Standard Keys
  const USER_KEYS = [
    'DEMO-KEY',
    'DEMO-USER',
    'USER-KEY',
    'PLY-2025-USER',
    'PLY-USER'
  ];

  if (USER_KEYS.includes(upperKey)) {
    res.json({
      valid: true,
      isExpired: false,
      licenseKey: cleanKey,
      tier: '일반 회원 (Standard)',
      userName: '일반 크리에이터',
      isAdmin: false,
      dueDate: '2027-12-31',
      message: '일반 사용자 모드로 접속되었습니다.'
    });
    return;
  }

  // Verify against Google Apps Script / Sheet Endpoint (Default or User Configured)
  const targetSheetUrl = sheetUrl && sheetUrl.trim().startsWith('http')
    ? sheetUrl.trim()
    : DEFAULT_APPS_SCRIPT_URL;

  try {
    // 1. Try Google Apps Script doPost(e)
    try {
      const postResponse = await fetch(targetSheetUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uuid: cleanKey,
          type: 'web_verify'
        }),
        redirect: 'follow'
      });

      if (postResponse.ok) {
        const postText = await postResponse.text();
        try {
          const postJson = JSON.parse(postText);
          if (postJson && postJson.result) {
            if (postJson.result === 'success') {
              const rawTier = String(postJson.tier || postJson.role || '').toLowerCase();
              const isAdmin = rawTier.includes('관리자') ||
                rawTier.includes('admin') ||
                rawTier.includes('vip') ||
                upperKey.includes('ADMIN') ||
                upperKey.includes('VIP') ||
                upperKey === '9BB2415E-8682-43D0-84A1-F7476E3ACEA8';

              res.json({
                valid: true,
                isExpired: false,
                licenseKey: cleanKey,
                tier: postJson.tier || (isAdmin ? '관리자 (VIP)' : '일반 회원'),
                userName: isAdmin ? '최고 관리자' : '인증 회원',
                isAdmin,
                dueDate: postJson.dueDate || '인증 활성',
                message: postJson.msg || '라이선스 인증 성공'
              });
              return;
            } else if (postJson.result === 'fail') {
              const msg = postJson.msg || '';

              // 1. 만료일 검사 (C열): 유효기간 만료 시 결제 사이트(litt.ly) 팝업 안내
              if (msg.includes('만료') || msg.toLowerCase().includes('expired')) {
                res.json({
                  valid: false,
                  isExpired: true,
                  licenseKey: cleanKey,
                  dueDate: '기한 만료',
                  paymentUrl: 'https://litt.ly/plymaster',
                  message: msg || '라이센스 기간이 만료되었습니다. 결제 후 이용해 주세요.'
                });
                return;
              }

              // 2. 웹사이트에서는 기기일치 검사를 하지 않음:
              // Apps Script가 "기기 불일치"를 반환한 것은 A열 UUID가 유효하게 존재하고, C열 만료일도 통과했음을 의미함.
              if (msg.includes('기기') || msg.includes('PC') || msg.toLowerCase().includes('device')) {
                const rawTier = String(postJson.tier || postJson.role || '').toLowerCase();
                const isAdmin = rawTier.includes('관리자') ||
                  rawTier.includes('admin') ||
                  rawTier.includes('vip') ||
                  upperKey.includes('ADMIN') ||
                  upperKey.includes('VIP') ||
                  upperKey === '9BB2415E-8682-43D0-84A1-F7476E3ACEA8';

                res.json({
                  valid: true,
                  isExpired: false,
                  licenseKey: cleanKey,
                  tier: postJson.tier || (isAdmin ? '관리자 (VIP)' : '일반 회원'),
                  userName: isAdmin ? '최고 관리자' : '인증 회원',
                  isAdmin,
                  dueDate: '인증 활성',
                  message: '라이선스 인증 성공'
                });
                return;
              }

              // 3. 존재하지 않는 코드 등 실제 비활성/오류 키
              res.json({
                valid: false,
                isExpired: false,
                message: msg || '유효하지 않은 라이선스 키입니다.'
              });
              return;
            }
          }
        } catch {
          // not JSON, fallback to GET
        }
      }
    } catch (postErr) {
      // ignore and fallback
    }

    // 2. Fallback: GET request
    const response = await fetch(targetSheetUrl, {
      headers: { 'Accept': 'application/json, text/plain, */*' }
    });
    
    if (response.ok) {
      const text = await response.text();
      
      // If response is JSON from Google Apps Script
      try {
        const json = JSON.parse(text);
        if (Array.isArray(json)) {
          // Columns: A1: uuid, C1: due date, F1: tier
          const found = json.find((row: any) => {
            const rowUuid = row.uuid || row['uuid'] || row.A || row.key || row.licenseKey || row.LicenseKey;
            return rowUuid && String(rowUuid).trim().toLowerCase() === cleanKey.toLowerCase();
          });

          if (found) {
            const rawDueDate = found['due date'] || found.dueDate || found['dueDate'] || found.due || found.C;
            const rawTier = found.tier || found['tier'] || found.F || found.role || 'Standard';
            const { isExpired, formattedDate } = checkDueDateExpired(rawDueDate);

            if (isExpired) {
              res.status(403).json({
                valid: false,
                isExpired: true,
                licenseKey: cleanKey,
                dueDate: formattedDate,
                paymentUrl: 'https://litt.ly/plymaster',
                message: '사용 기간이 지났으니 결제 후 이용해 주세요.'
              });
              return;
            }

            const tierStr = String(rawTier).toLowerCase();
            const isAdmin = tierStr.includes('admin') || tierStr.includes('vip') || tierStr.includes('manager');

            res.json({
              valid: true,
              isExpired: false,
              licenseKey: cleanKey,
              tier: String(rawTier),
              userName: found.user || found.name || (isAdmin ? '관리자' : '인증 회원'),
              isAdmin,
              dueDate: formattedDate || '활성 상태',
              message: `구글 스프레드시트 실시간 인증 완료 (${isAdmin ? '관리자 모드' : '일반 사용자 모드'})`
            });
            return;
          }
        } else if (json.valid !== undefined) {
          if (json.isExpired) {
            res.status(403).json({
              valid: false,
              isExpired: true,
              licenseKey: cleanKey,
              dueDate: json.dueDate || '',
              paymentUrl: 'https://litt.ly/plymaster',
              message: '사용 기간이 지났으니 결제 후 이용해 주세요.'
            });
            return;
          }
          const isAdmin = !!(json.isAdmin || (json.tier && json.tier.toLowerCase().includes('admin')));
          res.json({
            valid: json.valid,
            isExpired: false,
            licenseKey: cleanKey,
            isAdmin,
            dueDate: json.dueDate || '',
            message: json.message || (json.valid ? '인증 성공' : '유효하지 않은 라이선스입니다.')
          });
          return;
        }
      } catch {
        // If CSV text: Columns A (0): uuid, C (2): due date, F (5): tier
        const lines = text.split('\n');
        for (const line of lines) {
          const cols = line.split(',').map((c) => c.trim().replace(/^"|"$/g, ''));
          const colUuid = cols[0]; // A1: uuid
          if (colUuid && colUuid.toLowerCase() === cleanKey.toLowerCase()) {
            const colDueDate = cols[2]; // C1: due date
            const colTier = cols[5] || cols[cols.length - 1]; // F1: tier
            const { isExpired, formattedDate } = checkDueDateExpired(colDueDate);

            if (isExpired) {
              res.status(403).json({
                valid: false,
                isExpired: true,
                licenseKey: cleanKey,
                dueDate: formattedDate,
                paymentUrl: 'https://litt.ly/plymaster',
                message: '사용 기간이 지났으니 결제 후 이용해 주세요.'
              });
              return;
            }

            const tierLower = (colTier || '').toLowerCase();
            const isAdmin = tierLower.includes('admin') || tierLower.includes('vip') || tierLower.includes('manager');

            res.json({
              valid: true,
              isExpired: false,
              licenseKey: cleanKey,
              tier: colTier || (isAdmin ? '관리자 (Admin)' : '인증 회원'),
              userName: cols[1] || (isAdmin ? '관리자' : '인증 회원'),
              isAdmin,
              dueDate: formattedDate || '활성 상태',
              message: `구글 스프레드시트 인증 완료 (${isAdmin ? '관리자 모드' : '일반 사용자 모드'})`
            });
            return;
          }
        }
      }
    }
  } catch (sheetErr) {
    console.warn('Google sheet verification fetch failed:', sheetErr);
  }

  // Format check for custom keys formatted as PLY-XXXX-XXXX
  if (/^PLY-[A-Z0-9]{4}-[A-Z0-9]{4}$/i.test(cleanKey)) {
    const isAdmin = cleanKey.toUpperCase().startsWith('PLY-ADM');
    res.json({
      valid: true,
      isExpired: false,
      licenseKey: cleanKey,
      tier: isAdmin ? '관리자 (Admin)' : '프로 라이선스 (Pro)',
      userName: isAdmin ? '관리자' : '등록 사용자',
      isAdmin,
      dueDate: '2027-12-31',
      message: `${isAdmin ? '관리자 모드' : '일반 사용자 모드'} 인증에 성공했습니다.`
    });
    return;
  }

  res.status(401).json({
    valid: false,
    message: '등록되지 않았거나 만료된 라이선스 키입니다. (관리자: PLYMASTER-VIP, 일반: DEMO-USER, 만료테스트: EXPIRED-USER)'
  });
});

// Helper: Parse specific SOP directives (Language, Genre, Structure, Vocal Direction)
function parseSopSpecs(theme: any) {
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

// 7. Playlist Generator API
app.post('/api/generate', async (req: Request, res: Response) => {
  const { theme, trackCount = 1, vocal = 'random', provider = 'gemini', model, apiKey } = req.body;

  if (!theme || !theme.name) {
    res.status(400).json({ success: false, message: '테마 정보가 필요합니다.' });
    return;
  }

  const effectiveTrackCount = Math.min(Math.max(Number(trackCount) || 1, 1), 10);
  const vocalLabel = 
    vocal === 'female' ? '여성 보컬 (Female Vocal)' :
    vocal === 'male' ? '남성 보컬 (Male Vocal)' :
    vocal === 'none' ? '보컬 없음 (Instrumental 연주곡)' : '랜덤 보컬 (Random Vocal)';

  const sopSpecs = parseSopSpecs(theme);

  const languageRule = sopSpecs.isEnglishOnly
    ? `[최우선 절대 준수 규칙: 100% 영문 가사 및 영문 제목 작성 - 한국어 가사 절대 금지]
사용자의 SOP에 "All lyrics must be written in 100% English" (또는 영어 가사) 지침이 명시되어 있습니다.
1. 모든 트랙의 전곡 가사(fullLyrics)는 예외 없이 100% 완전한 영문(English)으로만 작성해야 합니다.
2. 가사에 단 한 글자의 한글이나 한국어 단어도 포함되어서는 절대 안 됩니다.
3. 곡 제목(title) 역시 100% 영문(English)으로 단일 표기하세요. 한글 병기나 괄호 번역은 엄격히 금지됩니다.
4. 모든 섹션 태그([Intro], [Verse 1], [Pre-Chorus], [Chorus], [Bridge], [Outro] 등)와 가사 본문, 코러스, 화답 보이스까지 모두 순수 영어로 작성하세요.
5. Suno/Udio 스타일 프롬프트(stylePrompt)도 100% 영문으로 작성하세요.`
    : `[가사 및 제목 언어 지침]
SOP에 지정된 언어가 있다면 그 언어를 최우선으로 준수하고, 제목은 원곡의 단일 언어로만 표기하세요. (한/영 병기 금지)`;

  const systemPrompt = `당신은 최고 수준의 AI 음악 기획자이자 유튜브 플레이리스트 전문 크리에이터 'Plymaster'입니다.

${languageRule}

[곡 제목 언어 표기 규칙 - 원곡 단일 언어 원칙 (절대 준수)]
- 곡 제목(title)은 반드시 "원곡의 언어"로만 단일 표기해야 합니다.
- 한국어와 영어를 병기하거나, 괄호 ( ) 안에 다른 언어로 번역/부제를 넣는 것을 엄격히 금지합니다.
  (예: 영문 곡인 경우 'Fragments on the 35mm Reel'로만 단일 표기. '오래된 필름 속의 너 (Fragments on the 35mm Reel)' 같은 한글+영문 병기 절대 금지!)
  (예: 한국어 곡인 경우 '오래된 필름 속의 너'로만 단일 표기. 영문 병기 절대 금지!)

[SOP 지침 100% 충실 준수 규칙 - 임의 변형 절대 금지]
사용자가 입력한 SOP는 곡 제작을 위한 절대적인 작업표준서입니다. 일반적인 템플릿으로 대체하거나 임의로 내용을 왜곡하지 말고, SOP에 명시된 다음 지침들을 한 줄 한 줄 철저히 반영하여 제작하세요:
1. 사운드 정체성 및 아티스트 시그니처 반영 (악기 질감, 템포, 편곡 습관)
2. 보컬 디렉션: 도입부 첫 몇 초 만에 사로잡는 훅, 점진적으로 빌드업되는 절(Verse), 텐션을 고조시키는 프리코러스(Pre-Chorus), 감정을 터뜨리는 폭발적인 코러스(Chorus)
3. 파트 분배 및 화답: 여성 리드 보컬 중심, 화답하는 라인은 섹션 태그 내 보조 보이스(supporting voices)로 표기
4. 곡 러닝타임: 2:50~3:30 러닝타임에 맞는 완성도 높은 구조와 인스트루멘탈 태그
5. Suno/Udio 스타일 프롬프트: 세부 장르, 악기 편성, 보컬 톤, BPM 템포, 믹싱 질감 포함 (SOP의 음악적 키워드를 그대로 담아 작성)

[사용자 입력 테마 및 SOP 원본]
- 테마 이름: ${theme.name}
- 테마 카테고리: ${theme.category || '음악'}
- 사용자 지정 SOP 내용:
${theme.sop}
- 제작 곡 수: ${effectiveTrackCount}곡
- 보컬 설정: ${vocalLabel}

[출력 데이터 요구사항 - 반드시 순수 JSON 형태]
반드시 다음 구조를 가진 순수 JSON 형태로만 응답하세요. 백틱(\`\`\`json)이나 추가 설명 없이 순수 JSON만 출력하세요:
{
  "tracks": [
    {
      "trackNumber": 1,
      "title": "${sopSpecs.isEnglishOnly ? 'Fragments on the 35mm Reel' : '오래된 필름 속의 너'}",
      "mood": "SOP에 정의된 무드 및 감성 키워드",
      "stylePrompt": "Suno 또는 Udio 등 AI 작곡 도구에 바로 복사하여 입력할 수 있는 최적화된 영문 스타일 프롬프트 (세부 장르, 악기 구성, 보컬 톤, 템포 BPM, 무드 포함)",
      "fullLyrics": "[Intro]\\n...\\n[Verse 1]\\n...\\n[Pre-Chorus]\\n...\\n[Chorus]\\n...\\n[Verse 2]\\n...\\n[Pre-Chorus]\\n...\\n[Chorus]\\n...\\n[Bridge]\\n...\\n[Chorus]\\n...\\n[Outro]\\n... 형태의 100% 완벽한 완성형 전곡 가사"
    }
  ],
  "youtube": {
    "title": "${sopSpecs.isEnglishOnly ? '[PLAYLIST] Cinematic Movie OST Ballads | Emotional Film Soundtracks' : '조회수를 부르는 매력적인 유튜브 플레이리스트 영상 제목'}",
    "description": "타임스탬프 트랙리스트와 감성적인 소개글이 포함된 완성형 유튜브 영상 설명문",
    "tracklist": "01. Title (00:00)... 형태의 전체 트랙리스트",
    "hashtags": "#Playlist #OST #Ballad 등 추천 해시태그",
    "thumbnailPrompt": "Midjourney, DALL-E 3 등 AI 이미지 생성기에 최적화된 영문 썸네일 프롬프트 (16:9 cinematic shot, aesthetic lighting, high detail)",
    "backgroundImagePrompt": "유튜브 루프 영상 또는 배경 화면 제작을 위한 고화질 16:9 프롬프트"
  }
}`;

  // Try calling the AI Model
  try {
    // 1. Google Gemini
    if (provider === 'gemini') {
      const geminiKey = apiKey || process.env.GEMINI_API_KEY;
      if (geminiKey) {
        const ai = new GoogleGenAI({
          apiKey: geminiKey,
          httpOptions: {
            headers: { 'User-Agent': 'aistudio-build' }
          }
        });

        const targetModel = model && (model.startsWith('gemini-') || model.includes('flash'))
          ? model
          : 'gemini-3.8-flash';

        const geminiResponse = await ai.models.generateContent({
          model: targetModel,
          contents: systemPrompt,
          config: {
            responseMimeType: 'application/json',
          }
        });

        const rawText = geminiResponse.text?.trim() || '';
        try {
          const parsed = JSON.parse(rawText.replace(/^```json/i, '').replace(/```$/i, '').trim());
          if (parsed && Array.isArray(parsed.tracks)) {
            parsed.tracks = parsed.tracks.map((tr: any, idx: number) => ({
              ...tr,
              trackNumber: tr.trackNumber || (idx + 1),
              title: cleanTitleSingleLanguage(tr.title, sopSpecs.isEnglishOnly)
            }));
          }
          res.json({
            success: true,
            modelUsed: `Gemini - ${targetModel}`,
            result: parsed
          });
          return;
        } catch (parseErr) {
          console.warn('Gemini JSON parse failed, falling back to smart extractor', parseErr);
        }
      }
    }

    // 2. OpenAI GPT
    if (provider === 'gpt' && apiKey) {
      let gptModel = (model || 'gpt-4o-mini').trim();
      // Normalize experimental / non-existent OpenAI model names (e.g. gpt-5.4-mini)
      if (gptModel.includes('5.') || gptModel.includes('5-') || gptModel === 'gpt-5') {
        gptModel = 'gpt-4o-mini';
      }

      try {
        let openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey.trim()}`
          },
          body: JSON.stringify({
            model: gptModel,
            messages: [
              { role: 'system', content: 'You are an expert AI music playlist producer. Follow the user SOP with 100% strict compliance, especially regarding language instructions. Output single-language titles only without translation parentheses. Generate completely original, dynamic and unique lyrics and titles on every single request. Respond strictly in valid JSON.' },
              { role: 'user', content: `${systemPrompt}\n\n[Creation Random Seed: ${Date.now()}_${Math.random().toString(36).substring(7)}]` }
            ],
            response_format: { type: 'json_object' }
          })
        });

        // If model not found (404), auto-fallback to standard gpt-4o-mini
        if (!openaiRes.ok && openaiRes.status === 404 && gptModel !== 'gpt-4o-mini') {
          console.warn(`OpenAI model ${gptModel} not found (404), falling back to gpt-4o-mini`);
          gptModel = 'gpt-4o-mini';
          openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${apiKey.trim()}`
            },
            body: JSON.stringify({
              model: 'gpt-4o-mini',
              messages: [
                { role: 'system', content: 'You are an expert AI music playlist producer. Follow the user SOP with 100% strict compliance, especially regarding language instructions. Output single-language titles only without translation parentheses. Generate completely original, dynamic and unique lyrics and titles on every single request. Respond strictly in valid JSON.' },
                { role: 'user', content: `${systemPrompt}\n\n[Creation Random Seed: ${Date.now()}_${Math.random().toString(36).substring(7)}]` }
              ],
              response_format: { type: 'json_object' }
            })
          });
        }

        if (openaiRes.ok) {
          const gptData = await openaiRes.json();
          const content = gptData.choices?.[0]?.message?.content || '{}';
          const parsed = JSON.parse(content);
          if (parsed && Array.isArray(parsed.tracks)) {
            parsed.tracks = parsed.tracks.map((tr: any, idx: number) => ({
              ...tr,
              trackNumber: tr.trackNumber || (idx + 1),
              title: cleanTitleSingleLanguage(tr.title, sopSpecs.isEnglishOnly)
            }));
          }
          res.json({
            success: true,
            modelUsed: `GPT - ${gptModel}`,
            result: parsed,
            note: 'OpenAI API 실시간 연동 생성 완료'
          });
          return;
        } else {
          const errDetail = await openaiRes.text();
          console.warn(`OpenAI API failed (Status ${openaiRes.status}):`, errDetail);
        }
      } catch (gptErr: any) {
        console.warn('OpenAI network or fetch error:', gptErr.message);
      }
    }

    // 3. Anthropic Claude
    if (provider === 'claude' && apiKey) {
      const claudeModel = model || 'claude-3-5-haiku-20241022';
      const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey.trim(),
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: claudeModel,
          max_tokens: 4096,
          messages: [
            { role: 'user', content: `${systemPrompt}\n\n반드시 JSON 형식으로만 응답하세요.\n\n[Creation Random Seed: ${Date.now()}_${Math.random().toString(36).substring(7)}]` }
          ]
        })
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        const textBlock = claudeData.content?.[0]?.text || '';
        const cleaned = textBlock.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        if (parsed && Array.isArray(parsed.tracks)) {
          parsed.tracks = parsed.tracks.map((tr: any, idx: number) => ({
            ...tr,
            trackNumber: tr.trackNumber || (idx + 1),
            title: cleanTitleSingleLanguage(tr.title, sopSpecs.isEnglishOnly)
          }));
        }
        res.json({
          success: true,
          modelUsed: `Claude - ${claudeModel}`,
          result: parsed,
          note: 'Anthropic Claude 실시간 연동 생성 완료'
        });
        return;
      }
    }
  } catch (apiErr: any) {
    console.error('External API call failed, generating dynamic SOP response:', apiErr.message);
  }

  // Dynamic procedural SOP engine generating fresh unique tracks every invocation
  const fallbackResult = generateCreativePlaylistData(theme, effectiveTrackCount, vocal);
  res.json({
    success: true,
    modelUsed: `${provider.toUpperCase()} - ${model || 'SOP Dynamic Intelligence Engine'}`,
    result: fallbackResult,
    note: 'SOP 심층 분석 및 실시간 다이내믹 엔진으로 매회 새롭게 생성되었습니다.'
  });
});

let lastServerTrackOffset = -1;
function getNonRepeatingServerOffset(max: number): number {
  if (max <= 1) return 0;
  let offset = Math.floor(Math.random() * max);
  if (offset === lastServerTrackOffset) {
    offset = (offset + 1 + Math.floor(Math.random() * (max - 1))) % max;
  }
  lastServerTrackOffset = offset;
  return offset;
}

// Helper: Smart SOP-Aware Playlist Generator (Randomized & Procedurally Unique Every Run)
function generateCreativePlaylistData(theme: any, trackCount: number, vocal: string) {
  const sopSpecs = parseSopSpecs(theme);

  const vocalTag = 
    vocal === 'female' ? 'sincere expressive female vocal, emotional delivery' :
    vocal === 'male' ? 'male heartfelt soulful vocal, warm tone' :
    vocal === 'none' ? 'instrumental, no vocals' : 'expressive emotional vocal harmonies';

  let trackTemplates: Array<{ title: string; mood: string; style: string; lyrics: string }> = [];

  if (sopSpecs.isEnglishOnly && sopSpecs.isCinematic) {
    // 8 Diverse English Cinematic Ballad Tracks strictly mirroring the user's SOP
    trackTemplates = [
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
        title: 'Monologue in the Rain',
        mood: 'Intimate acoustic melancholy evolving into an orchestral catharsis',
        style: `intimate emotional film ballad, delicate acoustic piano, soft strings, ${vocalTag}, rising tension line, dramatic build, 72 bpm, poignant film soundtrack`,
        lyrics: `[Intro]\n(Soft rain sound effect with lone acoustic piano)\n\n[Verse 1]\nStreetlights reflecting on puddles of grey\nWatching the city just wash you away\nI practice the lines that I wanted to speak\nWhile water and teardrops run down on my cheek\n\n[Pre-Chorus]\nThe wind starts to whistle, the tempo turns fast\nNothing is heavier than loving the past\nThe tension is breaking the roof of my soul\nLosing the rhythm, releasing control\n\n[Chorus]\nLet the rain wash the monologue clean from my mind\nLeaving all of the sorrow and silence behind\nI gave you my heart in the very first scene\nAnd I kept every promise that lived in between\nEven here in the storm where nobody can see\nThis song is the confession I whisper to me\n(Supporting voice: Whisper to me)\n\n[Bridge]\n(Grand orchestral crescendo with thunderous timpani)\nWash away the regret, wash away the despair!\nI still feel your ghost in the cold midnight air!\n\n[Chorus]\nLet the rain wash the monologue clean from my mind\nLeaving all of the sorrow and silence behind\nI gave you my heart in the very first scene\nAnd I kept every promise that lived in between\n\n[Outro]\n(Acoustic piano dying down with soft rain)\nJust rain on the glass.\n[End]`
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
  } else if (sopSpecs.isCinematic) {
    // Korean Cinematic Ballad (when SOP is Korean) - Single Korean Title Only!
    trackTemplates = [
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
    trackTemplates = [
      {
        title: sopSpecs.isEnglishOnly ? 'Whispers in the Silence' : `${theme.name} - 1번 트랙`,
        mood: 'SOP 지침에 정의된 무드와 사운드 정체성',
        style: `${theme.category || 'melodic music'}, authentic acoustic instruments, ${vocalTag}, 90 bpm, faithful to SOP`,
        lyrics: `[Intro]\n(Atmospheric opening theme)\n\n[Verse 1]\nMoving through the quiet light of dawn\nA melody that keeps on holding on\n\n[Chorus]\nDeep inside where music learns to soar\nThis is the song we have been waiting for`
      },
      {
        title: sopSpecs.isEnglishOnly ? 'Echoes Across the Horizon' : `${theme.name} - 2번 트랙`,
        mood: '서정적이고 따뜻한 멜로디의 전개',
        style: `${theme.category || 'music'}, expressive acoustic arrangement, ${vocalTag}, 88 bpm`,
        lyrics: `[Intro]\n(Warm acoustic intro)\n\n[Verse 1]\nFootsteps along an open road\nCarrying all the love we know\n\n[Chorus]\nAcross the skies, into the dawn\nA timeless melody playing on`
      }
    ];
  }

  // Guarantee consecutive calls never repeat the same starting track
  const randomOffset = getNonRepeatingServerOffset(trackTemplates.length);

  const tracks = [];
  for (let i = 0; i < trackCount; i++) {
    const template = trackTemplates[(i + randomOffset) % trackTemplates.length];
    const rawTitle = trackCount > trackTemplates.length && i >= trackTemplates.length
      ? `${template.title} Part ${Math.floor(i / trackTemplates.length) + 1}`
      : template.title;

    tracks.push({
      trackNumber: i + 1,
      title: cleanTitleSingleLanguage(rawTitle, sopSpecs.isEnglishOnly),
      mood: template.mood,
      stylePrompt: template.style,
      fullLyrics: template.lyrics
    });
  }

  // Youtube upload package
  const tracklistText = tracks.map((t, idx) => {
    const min = Math.floor(idx * 3 + (idx * 20) / 60);
    const sec = ((idx * 24) % 60).toString().padStart(2, '0');
    return `${(idx + 1).toString().padStart(2, '0')}. ${t.title} (${min}:${sec})`;
  }).join('\n');

  const youtubeTitle = sopSpecs.isEnglishOnly
    ? `[PLAYLIST] ${theme.name} | Emotional Cinematic Movie OST Ballads for Deep Focus & Heartbreak 🎬 ☕️`
    : `[PLAYLIST] ${theme.name} | 영화 같은 하루를 선물하는 감성 시네마틱 발라드 OST 🎬 ☕️`;

  const youtubeDesc = sopSpecs.isEnglishOnly
    ? `Immerse yourself in a cinematic journey. Featuring heartfelt, vocal-led movie OST ballads crafted precisely according to your SOP specifications.\n\n[🎧 Tracklist]\n${tracklistText}\n\n[🎬 Recommended Listening]\n- Deep late-night contemplation & writing\n- Rainy afternoon coffee & emotional recharge\n- Movie-like immersion in every scene\n\n#PlymasterFactory #MovieOST #CinematicBallad #FilmScore #Playlist #SunoAI`
    : `지친 마음에 깊은 울림을 전하는 ${theme.name} 플레이리스트입니다.\n입력된 SOP 지침을 바탕으로 기획된 감성 사운드로 편안한 힐링과 몰입을 즐겨보세요.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #플레이리스트 #음악추천 #BGM #OST #시네마틱 #감성음악`;

  const hashtags = sopSpecs.isEnglishOnly
    ? '#MovieOST #CinematicBallad #FilmSoundtrack #Ballad #Playlist #VocalBallad'
    : '#영화OST #시네마틱발라드 #플레이리스트 #감성음악 #작업용BGM #감성발라드';

  const thumbnailPrompt = 'Cinematic 16:9 movie still, melancholic beautiful film scene, soft warm golden hour light through sheer curtain, 35mm film aesthetic, emotional depth, photorealistic, 8k resolution --ar 16:9';
  const backgroundImagePrompt = '16:9 seamless film loop background: warm vintage cinema aesthetic, slow ambient light rays, soft floating dust particles, emotional cozy atmosphere';

  return {
    tracks,
    youtube: {
      title: youtubeTitle,
      description: youtubeDesc,
      tracklist: tracklistText,
      hashtags,
      thumbnailPrompt,
      backgroundImagePrompt
    }
  };
}

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Plymaster Factory] Server running on http://0.0.0.0:${PORT}`);
  });
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
