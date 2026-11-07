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
  const res = await fetch('/api/verify-license', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ licenseKey, sheetUrl })
  });
  const data = await res.json();
  return data;
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
