import express, { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import seedThemes from './data/themes.json' with { type: 'json' };

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.VERCEL
  ? path.join('/tmp', 'data')
  : path.resolve(process.cwd(), 'data');
const THEMES_FILE = path.join(DATA_DIR, 'themes.json');

// Ensure data directory exists
try {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
} catch (e) {
  console.warn('Failed to ensure DATA_DIR:', e);
}

// On Vercel, copy initial themes if present
if (process.env.VERCEL && !fs.existsSync(THEMES_FILE)) {
  try {
    fs.writeFileSync(THEMES_FILE, JSON.stringify(seedThemes, null, 2), 'utf-8');
  } catch (e) {
    console.warn('Failed to initialize themes file in /tmp', e);
  }
}

// Helper to read themes
function getThemesList() {
  try {
    if (fs.existsSync(THEMES_FILE)) {
      const data = fs.readFileSync(THEMES_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading themes file from disk, using embedded seed:', err);
  }
  // Initialize file with seed themes if possible
  try {
    if (!fs.existsSync(THEMES_FILE)) {
      saveThemesList(seedThemes);
    }
  } catch {}
  return seedThemes;
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

// API Routes (supports both /api/path and /path for direct Vercel serverless function rewrites)

// 1. Get all themes
app.get(['/api/themes', '/themes'], (req: Request, res: Response) => {
  const themes = getThemesList();
  res.json({ success: true, themes });
});

// 2. Create a theme
app.post(['/api/themes', '/themes'], (req: Request, res: Response) => {
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
app.put(['/api/themes/:id', '/themes/:id'], (req: Request, res: Response) => {
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
app.delete(['/api/themes/:id', '/themes/:id'], (req: Request, res: Response) => {
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
app.post(['/api/themes/reset', '/themes/reset'], (req: Request, res: Response) => {
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
app.post(['/api/verify-license', '/verify-license'], async (req: Request, res: Response) => {
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

  // Check if Korean or Kor-Eng code-switching is intended in the SOP
  const hasKoreanDirectives = 
    combined.includes('한영 혼용') ||
    combined.includes('한영혼용') ||
    combined.includes('kor-eng') ||
    combined.includes('code-switching') ||
    combined.includes('한국어') ||
    combined.includes('국문') ||
    combined.includes('한국 힙합') ||
    combined.includes('한국 알앤비') ||
    combined.includes('인스타 감성') ||
    combined.includes('느좋') ||
    korCharCount > 30;

  const isKorEngMixed = 
    combined.includes('한영 혼용') ||
    combined.includes('한영혼용') ||
    combined.includes('kor-eng') ||
    combined.includes('code-switching') ||
    (combined.includes('한국어') && (combined.includes('영어') || combined.includes('english')));

  // Strictly check if 100% English is explicitly mandated without Korean mixing
  const isEnglishExplicit = 
    (combined.includes('100% english') ||
     combined.includes('in 100% english') ||
     combined.includes('all lyrics must be written in 100% english') ||
     combined.includes('all lyrics must be written in english') ||
     combined.includes('write lyrics naturally in english') ||
     combined.includes('100% 영문') ||
     combined.includes('영어로만 작성') ||
     combined.includes('written in 100% english')) &&
    !hasKoreanDirectives;

  // Only English if explicitly mandated and no Korean directives
  const isEnglishOnly = isEnglishExplicit && !hasKoreanDirectives;

  const isKoreanTitle = hasKoreanDirectives || isKorEngMixed || !isEnglishOnly;

  const isKoreanHipHopRnb = 
    combined.includes('알앤비') ||
    combined.includes('힙합') ||
    combined.includes('r&b') ||
    combined.includes('hip-hop') ||
    combined.includes('hiphop') ||
    combined.includes('인스타 감성') ||
    combined.includes('느좋') ||
    combined.includes('트랩');

  // Check if [Intro] or [Outro] are forbidden in the SOP
  const forbidsIntroOutro = 
    combined.includes('intro]와 [outro] 태그는 절대 사용하지 마라') ||
    combined.includes('intro]와 [outro] 태그는 사용하지 마라') ||
    combined.includes('intro와 outro 태그는 절대 사용하지 마라') ||
    combined.includes('intro는 사용하지 마라') ||
    combined.includes('intro 태그 금지') ||
    combined.includes('no intro');

  const isShellacVintage = 
    combined.includes('shellac') ||
    combined.includes('phonograph') ||
    combined.includes('78 rpm') ||
    combined.includes('1940') ||
    combined.includes('vintage pop');

  const isCinematic = 
    combined.includes('film') ||
    combined.includes('movie') ||
    combined.includes('cinematic') ||
    combined.includes('ost') ||
    combined.includes('soundtrack');

  return { 
    isEnglishOnly, 
    isKoreanTitle, 
    isKorEngMixed, 
    isKoreanHipHopRnb, 
    forbidsIntroOutro, 
    isShellacVintage, 
    isCinematic, 
    engCharCount, 
    korCharCount 
  };
}

// Helper: Ensure track title contains ONLY the target language (no bilingual parentheses)
function cleanTitleSingleLanguage(title: string, isEnglishTarget: boolean, fallbackTitle = 'Track Title'): string {
  if (!title) return fallbackTitle;
  let clean = title.trim();
  clean = clean.replace(/^\[?track\s*\d*\]?:?\s*/i, '').replace(/^["'`]|["'`]$/g, '').trim();

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
      if (!clean) clean = fallbackTitle;
    }
  } else {
    clean = clean.replace(/\([a-zA-Z0-9\s-]+\)/g, '').trim();
  }
  return clean || fallbackTitle;
}

// Helper to extract JSON safely from AI output
function extractJsonFromText(rawText: string): any {
  if (!rawText) throw new Error('AI 응답이 비어 있습니다.');
  let text = rawText.trim();
  text = text.replace(/^```json\s*/i, '').replace(/^```\s*/i, '').replace(/\s*```$/i, '').trim();
  try {
    return JSON.parse(text);
  } catch (initialErr) {
    const firstBrace = text.indexOf('{');
    const lastBrace = text.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
      const sliced = text.substring(firstBrace, lastBrace + 1);
      return JSON.parse(sliced);
    }
    throw initialErr;
  }
}

// 7. Playlist Generator API
app.post(['/api/generate', '/generate'], async (req: Request, res: Response) => {
  try {
    const body = req.body || {};
    const { theme, trackCount = 1, vocal = 'random', provider = 'gemini', model, apiKey, mode } = body;

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

    // 1. Explicit Simulation Mode (Offline testing without API key)
    if (mode === 'simulation') {
      const simResult = generateCreativePlaylistData(theme, effectiveTrackCount, vocal);
      res.json({
        success: true,
        modelUsed: '로컬 SOP 시뮬레이션 엔진 (오프라인 모드)',
        isSimulation: true,
        result: simResult,
        note: '로컬 SOP 규칙 기반 시뮬레이션 모드로 생성되었습니다. 실제 AI가 SOP를 100% 반영하여 작사하도록 하려면 상단에 유효한 OpenAI 또는 Gemini API 키를 입력해 주세요.'
      });
      return;
    }

    const cleanKey = (apiKey || '').trim();

    // 2. Validate API Key for the chosen provider
    if (provider === 'gpt') {
      if (!cleanKey) {
        res.status(400).json({
          success: false,
          errorType: 'MISSING_API_KEY',
          message: 'OpenAI(GPT) API 키가 입력되지 않았습니다. 상단 API Key 입력창에 sk-... 형태의 OpenAI API 키를 입력해 주세요. (또는 테스트를 원하시면 시뮬레이션 모드로 생성해 보세요.)'
        });
        return;
      }
    } else if (provider === 'gemini') {
      const effectiveGeminiKey = cleanKey || process.env.GEMINI_API_KEY;
      if (!effectiveGeminiKey) {
        res.status(400).json({
          success: false,
          errorType: 'MISSING_API_KEY',
          message: 'Google Gemini API 키가 입력되지 않았습니다. 상단 API Key 입력창에 Gemini API 키(AIza...)를 입력해 주세요.'
        });
        return;
      }
    } else if (provider === 'claude') {
      if (!cleanKey) {
        res.status(400).json({
          success: false,
          errorType: 'MISSING_API_KEY',
          message: 'Anthropic(Claude) API 키가 입력되지 않았습니다. 상단 API Key 입력창에 sk-ant-... 형태의 Claude API 키를 입력해 주세요.'
        });
        return;
      }
    } else {
      res.status(400).json({
        success: false,
        errorType: 'INVALID_PROVIDER',
        message: `지원되지 않는 AI 제공자입니다: ${provider}`
      });
      return;
    }

    const isKorEng = sopSpecs.isKorEngMixed || sopSpecs.isKoreanHipHopRnb;
    const isPureEnglish = sopSpecs.isEnglishOnly;

    const languageRule = isPureEnglish
      ? `[CRITICAL MANDATORY LANGUAGE REQUIREMENT: 100% ENGLISH]
The SOP explicitly commands 100% English production.
- Track titles (title) MUST be 100% English only. Never include Korean translations or bilingual parentheses.
- Style prompts (stylePrompt), section tags, and section guides MUST be 100% English (750 to 950 characters).
- ALL lyrics in fullLyrics MUST be written in 100% pure English (36 to 50 lines across all sections for a 3-minute song). Not a single Korean word or syllable.`
      : isKorEng
      ? `[CRITICAL MANDATORY SPECIFICATIONS: KOREAN R&B HIP-HOP (한영 혼용)]
The user's SOP explicitly specifies Korean R&B / Hip-Hop with Korean-English Code-switching (한영 혼용) for a complete 3-minute commercial playlist track. Follow these 4 strict field rules:

1. TRACK TITLE ("title"):
   - MUST BE A KOREAN TITLE ONLY (한국어 곡 제목), e.g. "공허", "비워내", "어스름", "새벽 세 시", "달 그림자", "잔향".
   - Follow the SOP's title rules (1단어, 2단어 조합, 또는 짧은 감성 구).
   - NEVER output an English title, and NEVER include English translations in parentheses!

2. STYLE PROMPT ("stylePrompt") - MANDATORY 750 to 950 CHARACTERS (AIM FOR 800-900 CHARACTERS):
   - MUST BE 100% IN ENGLISH, optimized for Suno / Udio prompt box.
   - ABSOLUTE PROHIBITION: NEVER output a short 1-2 sentence prompt (150-250 characters)!
   - You MUST write an expansive, detailed prompt of 750~950 characters covering ALL 6 DIMENSIONS:
     (1) Micro-Genre & Aesthetic: Atmospheric Korean R&B, chill trap hip-hop, trendy nocturnal aesthetic vibe, late-night bedroom lo-fi mood, dreamy and contemplative
     (2) Tempo, Rhythm & Groove: Exact BPM (e.g. 82 BPM), swinging half-time groove, lazy trap snare, rolling 32nd hi-hat triplets, laidback rimshots
     (3) Detailed Instruments & Sound Design: Vintage Rhodes electric piano with tremolo, detuned ambient analog synthesizer pads, deep gliding 808 sub-bass pulse, filtered vocal chop counter-melodies, subtle warm tape saturation and vinyl crackle
     (4) Vocal Texture & Performance: Specific age/gender and exact Suno keywords from the chosen 20-preset list (e.g. "early 20s female vocal, husky yet silky, slightly raspy soft vocal, sandy texture, breathy singing-rap delivery, airy falsetto ad-libs, intimate close-mic capture, dry lead vocal mix, raw vocal texture, front-and-center presence, minimal backing layer")
     (5) Spatial Mix & Mastering: Spacious stereo panorama, airy shimmering highs, warm tight low frequencies, modern clean playlist-ready master
     (6) Exclusions: Exclude: -orchestra, -string section, -bright brass, -edm drop, -fast rock tempo, -flat emotionless delivery

3. SECTION TAGS & GUIDES IN "fullLyrics":
   - Section headers and bracketed guides MUST BE IN ENGLISH:
     e.g. [Verse 1: Breathy singing rap over warm Rhodes and deep 808]
          [Pre-Chorus: Building up with trap hi-hats and deep 808 bass]
          [Chorus: Dreamy and rhythmic vocal hook with stacked falsetto]
          [Verse 2: Laidback syncopated melodic rap flow]
          [Instrumental Break: Dreamy synth solo with heavy reverb, 8 bars]
          [Chorus: Full melodic release with layered ad-libs]
          [Bridge: Stripped-down emotional turn, intimate whispered vocal]
          [Final Chorus: Climax hook, layered harmonies, high emotional ad-libs]
   ${sopSpecs.forbidsIntroOutro ? `- IMPORTANT TAG PROHIBITION: The SOP explicitly orders: "중요 주의사항: 곡 구조 생성 시 [Intro]와 [Outro] 태그는 절대 사용하지 마라. 1절([Verse 1])로 바로 시작하고 코러스([Final Chorus])로 바로 끝나도록 구성해라." You MUST NEVER include [Intro] or [Outro] tags for this theme! Start directly with [Verse 1] and finish with [Final Chorus]!` : ''}

4. SUNG LYRICS BODY IN "fullLyrics" - MANDATORY 36 TO 50 LINES (FULL 3-MINUTE SONG):
   - ABSOLUTE PROHIBITION: DO NOT OUTPUT A SHORT 3-SECTION / 12-LINE SNIPPET!
   - The song must be a COMPLETE 3-MINUTE TRACK (2:50~3:30) with AT LEAST 7 FULL SECTIONS:
     * [Verse 1: ...] (8 to 10 sung lines)
     * [Pre-Chorus: ...] (4 to 6 sung lines)
     * [Chorus: ...] (8 to 10 sung lines)
     * [Verse 2: ...] (8 to 10 sung lines)
     * [Pre-Chorus: ...] or [Instrumental Break: ...] (4 to 6 lines)
     * [Chorus: ...] (8 to 10 sung lines)
     * [Bridge: ...] (4 to 6 sung lines)
     * [Final Chorus: ...] (8 to 10 sung lines with emotional climax)
   - SUNG LYRICS MUST BE KOREAN-ENGLISH CODE-SWITCHING (한영 혼용: approx. 70~80% Korean, 20~30% English)!
   - Write natural Korean conversational lyrics with smooth English rhyme endings, English hook phrases, and trendy ad-libs (Yeah, Right, Uh-huh, Hm-hm).
   - NEVER output 100% English lyrics! Korean MUST be the primary language of the sung lyrics lines!`
      : `[LANGUAGE & LENGTH GUIDELINES]
- Track titles and sung lyrics must match the language of the SOP. If the SOP is in Korean, use Korean titles and lyrics.
- Style prompts MUST be comprehensive (750-950 characters) and written in 100% English for Suno/Udio.
- Full lyrics MUST be a complete 3-minute song (at least 36-50 lines across at least 7 structural sections).`;

    const systemPrompt = `You are "Plymaster", a world-class AI executive music producer and Suno/Udio prompt engineer.

${languageRule}

================================================================================
CRITICAL MASTER DIRECTIVE: 100% STRICT ADHERENCE TO THE USER'S PROVIDED SOP
================================================================================
The following SOP (Standard Operating Procedure) provided by the user is the ABSOLUTE, UNCOMPROMISING SPECIFICATION for this playlist project.
Do NOT use generic fallback assumptions, do NOT abbreviate, and do NOT replace the SOP rules with generic pop clichés:

[USER SOP SPECIFICATION START]
${theme.sop || ''}
[USER SOP SPECIFICATION END]

[PROJECT PARAMETERS]
- Theme Name: ${theme.name}
- Theme Category: ${theme.category || 'Music'}
- Target Track Count: ${effectiveTrackCount} track(s)
- Vocal Setup: ${vocalLabel}

================================================================================
STRICT EXECUTION REQUIREMENTS FOR EACH OUTPUT FIELD:
================================================================================

1. [SOUND IDENTITY & ACOUSTIC CRITERIA]
- Carefully inspect the SOP's Sound Identity, Acoustic Criteria, Genre, and Production Directives.
- EVERY TRACK's 'stylePrompt' MUST EXCLUSIVELY EMBED AND REFLECT THE EXACT SOUND CRITERIA OF THE CURRENT SOP:
  * If Korean R&B Hip-Hop: ambient synth pads, deep 808 bass, lazy trap snare, rolling hi-hats, reverb-heavy electric piano, chosen vocal texture preset keywords.
  * If Cinematic Movie OST Ballad: felt upright piano intro, soaring orchestra strings, building crescendo, emotional dynamic range.
  * If 1940s Shellac: 78 RPM record, antique wooden phonograph, surface crackle, warm midrange.
- CRITICAL ISOLATION RULE: NEVER inherit, copy, or mix in instruments, eras, vintage crackles, or sound textures from previous or other themes! Use ONLY what is requested in the current SOP!

2. [STYLE PROMPT SPECIFICATIONS (stylePrompt)]
- Write in English so it can be pasted directly into the Suno / Udio Style Prompt input field.
- MANDATORY LENGTH & DEPTH TARGET: MUST BE 750 to 950 characters (aim for 800–900 characters)!
- ABSOLUTE PROHIBITION: NEVER output a short 1-2 sentence prompt of 100-250 characters!
- In every track's stylePrompt, capture in full multi-sentence depth:
  (1) The exact acoustic sound identity, playback texture, and micro-genre defined in the current SOP
  (2) Specific instruments, arrangement progression, and rhythmic groove defined in the current SOP
  (3) Era and emotion-accurate vocal delivery, timbre, age/gender, and dynamics defined in the current SOP
  (4) Specific BPM tempo and energy flow defined in the current SOP
  (5) Spatial mix character, stereo panorama, and mastering texture
  (6) Negative exclusion keywords (Exclude: -...)

3. [LYRICS GUIDE RULES & SECTION STRUCTURE (fullLyrics)]
- MANDATORY FULL-SONG PRODUCTION LENGTH: Target 2:50 to 3:30 duration.
- ABSOLUTE PROHIBITION: DO NOT output a short 12-line snippet! Full lyrics MUST contain AT LEAST 36 to 50 sung lines across at least 7 distinct sections!
- Complete Section Progression:
  * [Verse 1: <detailed English guide>] (8 to 10 lines)
  * [Pre-Chorus: <detailed English guide>] (4 to 6 lines)
  * [Chorus: <detailed English guide>] (8 to 10 lines)
  * [Verse 2: <detailed English guide>] (8 to 10 lines)
  * [Pre-Chorus: <detailed English guide>] or [Instrumental Break: <detailed English guide>] (4 to 6 lines)
  * [Chorus: <detailed English guide>] (8 to 10 lines)
  * [Bridge: <detailed English guide>] (4 to 6 lines)
  * [Final Chorus: <detailed English guide>] (8 to 10 lines)
  ${sopSpecs.forbidsIntroOutro ? `* CRITICAL: Do NOT include [Intro] or [Outro] tags per the SOP instructions! Start directly with [Verse 1] and finish with [Final Chorus]!` : `* Include appropriate bracketed section tags.`}
- Guide prompts MUST be enclosed in square brackets [ ] to distinguish them from lyrics.
- Do NOT output narrative sentences without brackets (such as "A soft piano begins...").

4. [TRACK TITLES (title)]
- For 100% English SOPs: English titles only.
- For Korean / Korean R&B Hip-Hop SOPs: KOREAN TITLES ONLY (한국어 곡 제목, e.g. "공허", "새벽 세 시", "비워내", "어스름"). NEVER output English titles!
- NEVER output bilingual parentheses like "Title (제목)" or "제목 (Title)".

5. [META INFO (metaInfo)]
- For each track, output:
  - vocal: e.g. "20s female vocal, husky yet silky texture" (matching SOP)
  - genre: Genre strictly matching current SOP (e.g. "Atmospheric R&B, Chill Trap Hip-Hop")
  - mood: Core emotional role defined in current SOP (e.g. "Dreamy & Empty, Late Night Aesthetic")
  - bpm: e.g. "82 BPM" (matching SOP tempo)
  - targetLength: e.g. "3:05" (matching SOP length)

[OUTPUT FORMAT - PURE JSON ONLY]
Respond ONLY with a valid JSON object matching this schema (no markdown fences, no conversational text):
{
  "tracks": [
    {
      "trackNumber": 1,
      "title": ${isPureEnglish ? '"Single language English song title"' : '"한국어 곡 제목 (예: 공허, 새벽 세 시, 어스름)"'},
      "metaInfo": {
        "vocal": "Detailed vocal assignment matching SOP (age, gender, chosen texture preset keywords)",
        "genre": "Genre strictly matching current SOP",
        "mood": "Core emotional role",
        "bpm": "e.g. 82 BPM",
        "targetLength": "e.g. 3:05"
      },
      "mood": "Core emotion keyword",
      "stylePrompt": "Expansive, comprehensive 750 to 950 character 100% English Suno prompt embedding: (1) micro-genre & vibe, (2) tempo & groove (BPM), (3) detailed instrumentation & sound design, (4) vocal texture (age, gender, Suno keywords, vocal delivery), (5) spatial mix & mastering, (6) Exclude terms.",
      "fullLyrics": "Full 3-minute complete song lyrics of 36 to 50 lines spanning at least 7 distinct sections: [Verse 1: ...] (8-10 lines), [Pre-Chorus: ...] (4-6 lines), [Chorus: ...] (8-10 lines), [Verse 2: ...] (8-10 lines), [Pre-Chorus / Instrumental Break: ...], [Chorus: ...] (8-10 lines), [Bridge: ...] (4-6 lines), [Final Chorus: ...] (8-10 lines). Sung lines in natural Korean-English code-switching (75% Korean + 25% English). No [Intro] or [Outro] if forbidden by SOP."
    }
  ],
  "youtube": {
    "title": "Catchy YouTube playlist video title matching theme and concept",
    "description": "Full YouTube video description with tracklist timestamps and background story",
    "tracklist": "01. Title (00:00)...",
    "hashtags": "#Playlist #SunoAI",
    "thumbnailPrompt": "16:9 cinematic still matching current theme aesthetic, photorealistic 8k",
    "backgroundImagePrompt": "16:9 seamless loop video prompt matching current theme"
  }
}`;

    // 3. Provider execution

    // 3-1. Google Gemini
    if (provider === 'gemini') {
      const geminiKey = cleanKey || process.env.GEMINI_API_KEY;
      const ai = new GoogleGenAI({
        apiKey: geminiKey,
        httpOptions: {
          headers: { 'User-Agent': 'aistudio-build' }
        }
      });

      // Prefer fast and stable gemini-3.1-flash-lite as standard default
      let targetModel = model && (model.startsWith('gemini-') || model.includes('flash'))
        ? model
        : 'gemini-3.1-flash-lite';

      try {
        // Execute with timeout race (90 seconds max for large SOP generation)
        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('AI 응답 대기 시간 초과 (90초)')), 90000)
        );

        const standardSystemInstruction = 'You are an expert AI music playlist producer and Suno prompt engineer. Follow the user SOP with 100% strict compliance. CRITICAL MANDATORY LENGTH REQUIREMENTS: (1) Style prompts MUST be comprehensive, rich, and detailed (750 to 950 characters, aim for 800-900 characters; NEVER output short 1-line or 150-250 character summaries). (2) Full lyrics MUST be a complete ~3-minute song spanning at least 7 full sections (Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus/Break, Chorus, Bridge, Final Chorus) totaling at least 36 to 50 sung lines (NEVER output abbreviated 3-section or 12-line snippets). (3) When SOP specifies Korean R&B / Hip-Hop with 한영 혼용 (Kor-Eng Code-switching), track titles MUST be in Korean only, style prompts in 100% English, section tags in English brackets, and sung lyrics in natural Korean-English code-switching (Korean 75% + English 25%). (4) Strictly respect tag prohibitions such as omitting [Intro] and [Outro] when forbidden in the SOP. Respond strictly in valid JSON.';

        let geminiResponse;
        try {
          geminiResponse = await Promise.race([
            ai.models.generateContent({
              model: targetModel,
              contents: systemPrompt,
              config: {
                responseMimeType: 'application/json',
                maxOutputTokens: 8192,
                systemInstruction: standardSystemInstruction
              }
            }),
            timeoutPromise
          ]);
        } catch (firstErr: any) {
          // If gemini-3.8-flash or heavy model failed with 503/timeout, fallback to ultra-fast gemini-3.1-flash-lite
          if (targetModel !== 'gemini-3.1-flash-lite') {
            console.warn(`Gemini model ${targetModel} failed (${firstErr.message}), falling back to gemini-3.1-flash-lite`);
            targetModel = 'gemini-3.1-flash-lite';
            geminiResponse = await Promise.race([
              ai.models.generateContent({
                model: targetModel,
                contents: systemPrompt,
                config: {
                  responseMimeType: 'application/json',
                  maxOutputTokens: 8192,
                  systemInstruction: standardSystemInstruction
                }
              }),
              timeoutPromise
            ]);
          } else {
            throw firstErr;
          }
        }

        const rawText = geminiResponse.text?.trim() || '';
        const parsed = extractJsonFromText(rawText);
        if (parsed && Array.isArray(parsed.tracks)) {
          parsed.tracks = parsed.tracks.map((tr: any, idx: number) => ({
            ...tr,
            trackNumber: tr.trackNumber || (idx + 1),
            title: cleanTitleSingleLanguage(tr.title, sopSpecs.isEnglishOnly, sopSpecs.isKoreanTitle ? '새로운 트랙' : 'Track Title')
          }));
        }
        res.json({
          success: true,
          modelUsed: `Gemini - ${targetModel}`,
          isRealAi: true,
          result: parsed,
          note: 'Google Gemini 실시간 API 연동으로 SOP를 분석하여 완성되었습니다.'
        });
        return;
      } catch (geminiErr: any) {
        console.error('Gemini API Error:', geminiErr);
        res.status(400).json({
          success: false,
          errorType: 'GEMINI_API_ERROR',
          message: `Google Gemini API 처리 실패: ${geminiErr.message || '요청 처리 중 오류가 발생했습니다. Gemini API 키를 확인해 주세요.'}`
        });
        return;
      }
    }

    // 3-2. OpenAI GPT
    if (provider === 'gpt') {
      const requestedModel = (model || 'gpt-5.4-mini').trim();
      
      // OpenAI engine resolution:
      // Map preview/catalog aliases (gpt-5.4-mini, gpt-4.1-mini) directly to OpenAI's high-speed production mini engine ('gpt-4o-mini')
      // This eliminates the 404 delay and prevents hitting the request timeout.
      let targetEngine = requestedModel;
      const lower = requestedModel.toLowerCase();
      if (lower.includes('5.4') || lower.includes('4.1') || (lower.includes('mini') && !lower.includes('o1') && !lower.includes('o3'))) {
        targetEngine = 'gpt-4o-mini';
      } else if (lower === 'gpt-4o') {
        targetEngine = 'gpt-4o';
      } else if (lower.includes('turbo')) {
        targetEngine = 'gpt-4-turbo';
      }

      try {
        const fetchGpt = async (engine: string) => {
          return await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            signal: AbortSignal.timeout(90000),
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${cleanKey}`
            },
            body: JSON.stringify({
              model: engine,
              messages: [
                { role: 'system', content: 'You are an expert AI music playlist producer and Suno prompt engineer. Follow the user SOP with 100% strict compliance. CRITICAL MANDATORY LENGTH REQUIREMENTS: (1) Style prompts MUST be comprehensive, rich, and detailed (750 to 950 characters, aim for 800-900 characters; NEVER output short 1-line or 150-250 character summaries). (2) Full lyrics MUST be a complete ~3-minute song spanning at least 7 full sections (Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus/Break, Chorus, Bridge, Final Chorus) totaling at least 36 to 50 sung lines (NEVER output abbreviated 3-section or 12-line snippets). (3) When SOP specifies Korean R&B / Hip-Hop with 한영 혼용 (Kor-Eng Code-switching), track titles MUST be in Korean only, style prompts in 100% English, section tags in English brackets, and sung lyrics in natural Korean-English code-switching (Korean 75% + English 25%). (4) Strictly respect tag prohibitions such as omitting [Intro] and [Outro] when forbidden in the SOP. Respond strictly in valid JSON.' },
                { role: 'user', content: `${systemPrompt}\n\n[Creation Random Seed: ${Date.now()}_${Math.random().toString(36).substring(7)}]` }
              ],
              response_format: { type: 'json_object' },
              temperature: 0.7,
              max_tokens: 6000
            })
          });
        };

        let openaiRes = await fetchGpt(targetEngine);

        // Emergency fallback if custom engine not available (404)
        if (!openaiRes.ok && openaiRes.status === 404 && targetEngine !== 'gpt-4o-mini') {
          console.warn(`OpenAI model ${targetEngine} not available on this endpoint (404), falling back to gpt-4o-mini`);
          openaiRes = await fetchGpt('gpt-4o-mini');
        }

        if (!openaiRes.ok) {
          const errDetail = await openaiRes.text();
          let parsedErrMsg = '';
          try {
            const errObj = JSON.parse(errDetail);
            parsedErrMsg = errObj.error?.message || errDetail;
          } catch {
            parsedErrMsg = errDetail;
          }

          let friendlyMsg = `OpenAI API 오류 (${openaiRes.status})`;
          if (openaiRes.status === 401) {
            friendlyMsg = `OpenAI API 인증 실패 (401 Unauthorized): 입력하신 API 키가 올바르지 않거나 만료되었습니다. 상단 입력창에 유효한 OpenAI API 키(sk-...)를 입력해 주세요. (${parsedErrMsg})`;
          } else if (openaiRes.status === 429) {
            friendlyMsg = `OpenAI API 사용량 초과 (429 Insufficient Quota): OpenAI 계정에 잔여 크레딧이 부족하거나 호출 한도를 초과했습니다. OpenAI 계정(https://platform.openai.com/account/billing)의 크레딧 잔액을 확인해 주세요. (${parsedErrMsg})`;
          } else if (openaiRes.status === 404) {
            friendlyMsg = `OpenAI 모델 오류 (404): '${requestedModel}' 모델을 찾을 수 없습니다. (${parsedErrMsg})`;
          } else {
            friendlyMsg = `OpenAI API 호출 실패 (${openaiRes.status}): ${parsedErrMsg}`;
          }

          res.status(400).json({
            success: false,
            errorType: 'OPENAI_API_ERROR',
            status: openaiRes.status,
            message: friendlyMsg
          });
          return;
        }

        const gptData = await openaiRes.json();
        const content = gptData.choices?.[0]?.message?.content || '{}';
        const parsed = extractJsonFromText(content);
        if (parsed && Array.isArray(parsed.tracks)) {
          parsed.tracks = parsed.tracks.map((tr: any, idx: number) => ({
            ...tr,
            trackNumber: tr.trackNumber || (idx + 1),
            title: cleanTitleSingleLanguage(tr.title, sopSpecs.isEnglishOnly, sopSpecs.isKoreanTitle ? '새로운 트랙' : 'Track Title')
          }));
        }
        res.json({
          success: true,
          modelUsed: `GPT - ${requestedModel}`,
          isRealAi: true,
          result: parsed,
          note: `OpenAI API 실시간 연동 생성 완료 (${requestedModel} 엔진 매핑, SOP 100% 충실 반영)`
        });
        return;
      } catch (gptErr: any) {
        const isTimeout = gptErr.name === 'TimeoutError' || (gptErr.message && gptErr.message.includes('timeout'));
        res.status(400).json({
          success: false,
          errorType: 'OPENAI_ERROR',
          message: isTimeout
            ? 'OpenAI API 응답 대기 시간이 초과되었습니다 (90초). 대용량 SOP와 전체 가사 생성 작업이 길어지고 있습니다. 네트워크 상태를 확인하시거나 일시적으로 트랙 수를 줄여 시도해 주세요.'
            : `OpenAI 통신 오류: ${gptErr.message}`
        });
        return;
      }
    }

    // 3-3. Anthropic Claude
    if (provider === 'claude') {
      const claudeModel = model || 'claude-3-5-haiku-20241022';
      try {
        const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          signal: AbortSignal.timeout(90000),
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': cleanKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: claudeModel,
            max_tokens: 6000,
            system: 'You are an expert AI music playlist producer and Suno prompt engineer. Follow the user SOP with 100% strict compliance. CRITICAL MANDATORY LENGTH REQUIREMENTS: (1) Style prompts MUST be comprehensive, rich, and detailed (750 to 950 characters, aim for 800-900 characters; NEVER output short 1-line or 150-250 character summaries). (2) Full lyrics MUST be a complete ~3-minute song spanning at least 7 full sections (Verse 1, Pre-Chorus, Chorus, Verse 2, Pre-Chorus/Break, Chorus, Bridge, Final Chorus) totaling at least 36 to 50 sung lines (NEVER output abbreviated 3-section or 12-line snippets). (3) When SOP specifies Korean R&B / Hip-Hop with 한영 혼용 (Kor-Eng Code-switching), track titles MUST be in Korean only, style prompts in 100% English, section tags in English brackets, and sung lyrics in natural Korean-English code-switching (Korean 75% + English 25%). (4) Strictly respect tag prohibitions such as omitting [Intro] and [Outro] when forbidden in the SOP. Respond strictly in valid JSON.',
            messages: [
              { role: 'user', content: `${systemPrompt}\n\n반드시 JSON 형식으로만 응답하세요.\n\n[Creation Random Seed: ${Date.now()}_${Math.random().toString(36).substring(7)}]` }
            ]
          })
        });

        if (!claudeRes.ok) {
          const errDetail = await claudeRes.text();
          let parsedErrMsg = '';
          try {
            const errObj = JSON.parse(errDetail);
            parsedErrMsg = errObj.error?.message || errDetail;
          } catch {
            parsedErrMsg = errDetail;
          }
          res.status(400).json({
            success: false,
            errorType: 'CLAUDE_API_ERROR',
            status: claudeRes.status,
            message: `Anthropic Claude API 오류 (${claudeRes.status}): ${parsedErrMsg}`
          });
          return;
        }

        const claudeData = await claudeRes.json();
        const textBlock = claudeData.content?.[0]?.text || '';
        const parsed = extractJsonFromText(textBlock);
        if (parsed && Array.isArray(parsed.tracks)) {
          parsed.tracks = parsed.tracks.map((tr: any, idx: number) => ({
            ...tr,
            trackNumber: tr.trackNumber || (idx + 1),
            title: cleanTitleSingleLanguage(tr.title, sopSpecs.isEnglishOnly, sopSpecs.isKoreanTitle ? '새로운 트랙' : 'Track Title')
          }));
        }
        res.json({
          success: true,
          modelUsed: `Claude - ${claudeModel}`,
          isRealAi: true,
          result: parsed,
          note: 'Anthropic Claude 실시간 연동 생성 완료 (SOP 100% 충실 반영)'
        });
        return;
      } catch (claudeErr: any) {
        const isTimeout = claudeErr.name === 'TimeoutError' || (claudeErr.message && claudeErr.message.includes('timeout'));
        res.status(400).json({
          success: false,
          errorType: 'CLAUDE_ERROR',
          message: isTimeout
            ? 'Anthropic Claude API 응답 대기 시간이 초과되었습니다 (90초).'
            : `Claude 통신 오류: ${claudeErr.message}`
        });
        return;
      }
    }
  } catch (outerErr: any) {
    console.error('Unhandled Server Error in /api/generate:', outerErr);
    res.status(500).json({
      success: false,
      errorType: 'INTERNAL_SERVER_ERROR',
      message: `서버 내부 처리 중 오류가 발생했습니다: ${outerErr.message || '알 수 없는 오류'}`
    });
    return;
  }
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

  let trackTemplates: Array<{ title: string; mood: string; style: string; lyrics: string; metaInfo?: any }> = [];

  if (sopSpecs.isShellacVintage) {
    trackTemplates = [
      {
        title: 'Dancing in the Amber Haze',
        mood: 'Type B worn shellac phonograph intimacy, nostalgic 1940s romance with warm analog crackle',
        metaInfo: {
          vocal: 'Warm expressive female lead vocal, emotive 1940s delivery',
          genre: '1940s Shellac Vintage Pop Ballad',
          mood: 'Bittersweet nostalgia, quiet longing',
          bpm: '78 BPM',
          targetLength: '3:05'
        },
        style: `1940s shellac 78 RPM record aesthetic, played on an antique wooden cabinet phonograph, authentic mechanical needle rotation hiss, prominent yet musical surface crackle and patina, narrow frequency bandwidth, warm thick saturated midrange, softly rolled-off high frequencies, restrained low bass, vintage mono-centric analog tube compression. Muted trumpet solos with velvet Harmon mute, gentle felt upright piano arpeggios, warm double bass walking softly, brushed snare rhythm, expressive sincere female lead vocal with breathy vintage vibrato, nostalgic bittersweet romance, 78 bpm`,
        lyrics: `[Intro]\n[Solo felt upright piano chords with authentic 78 RPM shellac surface crackle and warm needle hiss, slow intimate tempo]\n\n[Verse 1]\n[Intimate breathy female vocal, sparse piano accompaniment, audible mechanical needle noise]\nStreetlights flickering through the smoky glass\nWatching all the gentle silhouettes pass\nI hold the letter you folded in spring\nListening to what the old records sing\n\n[Pre-Chorus]\n[Gentle swell of muted trumpet with velvet Harmon mute, rising nostalgic tension]\nThe needle turns around the fading groove\nThere is no sorrow that this song can't move\nThe dust begins to rise, the ballroom sighs\nI see tomorrow looking through your eyes\n\n[Chorus]\n[Rich emotional female lead vocal with warm vintage vibrato, sweet memorable melodic hook]\nDancing in the amber haze of yesterday's light\nHolding on to every shadow in the quiet night\nWhen the shellac turns slow and the melodies part\nI will keep your devotion right here in my heart!\nLet the crackle play on till the morning comes through\nEvery song in the dark was a whisper to you!\n\n[Verse 2]\n[Subtle double bass walking softly, brushed snare rhythm enters with gentle swing]\nA pocket watch ticking on the wooden stand\nRemembering the warmth of your trembling hand\nTwo coffee cups fading on an empty tray\nCounting the hours till the break of day\n\n[Bridge]\n[Warm analog distortion swells, emotive trumpet and upright piano crescendo]\nTime cannot steal what the melody knows!\nBlooming like a secret where the ivy grows!\nNo winter can silence the notes that we swore\nWe will dance like we never danced before!\n\n[Final Chorus]\n[Cathartic dynamic climax with full vintage swing arrangement, soaring heartfelt vocal resolution]\nDancing in the amber haze of yesterday's light\nHolding on to every shadow in the quiet night\nWhen the shellac turns slow and the melodies part\nI will keep your devotion right here in my heart!\n\n[Outro]\n[Upright piano chords slowly dying down, solitary trumpet sigh, soft needle run-out groove hiss to silence]\nJust the record turning.\n[End]`
      },
      {
        title: 'Whispers from the Velvet Gramophone',
        mood: 'Antique wooden phonograph charm, smoky jazz lounge nostalgia',
        metaInfo: {
          vocal: 'Smoky emotive female vocal, delicate breath control',
          genre: '1940s Shellac Jazz Ballad',
          mood: 'Poignant remembrance, tender romantic warmth',
          bpm: '76 BPM',
          targetLength: '3:10'
        },
        style: `Authentic 1940s shellac 78 RPM mono sound identity, antique oak phonograph cabinet resonance, audible needle friction and surface crackle, narrow bandpass warmth, rolled-off digital highs, thick tube midrange saturation, vintage optical limiter character. Smoky female vocal delivery, delicate acoustic upright piano, soft clarinet counter-melodies, brushed snare shuffle, acoustic archtop guitar comping, romantic midnight nostalgia, 76 bpm`,
        lyrics: `[Intro]\n[Acoustic clarinet solo floating over antique phonograph crackle and mellow piano chords]\n\n[Verse 1]\n[Tender breathy vocal delivery, acoustic archtop guitar and soft piano accompaniment]\nMidnight falling softly on the avenue\nPainting every shadow in a shade of blue\nI wind the spring and let the platter spin\nWaiting for the quiet magic to begin\n\n[Pre-Chorus]\n[Soft clarinet harmony weaves in, subtle rise in emotional dynamic]\nThe needle finds the line we used to know\nCarrying the beauty from so long ago\n\n[Chorus]\n[Warm emotive vocal hook, rich midrange resonance with vintage analog compression]\nWhispers from the velvet gramophone playing slow\nTelling all the secrets that nobody else could know\nEven when the city sleeps and lights burn low\nYou will be the only melody I know!\n\n[Bridge]\n[Clarinet counter-melody ascends, expressive piano arpeggio]\nSpin the black shellac, let the memories stay\nNothing that was beautiful can ever fade away!\n\n[Chorus]\n[Full expressive vocal reprise, warm brass warmth, memorable chorus hook]\nWhispers from the velvet gramophone playing slow\nTelling all the secrets that nobody else could know\nEven when the city sleeps and lights burn low\nYou will be the only melody I know!\n\n[Outro]\n[Soft clarinet note trailing into slow mechanical needle hiss and runout groove]\nGoodnight, my love.\n[End]`
      }
    ];
  } else if (sopSpecs.isEnglishOnly && sopSpecs.isCinematic) {
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
  } else if (sopSpecs.isKoreanHipHopRnb || sopSpecs.isKorEngMixed) {
    trackTemplates = [
      {
        title: '어스름',
        mood: '황혼이 내려앉는 도시의 어스름과 늦은 밤 감각적인 칠(Chill)한 감성',
        metaInfo: {
          vocal: '20대 중반 여성 보컬, husky yet silky texture, slightly raspy soft vocal, sandy texture',
          genre: 'Atmospheric Korean R&B, Chill Trap Hip-Hop',
          mood: 'Dreamy & Bittersweet, Late Night Aesthetic',
          bpm: '82 BPM',
          targetLength: '3:08'
        },
        style: `Atmospheric Korean R&B, chill nocturnal trap hip-hop, trendy Instagram reels aesthetic mood, late-night bedroom lo-fi vibe, bittersweet and dreamy contemplation, warm vintage Rhodes electric piano with gentle tremolo, detuned ambient analog synthesizer pads, deep gliding 808 sub-bass pulse with pitch glide, crisp rimshot and lazy trap snare, rolling 32nd hi-hat triplets, subtle tape saturation and vinyl dust crackle, filtered airy vocal chops in background, 20s female vocal, husky yet silky, slightly raspy soft vocal, sandy texture, breathy singing-rap delivery, tender falsetto runs, intimate close-mic capture, dry lead vocal mix, raw vocal texture, front-and-center presence, minimal backing layer, spacious stereo imaging, airy shimmering highs, warm tight low frequencies, modern clean playlist master, 82 bpm, -orchestra, -bright brass, -edm drop, -fast rock tempo, -flat emotionless delivery`,
        lyrics: `[Verse 1: Breathy sing-rap over warm Rhodes and deep 808 pulse]
푸른 어스름이 내려앉는 창문가
멍하니 서서 지켜보는 fading skyline
오늘 하루도 참 바쁘게 지나갔는데
왜 내 맘은 아직 그 자리에 멈춰 서 있는지
Yeah, scrolling through our old pictures again
지우지 못한 대화들이 귓가에 맴돌아
아무 일도 없던 척 넘겨보려 해도
차가운 한숨만 하얗게 번져가, alright

[Pre-Chorus: Rising vocal tension with rolling 32nd hi-hats]
어둠이 천천히 도시를 삼켜갈 때
숨겨둔 외로움이 자꾸만 새어나와
너의 기억인지 아니면 미련인 건지
Still caught up inside this dusk, right?

[Chorus: Dreamy and rhythmic vocal hook with stacked falsetto]
어스름 속에 번져가는 너의 잔향
Can't let you fade away in the dark, yeah
홀로 남겨진 이 방을 가득 채우는 vibe
잡힐 듯 잡히지 않는 silent night
Tell me why the shadows feel so deep
너 없는 이 어스름 끝에서 I still seek
다시 돌아갈 수 없는 그 순간들을 찾아
Falling into memories, falling into you

[Verse 2: Laidback conversational melodic flow with subtle ad-libs]
가로등 불빛이 하나둘씩 깜빡거려
어색한 침묵 사이로 흐르는 radio
너와 즐겨 듣던 익숙한 track이 흐르면
I swear I'm losing all my focus again
Yeah, 기억나? 한강 변을 거닐던 새벽
차가운 손을 잡아주던 너의 온기
이제는 흐릿한 필터 속의 장면처럼
손 틈새로 흩어져버린 blue haze, hm-hm

[Instrumental Break: Reverb-soaked electric piano solo and deep 808 glide, 8 bars]

[Chorus: Dreamy and rhythmic vocal hook with layered ad-libs]
어스름 속에 번져가는 너의 잔향
Can't let you fade away in the dark, yeah
홀로 남겨진 이 방을 가득 채우는 vibe
잡힐 듯 잡히지 않는 silent night
Tell me why the shadows feel so deep
너 없는 이 어스름 끝에서 I still seek
다시 돌아갈 수 없는 그 순간들을 찾아
Falling into memories, falling into you

[Bridge: Stripped-down emotional turn, intimate whispered delivery]
시간을 돌릴 수만 있다면
우리가 어긋나기 전 그 계절로
Don't say it's over, don't say goodbye
희미해진 달빛 아래 널 불러봐
한 번만 더 내 곁에 머물러줄래

[Final Chorus: Full emotional climax, layered harmonies and soaring ad-libs]
어스름 속에 번져가는 너의 잔향
Can't let you fade away in the dark, yeah
홀로 남겨진 이 방을 가득 채우는 vibe
잡힐 듯 잡히지 않는 silent night
Tell me why the shadows feel so deep
너 없는 이 어스름 끝에서 I still seek
영원히 끝나지 않을 노래처럼
I'll remember you in this dusk forever`
      },
      {
        title: '공허',
        mood: '채워지지 않는 일상의 공허함과 늦은 밤 몽환적인 칠(Chill)한 감성',
        metaInfo: {
          vocal: 'early 20s male vocal, colorless ethereal translucent breathy tone, androgynous falsetto',
          genre: 'Atmospheric Korean R&B, Chill Trap Hip-Hop',
          mood: 'Dreamy & Empty, Late Night Aesthetic',
          bpm: '82 BPM',
          targetLength: '3:05'
        },
        style: `Atmospheric Korean R&B, chill nocturnal trap hip-hop, trendy Instagram aesthetic vibe, late-night bedroom lo-fi mood, dreamy and empty contemplation, ambient lush analog synth pads, deep gliding 808 sub-bass with pitch bends, swinging lazy trap hi-hats, reverb-heavy vintage Rhodes electric piano, subtle vinyl crackle and warm tape saturation, early 20s male vocal, colorless, ethereal, translucent breathy tone, androgynous falsetto runs, intimate close-mic delivery, clear vocal presence, dry lead vocal mix, raw vocal texture, front-and-center lead vocal placement, minimal backing harmony layer, spacious and modern stereophonic mix, punchy low-end headroom, sparkling airy high-frequency shimmer, 82 bpm, -orchestra, -string section, -bright brass, -edm drop, -fast rock tempo, -flat emotionless delivery, -autotune artifact`,
        lyrics: `[Verse 1: Breathy singing rap over atmospheric synth and soft 808]
Love-love the stars, love-love the moon
별 다를 것 없이 흘러가는 afternoon
똑같은 방, 똑같은 침대에서
멍하니 올려다보는 천장까지
Yeah, 왜 별다른 이유도 없이
가슴 한구석이 텅 빈 건지
I keep looking at my screen, scrolling all night
아무 의미 없는 피드만 넘기지, right?

[Pre-Chorus: Building up with trap hi-hats and deep 808 bass]
시간은 참 잘만 흘러가는데
내 하루는 어딘가 비어 있는 듯해
너의 빈자린지, 아니면 내 욕심인지
Still don't know what I'm looking for
차오르는 밤의 공기 속에 나를 맡겨

[Chorus: Dreamy and rhythmic vocal hook with stacked falsetto]
채워지지 않는 네모난 빈칸
Always leaving me feeling so blank, yeah
불 꺼진 방 안에 덩그러니 남아
혼자서 삼키는 차가운 밤의 잔향
Can somebody tell me why it hurts so slow?
채워도 채워지지 않는 feeling hollow
흩어지는 연기처럼 사라져버린 vibe
I'm just drifting all through the night

[Verse 2: Laidback syncopated melodic rap flow]
벽에 걸린 시계 소리만 유난히 tick-tock
지워버린 메시지 창을 다시 또 click, stop
괜히 쿨한 척 넘겨보려 해도
거울 속에 비친 표정은 그대로
Yeah, nobody knows how it feels inside
화려한 필터 뒤에 숨겨둔 my mind
너 없는 밤거릴 혼자 걷다 보면
또다시 차가운 바람만 스쳐가, hm-hm

[Instrumental Break: Dreamy synth solo with heavy reverb and deep 808 glide, 8 bars]

[Chorus: Dreamy and rhythmic vocal hook with emotional ad-libs]
채워지지 않는 네모난 빈칸
Always leaving me feeling so blank, yeah
불 꺼진 방 안에 덩그러니 남아
혼자서 삼키는 차가운 밤의 잔향
Can somebody tell me why it hurts so slow?
채워도 채워지지 않는 feeling hollow
흩어지는 연기처럼 사라져버린 vibe
I'm just drifting all through the night

[Bridge: Hushed vulnerable sing-rap with ambient pad]
텅 빈 마음의 빈자릴 뭘로 채워야 할지
달빛마저 외면하는 차가운 도시
I just wanna be alright, I just wanna let it fly
어두운 터널 끝 희미한 불빛을 따라
한 번 더 나를 찾아가 볼게

[Final Chorus: Full melodic release with stacked ad-libs and harmonies]
채워지지 않는 네모난 빈칸
Always leaving me feeling so blank, yeah
불 꺼진 방 안에 덩그러니 남아
혼자서 삼키는 차가운 밤의 잔향
Can somebody tell me why it hurts so slow?
채워도 채워지지 않는 feeling hollow
새벽이 오면 조금은 나아질까
Still singing this midnight lullaby`
      },
      {
        title: '새벽 세 시',
        mood: '은밀한 관계의 텐션과 늦은 밤 드라이브의 몽환적인 그루브',
        metaInfo: {
          vocal: 'mid 20s male vocal, slurred drunken melodrama, syrupy thick nasal tone, heavy sticky voice',
          genre: 'Late-Night Chill Trap R&B',
          mood: 'Subtle Romantic Tension, Sensual Groove',
          bpm: '85 BPM',
          targetLength: '3:12'
        },
        style: `Chill trap Korean R&B, late-night midnight highway drive aesthetic, subtle romantic tension, nocturnal bedroom groove, deep sub 808 pulse with extended gliding 808 bass, warm vintage Rhodes chords drenched in stereo chorus, filtered pitch-shifted vocal chop counterpoints, lazy laidback trap snare, swung rolling hi-hat groove, mid 20s male vocal, slurred drunken melodrama, syrupy thick nasal tone, heavy and sticky voice delivery, clear vocal presence, dry vocal mix, raw authentic texture, front-and-center lead vocal placement, modern Korean R&B studio production texture, wide spatial panorama, punchy compressed bassline, silky analog high-end sheen, 85 bpm, -orchestra, -bright brass, -edm drop, -fast rock tempo, -monotone delivery, -screaming vocal`,
        lyrics: `[Verse 1: Murmured sing-rap over warm Rhodes and deep 808]
새벽 세 시, 차창 밖은 온통 푸른빛
가라앉은 공기 속에 울리는 beat
너는 조수석에 기대어 고갤 돌려
미묘한 눈빛으로 날 빤히 쳐다봐
Yeah, unspoken words hanging in the air
우리 둘 사이 흐르는 strange tension, right?
신호등은 깜빡이고 우린 말이 없어
핸들을 잡은 손끝이 조금 떨려와

[Pre-Chorus: Tightening vocal flow with rolling hi-hats]
어디로 가야 할지 묻지 마
오늘 밤은 그냥 흘러가는 대로 가
Don't say a word, just feel this ride
아슬아슬한 이 텐션 속에 빠져들어
너와 나의 거리가 좁혀지는 시간

[Chorus: Sensual melodic hook with smooth vocal layering]
Late night 3 AM, we're drifting away
어둠 속에 번지는 subtle grey
아무도 모르게 나눈 은밀한 vibe
이 밤이 끝나지 않길 원해, just you and I
Catching this feeling, nowhere to hide
달빛 아래 번져가는 midnight ride
너의 숨결이 닿을 때마다
I'm losing my mind, caught in your tide

[Verse 2: Conversational casual delivery with ad-libs]
라디오에선 익숙한 melody가 나와
괜히 볼륨을 키워 어색함을 지워
너의 향기가 시트 가득 스밀 때
I swear I'm losing all my control
Yeah, 툭 던진 한마디에 심장이 뛰어
"오늘 밤은 조금 더 같이 있고 싶어"
너의 나직한 목소리가 번져올 때
우린 이미 같은 꿈속으로 들어가

[Instrumental Break: Reverb-soaked electric piano and 808 groove, 8 bars]

[Chorus: Sensual melodic hook with smooth vocal layering]
Late night 3 AM, we're drifting away
어둠 속에 번지는 subtle grey
아무도 모르게 나눈 은밀한 vibe
이 밤이 끝나지 않길 원해, just you and I
Catching this feeling, nowhere to hide
달빛 아래 번져가는 midnight ride
너의 숨결이 닿을 때마다
I'm losing my mind, caught in your tide

[Bridge: Low intimate whisper over filtered sub-bass]
붉은 신호등에 멈춰선 우리
시선이 마주치는 아찔한 순간
You know what I mean, no need to speak
이 밤의 끝을 함께할 유일한 사람
바로 너라는 걸 아니까

[Final Chorus: Full melodic release with layered ad-libs and high harmonies]
Late night 3 AM, we're drifting away
어둠 속에 번지는 subtle grey
아무도 모르게 나눈 은밀한 vibe
이 밤이 끝나지 않길 원해, just you and I
Catching this feeling, nowhere to hide
달빛 아래 번져가는 midnight ride
아침이 와도 깨어나지 않을
Our unforgettable late night drive`
      }
    ];
  } else {
    // Dynamic extraction from user SOP for custom registered themes
    const rawSop = theme.sop || '';
    const styleMatch = rawSop.match(/(?:Style(?:\s+of\s+Music)?(?:\s+Prompt)?(?:\s+지침)?\s*[:]\s*['"]?)([^'"\n\r]+)/i);
    const customStyle = styleMatch && styleMatch[1].trim()
      ? styleMatch[1].trim()
      : `${theme.category || theme.name}, emotive instrumentation, ${vocalTag}, 92 bpm, faithful to SOP`;

    const bpmMatch = rawSop.match(/(\d{2,3})\s*(?:~|-|\/)?\s*(\d{2,3})?\s*bpm/i);
    const customBpm = bpmMatch ? `${bpmMatch[1]} BPM` : '92 BPM';

    trackTemplates = [
      {
        title: sopSpecs.isEnglishOnly ? 'Whispers in the Silence' : `${theme.name} - 1번 트랙`,
        mood: `${theme.name}의 고유한 사운드 정체성과 감성`,
        metaInfo: {
          vocal: vocal === 'female' ? 'Female Lead Vocal' : vocal === 'male' ? 'Male Lead Vocal' : 'Vocal',
          genre: theme.category || theme.name,
          mood: 'Emotional Atmosphere',
          bpm: customBpm,
          targetLength: '3:15'
        },
        style: customStyle,
        lyrics: `[Intro]\n[Opening instrumental motif according to SOP]\n\n[Verse 1]\n[Tender vocal delivery, subtle acoustic accompaniment]\nMoving through the quiet light of dawn\nA melody that keeps on holding on\n\n[Chorus]\n[Memorable vocal hook, full dynamic resolution]\nDeep inside where music learns to soar\nThis is the song we have been waiting for!\n\n[Outro]\n[Gentle fade to silence]\n[End]`
      },
      {
        title: sopSpecs.isEnglishOnly ? 'Echoes Across the Horizon' : `${theme.name} - 2번 트랙`,
        mood: `${theme.name}의 서정적인 감성과 멜로디`,
        metaInfo: {
          vocal: vocal === 'female' ? 'Female Lead Vocal' : vocal === 'male' ? 'Male Lead Vocal' : 'Vocal',
          genre: theme.category || theme.name,
          mood: 'Warm Acoustic Vibe',
          bpm: customBpm,
          targetLength: '3:05'
        },
        style: customStyle,
        lyrics: `[Intro]\n[Acoustic instrumental intro]\n\n[Verse 1]\n[Expressive vocal delivery]\nFootsteps along an open road\nCarrying all the love we know\n\n[Chorus]\n[Harmonic climax, rich instrumentation]\nAcross the skies, into the dawn\nA timeless melody playing on!\n\n[Outro]\n[Warm closing fade]\n[End]`
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
      title: cleanTitleSingleLanguage(rawTitle, sopSpecs.isEnglishOnly, sopSpecs.isKoreanTitle ? '새로운 트랙' : 'Track Title'),
      mood: template.mood,
      metaInfo: template.metaInfo,
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

  const youtubeTitle = sopSpecs.isShellacVintage
    ? `[PLAYLIST] 1940s Vintage Shellac 78 RPM Phonograph | Worn Record Memories for Relaxing & Sleep 📻 ☕️`
    : sopSpecs.isKoreanHipHopRnb
    ? `[PLAYLIST] ${theme.name} | 늦은 밤 감각적인 새벽 드라이브 느좋 칠(Chill) 알앤비 힙합 🌙 🎧`
    : sopSpecs.isEnglishOnly
    ? `[PLAYLIST] ${theme.name} | Emotional Ballads for Deep Focus & Heartbreak 🎬 ☕️`
    : `[PLAYLIST] ${theme.name} | 감각적인 하루를 선물하는 감성 플레이리스트 🎬 ☕️`;

  const youtubeDesc = sopSpecs.isShellacVintage
    ? `Travel back in time to the 1940s. Authentic Type B worn and gritty shellac 78 RPM phonograph recordings with warm needle crackle, nostalgic melodies, and sincere vintage vocals.\n\n[🎧 Tracklist]\n${tracklistText}\n\n[📻 Sound Identity]\n- 1940s shellac 78 RPM record played on an antique wooden phonograph\n- Narrow frequency band, surface crackles & mechanical needle noise\n- Thick warm midrange & analog tube saturation\n\n#PlymasterFactory #Vintage1940s #ShellacRecord #78RPM #Phonograph #SunoAI`
    : sopSpecs.isKoreanHipHopRnb
    ? `감각적인 늦은 밤, 몽환적인 칠(Chill) 트랩 비트와 세련된 한영 혼용 보컬/싱랩의 향연.\n${theme.name} 플레이리스트와 함께 새벽 드라이브의 미묘한 텐션과 여유를 즐겨보세요.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #인스타감성 #느좋 #알앤비힙합 #한국알앤비 #새벽드라이브 #SunoAI`
    : sopSpecs.isEnglishOnly
    ? `Immerse yourself in a musical journey. Crafted precisely according to your SOP specifications.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #Playlist #SunoAI`
    : `지친 마음에 깊은 울림을 전하는 ${theme.name} 플레이리스트입니다.\n입력된 SOP 지침을 바탕으로 기획된 감성 사운드로 편안한 힐링과 몰입을 즐겨보세요.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #플레이리스트 #음악추천 #BGM #감성음악`;

  const hashtags = sopSpecs.isShellacVintage
    ? '#Vintage1940s #ShellacPhonograph #78RPM #VintagePop #RetroBallad #SunoAI'
    : sopSpecs.isKoreanHipHopRnb
    ? '#인스타감성 #느좋 #알앤비 #한국힙합 #칠트랩 #새벽음악 #SunoAI'
    : sopSpecs.isEnglishOnly
    ? '#Playlist #MusicProduction #SunoAI #AudioCards'
    : '#플레이리스트 #음악추천 #감성음악 #SunoAI';

  const thumbnailPrompt = sopSpecs.isShellacVintage
    ? '1940s antique wooden phonograph playing a spinning shellac 78 RPM record on a polished mahogany table, soft warm amber incandescent glow, atmospheric dust motes floating in light rays, vintage sepia tone, cinematic 16:9 photorealistic 8k'
    : sopSpecs.isKoreanHipHopRnb
    ? '16:9 aesthetic Korean late night mood, rainy city car window reflections, neon bokeh, moody cinema lighting, 35mm film grain, photorealistic 8k'
    : 'Cinematic 16:9 movie still, melancholic beautiful scene, soft warm golden hour light through sheer curtain, 35mm film aesthetic, photorealistic, 8k resolution --ar 16:9';

  const backgroundImagePrompt = sopSpecs.isShellacVintage
    ? '16:9 seamless vintage room loop: antique 1940s gramophone with brass horn, gentle spinning record, warm amber fireplace glow, slow cozy dust particles, relaxing vintage aesthetic'
    : sopSpecs.isKoreanHipHopRnb
    ? '16:9 seamless loop: late night neon city lights reflecting through car windshield, slow ambient motion, moody aesthetic atmosphere'
    : '16:9 seamless film loop background: warm vintage cinema aesthetic, slow ambient light rays, soft floating dust particles, emotional cozy atmosphere';

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

// Error handling middleware for all API routes to ensure pure JSON responses
app.use('/api', (err: any, req: Request, res: Response, next: any) => {
  console.error('[API Global Error Handler]', err);
  if (res.headersSent) {
    return next(err);
  }
  res.status(err.status || 500).json({
    success: false,
    errorType: err.name || 'INTERNAL_SERVER_ERROR',
    message: err.message || '서버 처리 중 오류가 발생했습니다.'
  });
});

// Start Server & mount Vite
async function startServer() {
  if (process.env.NODE_ENV === 'production' || process.env.VERCEL) {
    app.use(express.static('dist'));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
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

const isMainModule = Boolean(process.argv[1] && (process.argv[1].endsWith('server.ts') || process.argv[1].endsWith('server.js')));

if (isMainModule && !process.env.VERCEL) {
  startServer();
}

export default app;
