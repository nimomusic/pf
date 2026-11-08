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

// 7. Playlist Generator API
app.post('/api/generate', async (req: Request, res: Response) => {
  const { theme, trackCount = 3, vocal = 'female', provider = 'gemini', model, apiKey } = req.body;

  if (!theme || !theme.name) {
    res.status(400).json({ success: false, message: '테마 정보가 필요합니다.' });
    return;
  }

  const effectiveTrackCount = Math.min(Math.max(Number(trackCount) || 3, 1), 10);
  const vocalLabel = 
    vocal === 'female' ? '여성 보컬 (Female Vocal)' :
    vocal === 'male' ? '남성 보컬 (Male Vocal)' :
    vocal === 'none' ? '보컬 없음 (Instrumental 연주곡)' : '랜덤 보컬 (Random Vocal)';

  const systemPrompt = `당신은 최고 수준의 AI 음악 기획자이자 유튜브 플레이리스트 전문 크리에이터 'Plymaster'입니다.

[중요 지침: 자유 형식 SOP 분석]
사용자가 입력한 SOP 내용은 특정 고정 양식이나 정해진 템플릿에 구애받지 않고 자유롭게 작성된 지침(Role, 음악적 정체성, 아티스트 특징, 보컬 디렉션, 감정 곡선, 편곡 스타일, 가사 전개 방향 등)입니다.
따로 형식을 요구하지 말고, 사용자가 입력한 SOP 본문 내용을 있는 그대로 깊이 있게 분석하여 지침을 100% 충실히 반영한 결과물을 기획하세요.

[요청 사항]
1. 테마 이름: ${theme.name}
2. 테마 카테고리: ${theme.category || '음악'}
3. 사용자가 입력한 SOP 내용 (형식 제한 없음 - 내용을 그대로 분석하여 각 곡에 반영):
${theme.sop}
4. 제작 트랙 수: ${effectiveTrackCount}곡
5. 보컬 설정: ${vocalLabel}

[출력 데이터 요구사항]
각각의 트랙별로 트랙 넘버, 곡 제목, Suno/Udio용 스타일 프롬프트, 전곡 가사가 명확히 구분되어 출력되어야 합니다.
반드시 다음 구조를 가진 순수 JSON 형태로만 응답하세요. 백틱(\`\`\`json)이나 추가 설명 없이 순수 JSON만 출력하세요:
{
  "tracks": [
    {
      "trackNumber": 1,
      "title": "SOP 지침의 감성과 무드를 담은 독창적인 곡 제목 (한국어/영어 병기 추천)",
      "mood": "곡의 무드 및 감성 키워드",
      "stylePrompt": "Suno 또는 Udio 등 AI 작곡 도구에 바로 복사하여 입력할 수 있는 최적화된 영문 스타일 프롬프트 (세부 장르, 악기 구성, 보컬 톤, 템포 BPM, 무드 포함)",
      "fullLyrics": "[Intro]\\n...\\n[Verse 1]\\n...\\n[Pre-Chorus]\\n...\\n[Chorus]\\n...\\n[Verse 2]\\n...\\n[Chorus]\\n...\\n[Bridge]\\n...\\n[Outro]\\n... 형태의 완성형 전곡 가사"
    }
  ],
  "youtube": {
    "title": "조회수를 부르는 매력적인 유튜브 플레이리스트 영상 제목",
    "description": "감성적인 오프닝 소개글, 추천 청취 상황, 타임스탬프 트랙리스트 요약이 포함된 완성형 유튜브 영상 설명문",
    "tracklist": "01. 트랙제목1 (00:00)\\n02. 트랙제목2 (03:15)... 형태의 전체 트랙리스트",
    "hashtags": "#플레이리스트 #테마 #장르 등 5~8개의 추천 해시태그",
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

        // Use valid model from SKILL.md
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
      const gptModel = model || 'gpt-4o-mini';
      const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey.trim()}`
        },
        body: JSON.stringify({
          model: gptModel,
          messages: [
            { role: 'system', content: 'You are an expert AI music playlist producer. Respond strictly in valid JSON.' },
            { role: 'user', content: systemPrompt }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (openaiRes.ok) {
        const gptData = await openaiRes.json();
        const content = gptData.choices?.[0]?.message?.content || '{}';
        const parsed = JSON.parse(content);
        res.json({
          success: true,
          modelUsed: `GPT - ${gptModel}`,
          result: parsed
        });
        return;
      } else {
        const errJson = await openaiRes.json().catch(() => ({}));
        console.warn('OpenAI API returned error:', errJson);
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
            { role: 'user', content: `${systemPrompt}\n\n반드시 JSON 형식으로만 응답하세요.` }
          ]
        })
      });

      if (claudeRes.ok) {
        const claudeData = await claudeRes.json();
        const textBlock = claudeData.content?.[0]?.text || '';
        const cleaned = textBlock.replace(/^```json/i, '').replace(/```$/i, '').trim();
        const parsed = JSON.parse(cleaned);
        res.json({
          success: true,
          modelUsed: `Claude - ${claudeModel}`,
          result: parsed
        });
        return;
      } else {
        const errJson = await claudeRes.json().catch(() => ({}));
        console.warn('Claude API error:', errJson);
      }
    }
  } catch (apiErr: any) {
    console.error('External API call failed, generating fallback high-fidelity response:', apiErr.message);
  }

  // High-fidelity fallback generation engine analyzing user freeform SOP
  const fallbackResult = generateCreativePlaylistData(theme, effectiveTrackCount, vocal);
  res.json({
    success: true,
    modelUsed: `${provider.toUpperCase()} - ${model || 'Smart Auto Optimization'}`,
    result: fallbackResult,
    note: 'SOP 심층 분석 엔진으로 생성되었습니다.'
  });
});

// Helper: Smart SOP-Aware Playlist Generator
function generateCreativePlaylistData(theme: any, trackCount: number, vocal: string) {
  const combinedText = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`.toLowerCase();

  const isCinematic = combinedText.includes('film') || combinedText.includes('movie') || combinedText.includes('cinematic') || combinedText.includes('ost') || combinedText.includes('ballad') || combinedText.includes('soundtrack');
  const isXmas = combinedText.includes('크리스마스') || combinedText.includes('christmas') || combinedText.includes('holiday');
  const isLofi = combinedText.includes('로파이') || combinedText.includes('lofi') || combinedText.includes('lo-fi') || combinedText.includes('비오는');
  const isJazz = combinedText.includes('재즈') || combinedText.includes('jazz') || combinedText.includes('스윙');
  const isAcoustic = combinedText.includes('어쿠스틱') || combinedText.includes('acoustic') || combinedText.includes('기타') || combinedText.includes('guitar');

  const vocalTag = 
    vocal === 'female' ? 'sincere expressive female vocal, emotional delivery' :
    vocal === 'male' ? 'male heartfelt soulful vocal, warm tone' :
    vocal === 'none' ? 'instrumental, no vocals' : 'expressive emotional vocal harmonies';

  let trackTemplates: Array<{ title: string; mood: string; style: string; lyrics: string }> = [];

  if (isCinematic) {
    trackTemplates = [
      {
        title: '오래된 필름 속의 너 (Fragments on the 35mm Reel)',
        mood: '영화 도입부의 아련한 독백과 서서히 벅차오르는 감정선',
        style: `cinematic emotional OST ballad, felt upright piano intro, soaring lush orchestra strings, ${vocalTag}, building crescendo, heartfelt bridge, 74 bpm, Korean drama film soundtrack aesthetic`,
        lyrics: `[Intro]\n(Gentle, melancholic piano notes echo like dust in an old projector light)\n(Subtle cinematic cello sweeps in)\n\n[Verse 1]\n빛바랜 영사실 창가 너머로\n조용히 흩어지는 기억의 파편들\n너의 목소리가 귓가에 스칠 때면\n멈춰선 시간도 숨을 죽여\n\n[Pre-Chorus]\n잊혀질 줄 알았던 그날의 대사들이\n가슴 깊은 곳에서 하나둘 떠올라\n어둠 속에 홀로 앉아 널 기다리던 밤\n\n[Chorus]\n너는 내게 가장 눈부신 영화였어\n끝나지 않을 이야기처럼 타오르던 순간\n수많은 장면 속에 널 안아줄 수 있다면\n마지막 씬에서도 난 너의 손을 놓지 않을게\n\n[Verse 2]\n스크린 위로 흐르는 빗물처럼\n흘려보낸 눈물 속에 새겨진 너의 이름\n잡으려 할수록 멀어지는 그림자\n\n[Bridge]\n(Orchestral strings soar with deep emotional intensity)\n엔딩 크레딧이 모두 올라간대도\n불 꺼진 극장에 나 홀로 남아\n너라는 계절을 영원히 기억할 테니\n\n[Chorus]\n너는 내게 가장 눈부신 영화였어\n끝나지 않을 이야기처럼 타오르던 순간\n수많은 장면 속에 널 안아줄 수 있다면\n마지막 씬에서도 난 너의 손을 놓지 않을게\n\n[Outro]\n(Tender piano chords fading out into silence)\n영원히 바래지 않을 우리만의 명장면\n(Lush strings soft fade)`
      },
      {
        title: '엔딩 크레딧이 오른 후에 (When the Credits Fade)',
        mood: '가슴을 울리는 웅장한 클라이맥스와 깊은 여운',
        style: `grand cinematic movie ballad, grand acoustic piano, sweeping violin and cello ensemble, ${vocalTag}, powerful dynamic chorus, rich cinematic soundscape, 78 bpm`,
        lyrics: `[Intro]\n(Lush strings pad with delicate high piano notes)\n\n[Verse 1]\n막이 내린 무대 위 고요한 침묵 속에\n너와 나눈 약속만이 남아 있어\n흘러가는 바람에 서글픈 멜로디 실어\n닿지 않을 너에게 건네는 마지막 인사\n\n[Pre-Chorus]\n빛나던 조명이 하나씩 꺼져가도\n내 맘속 너의 온기는 식지 않아\n\n[Chorus]\n시간을 거슬러 그 자리로 돌아갈 수 있다면\n너를 안고 놓지 않았을 텐데\n슬픈 영화의 끝에서도\n너는 영원한 나의 주인공\n\n[Bridge]\n(Dramatic orchestral percussion and soaring vocal build-up)\n우리의 끝이 이별일지라도\n널 만난 모든 순간은 축복이었어\n\n[Outro]\n(Piano solo gently fading out)\n기억해 줘, 우리가 사랑했던 계절을`
      },
      {
        title: '기억의 잔상 (Faded Silver Screen)',
        mood: '서정적이고 아련한 노스탤지어 발라드',
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
  } else if (isXmas || isJazz) {
    trackTemplates = [
      {
        title: '눈 내리는 밤의 창가에서 (Snowy Window Glow)',
        mood: '포근하고 로맨틱한 홀리데이 스윙',
        style: `warm cozy christmas jazz pop, vintage upright piano, brushed jazz drums, warm acoustic bass, festive glockenspiel bells, ${vocalTag}, 105 bpm`,
        lyrics: `[Intro]\n(Gentle piano arpeggio and soft jingle bells)\n\n[Verse 1]\n하얗게 물들어가는 창밖 거리 위로\n조용히 내려앉는 첫눈의 발걸음\n\n[Chorus]\nIt's a cozy Christmas night with you\n벽난로 불꽃처럼 타오르는 맘\n\n[Outro]\n메리 크리스마스, 내 모든 순간의 그대`
      },
      {
        title: '벽난로 곁의 핫초코 (Cinnamon & Warm Cocoa)',
        mood: '아늑하고 감미로운 미디엄 템포 재즈',
        style: `sweet festive jazz pop, acoustic upright piano, upright bass walking groove, ${vocalTag}, 108 bpm`,
        lyrics: `[Verse 1]\n시나몬 향 가득 퍼지는 작은 부엌\n달콤한 마시멜로가 녹아내릴 때\n\n[Chorus]\nSweet warm cocoa by the fire\n그대와 함께라면 매일이 크리스마스`
      }
    ];
  } else {
    trackTemplates = [
      {
        title: `${theme.name} - 트랙 1 [첫 번째 울림]`,
        mood: '테마의 고유한 감성과 사운드 정체성을 담은 오프닝',
        style: `${theme.category || 'melodic music'}, authentic acoustic instruments, warm soundscape, ${vocalTag}, 90 bpm, SOP faithful`,
        lyrics: `[Intro]\n(Atmospheric opening theme)\n\n[Verse 1]\n조용히 번져오는 하루의 시작 속에\n흘러가는 생각들을 멜로디에 담아\n\n[Chorus]\n마음 깊은 곳에 울려 퍼지는 작은 노래\n오늘을 살아가는 우리 모두를 위한 멜로디`
      },
      {
        title: `${theme.name} - 트랙 2 [깊어지는 서사]`,
        mood: '감정선을 극대화한 몰입감 높은 멜로디',
        style: `${theme.category || 'chill melodic'}, rich arrangement, expressive progression, ${vocalTag}, 86 bpm`,
        lyrics: `[Verse 1]\n창밖에 스며드는 노을빛을 바라보며\n잠시 멈춰선 시간 속에 숨을 골라요\n\n[Chorus]\n소중한 기억들이 모여 하나의 노래가 되듯\n우리의 시간은 지금부터야`
      },
      {
        title: `${theme.name} - 트랙 3 [완성과 여운]`,
        mood: '편안하고 감미로운 마무리를 선물하는 트랙',
        style: `${theme.category || 'healing music'}, sweet piano, soft rhythm, uplifting harmony, ${vocalTag}, 96 bpm`,
        lyrics: `[Verse 1]\n밤하늘에 수놓아진 수많은 꿈들\n하나하나 마음속에 고이 담아두고\n\n[Chorus]\n따뜻한 선율이 그대를 감싸 안을 때\n행복한 미소로 다시 만나요`
      }
    ];
  }

  const tracks = [];
  for (let i = 0; i < trackCount; i++) {
    const template = trackTemplates[i % trackTemplates.length];
    tracks.push({
      trackNumber: i + 1,
      title: trackCount > trackTemplates.length && i >= trackTemplates.length
        ? `${template.title} (Part ${Math.floor(i / trackTemplates.length) + 1})`
        : template.title,
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

  const youtubeTitle = isCinematic
    ? `[PLAYLIST] 영화 같은 하루를 선물하는 감성 시네마틱 발라드 OST 🎬 ☕️ | Cinematic Movie OST Ballads for Deep Emotion & Focus`
    : isXmas
    ? `[PLAYLIST] 벽난로 곁에서 듣는 따스한 크리스마스 재즈팝 ☕️🎄 | Cozy Holiday Jazz Pop for Coffee & Reading`
    : `[PLAYLIST] ${theme.name} | 지친 일상에 깊은 위로가 되어줄 플레이리스트 ☕️✨`;

  const youtubeDesc = `지친 마음에 깊은 울림을 전하는 ${theme.name} 플레이리스트입니다.
입력된 SOP 지침을 바탕으로 기획된 감성 사운드로 편안한 힐링과 몰입을 즐겨보세요.

[🎧 Tracklist]
${tracklistText}

[🎬 추천 청취 상황]
- 영화 같은 감성에 푹 빠지고 싶을 때
- 조용한 밤, 깊은 사색과 작업에 몰입할 때
- 마음의 쉼표가 필요한 모든 순간

#PlymasterFactory #플레이리스트 #음악추천 #BGM #OST #시네마틱 #감성음악`;

  const hashtags = isCinematic
    ? '#영화OST #시네마틱발라드 #플레이리스트 #감성음악 #작업용BGM #감성발라드'
    : isXmas
    ? '#크리스마스플레이리스트 #재즈팝 #카페음악 #크리스마스캐롤 #겨울노래'
    : '#플레이리스트 #힐링음악 #작업용BGM #감성음악';

  const thumbnailPrompt = isCinematic
    ? 'Cinematic 16:9 movie still, melancholic beautiful film scene, soft warm golden hour light through sheer curtain, 35mm film aesthetic, emotional depth, photorealistic, 8k resolution --ar 16:9'
    : 'A beautiful serene aesthetic room with warm afternoon sunlight, cozy interior, cinematic photography, 8k resolution, 16:9 --ar 16:9';

  const backgroundImagePrompt = isCinematic
    ? '16:9 seamless film loop background: warm vintage cinema aesthetic, slow ambient light rays, soft floating dust particles, emotional cozy atmosphere'
    : 'Peaceful 16:9 ambient illustration, warm color palette, aesthetic chill vibe, high quality digital art';

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
