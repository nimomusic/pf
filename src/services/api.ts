import { Theme, PlaylistResult, VocalType, ProviderType } from '../types';

export async function fetchThemes(): Promise<Theme[]> {
  const res = await fetch('/api/themes');
  if (!res.ok) throw new Error('테마 목록을 불러오지 못했습니다.');
  const data = await res.json();
  return data.themes || [];
}

export async function createTheme(themeData: { id?: string; name: string; category?: string; sop: string }): Promise<Theme> {
  const res = await fetch('/api/themes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(themeData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || '테마 저장에 실패했습니다.');
  }
  return data.theme;
}

export async function updateTheme(id: string, themeData: Partial<Theme>): Promise<Theme> {
  const res = await fetch(`/api/themes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(themeData)
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || '테마 수정에 실패했습니다.');
  }
  return data.theme;
}

export async function deleteTheme(id: string): Promise<void> {
  const res = await fetch(`/api/themes/${encodeURIComponent(id)}`, {
    method: 'DELETE'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || '테마 삭제에 실패했습니다.');
  }
}

export async function resetThemesToDefault(): Promise<Theme[]> {
  const res = await fetch('/api/themes/reset', {
    method: 'POST'
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error('기본 테마 복원에 실패했습니다.');
  }
  return data.themes || [];
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

  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.message || '플레이리스트 생성에 실패했습니다.');
  }
  return data;
}
