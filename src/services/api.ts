import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getDocsFromServer,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where
} from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { Theme, PlaylistResult, VocalType, ProviderType } from '../types';

const THEMES_STORAGE_KEY = 'plymaster_custom_themes';
const DELETED_THEMES_STORAGE_KEY = 'plymaster_deleted_theme_ids';
const THEMES_CLEARED_KEY = 'plymaster_themes_cleared';
const THEMES_COLLECTION = 'themes';

function sanitizeThemeId(rawId?: string): string {
  const cleaned = (rawId || '')
    .trim()
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 128);
  return cleaned || `THEME_${Date.now().toString().slice(-6)}`;
}

function sanitizeThemeFields(themeData: {
  id?: string;
  name?: string;
  category?: string;
  sop?: string;
  isDefault?: boolean;
}) {
  const id = sanitizeThemeId(themeData.id);
  const name = (themeData.name || '무제 테마').trim().slice(0, 200) || '무제 테마';
  const category = (themeData.category ?? '일반').trim().slice(0, 100);
  const sop = (themeData.sop || '').trim().slice(0, 100000);
  const isDefault = Boolean(themeData.isDefault);
  return { id, name, category, sop, isDefault };
}

function getThemeTimestampMs(theme: Partial<Theme> | undefined): number {
  if (!theme) return 0;
  const raw = theme.updatedAt || theme.createdAt;
  if (!raw) return 0;
  const ms = Date.parse(raw);
  return Number.isNaN(ms) ? 0 : ms;
}

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

function getDeletedThemeIds(): Record<string, number> {
  try {
    const raw = localStorage.getItem(DELETED_THEMES_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        return parsed;
      }
    }
  } catch {}
  return {};
}

function markThemeDeletedLocally(id: string): void {
  try {
    const map = getDeletedThemeIds();
    map[id] = Date.now();
    localStorage.setItem(DELETED_THEMES_STORAGE_KEY, JSON.stringify(map));
  } catch {}
}

function unmarkThemeDeletedLocally(id: string): void {
  try {
    const map = getDeletedThemeIds();
    if (id in map) {
      delete map[id];
      localStorage.setItem(DELETED_THEMES_STORAGE_KEY, JSON.stringify(map));
    }
    localStorage.removeItem(THEMES_CLEARED_KEY);
  } catch {}
}

function mapFirestoreDocToTheme(docData: Record<string, any>, docId: string): Theme {
  const createdIso =
    typeof docData.createdAt?.toDate === 'function'
      ? docData.createdAt.toDate().toISOString()
      : typeof docData.createdAt === 'string'
      ? docData.createdAt
      : new Date().toISOString();
  const updatedIso =
    typeof docData.updatedAt?.toDate === 'function'
      ? docData.updatedAt.toDate().toISOString()
      : typeof docData.updatedAt === 'string'
      ? docData.updatedAt
      : createdIso;

  return {
    id: String(docData.id || docId),
    name: String(docData.name || ''),
    category: String(docData.category || '일반'),
    sop: String(docData.sop || ''),
    isDefault: Boolean(docData.isDefault),
    createdAt: createdIso,
    updatedAt: updatedIso,
  };
}

function mergeThemeLists(
  primary: Theme[],
  secondary: Theme[],
  deletedMap: Record<string, number>
): Theme[] {
  const byId = new Map<string, Theme>();
  const order: string[] = [];

  const addOrMerge = (t: Theme, preferIncomingOnTie: boolean) => {
    if (!t || !t.id) return;
    const deletedAt = deletedMap[t.id] || 0;
    const tMs = getThemeTimestampMs(t);
    if (deletedAt > 0 && tMs <= deletedAt) {
      return;
    }

    const existing = byId.get(t.id);
    if (!existing) {
      byId.set(t.id, t);
      order.push(t.id);
      return;
    }

    const existingMs = getThemeTimestampMs(existing);
    if (tMs > existingMs || (tMs === existingMs && preferIncomingOnTie)) {
      byId.set(t.id, { ...existing, ...t });
    }
  };

  for (const t of primary) addOrMerge(t, true);
  for (const t of secondary) addOrMerge(t, false);

  const merged = order.map((id) => byId.get(id)!).filter(Boolean);
  // Keep user-created / more recently modified themes at top, preserving relative order on ties
  return merged.sort((a, b) => {
    if (Boolean(a.isDefault) !== Boolean(b.isDefault)) {
      return a.isDefault ? 1 : -1;
    }
    return getThemeTimestampMs(b) - getThemeTimestampMs(a);
  });
}

async function fetchFirestoreThemes(): Promise<Theme[] | null> {
  if (!db) return null;
  try {
    const q = query(
      collection(db, THEMES_COLLECTION),
      where('isDefault', 'in', [true, false])
    );
    let snap;
    try {
      snap = await getDocsFromServer(q);
    } catch {
      snap = await getDocs(q);
    }
    return snap.docs.map((d) => mapFirestoreDocToTheme(d.data(), d.id));
  } catch (error: any) {
    const msg = error?.message || '';
    if (msg.includes('permission') || msg.includes('Missing or insufficient permissions')) {
      console.warn('Firestore themes read permission notice:', msg);
    } else {
      console.warn('Firestore fetchThemes unavailable, using merged fallback:', msg);
    }
    return null;
  }
}

async function upsertThemeInFirestore(theme: {
  id: string;
  name: string;
  category: string;
  sop: string;
  isDefault: boolean;
}): Promise<boolean> {
  if (!db || !auth?.currentUser) return false;
  const clean = sanitizeThemeFields(theme);
  const docPath = `${THEMES_COLLECTION}/${clean.id}`;
  const ref = doc(db, THEMES_COLLECTION, clean.id);

  try {
    const existingSnap = await getDoc(ref);
    if (existingSnap.exists()) {
      await updateDoc(ref, {
        name: clean.name,
        category: clean.category,
        sop: clean.sop,
        isDefault: clean.isDefault,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        id: clean.id,
        name: clean.name,
        category: clean.category,
        sop: clean.sop,
        isDefault: clean.isDefault,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, docPath);
  }
}

async function deleteThemeInFirestore(id: string): Promise<boolean> {
  if (!db || !auth?.currentUser) return false;
  const safeId = sanitizeThemeId(id);
  const docPath = `${THEMES_COLLECTION}/${safeId}`;
  try {
    await deleteDoc(doc(db, THEMES_COLLECTION, safeId));
    return true;
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, docPath);
  }
}

export async function syncThemesToFirestore(themesToSync?: Theme[]): Promise<{ syncedCount: number }> {
  if (!db || !auth?.currentUser) {
    throw new Error('클라우드 동기화를 위해 먼저 Google 계정으로 로그인해 주세요.');
  }

  const deletedMap = getDeletedThemeIds();
  const cloudThemes = (await fetchFirestoreThemes()) || [];
  const cloudById = new Map(cloudThemes.map((t) => [t.id, t]));

  const sourceList = themesToSync || getLocalThemes();
  let syncedCount = 0;

  // Upload any theme that is missing in Firestore or newer locally
  for (const theme of sourceList) {
    const clean = sanitizeThemeFields(theme);
    const cloudMatch = cloudById.get(clean.id);
    const localMs = getThemeTimestampMs(theme);
    const cloudMs = getThemeTimestampMs(cloudMatch);

    if (
      !cloudMatch ||
      localMs > cloudMs ||
      cloudMatch.name !== clean.name ||
      cloudMatch.category !== clean.category ||
      cloudMatch.sop !== clean.sop
    ) {
      await upsertThemeInFirestore(clean);
      syncedCount++;
    }
  }

  // Propagate any local deletions made while offline/unauthenticated
  for (const [delId, delTime] of Object.entries(deletedMap)) {
    const cloudMatch = cloudById.get(delId);
    if (cloudMatch && getThemeTimestampMs(cloudMatch) <= delTime) {
      await deleteThemeInFirestore(delId);
      syncedCount++;
    }
  }

  return { syncedCount };
}

export async function fetchThemes(): Promise<Theme[]> {
  const localThemes = getLocalThemes();
  const deletedMap = getDeletedThemeIds();
  const isLocallyCleared = localStorage.getItem(THEMES_CLEARED_KEY) === 'true';

  // 1. Fetch from Firestore cloud database (authoritative persistent store)
  const cloudThemes = await fetchFirestoreThemes();

  // 2. Fetch server seed/runtime list as fallback or initial seed source
  let serverThemes: Theme[] = [];
  try {
    const res = await fetch('/api/themes');
    if (res.ok) {
      const text = await res.text();
      const data = JSON.parse(text);
      if (data && Array.isArray(data.themes)) {
        serverThemes = data.themes;
      }
    }
  } catch (err) {
    console.warn('Backend fetchThemes failed, using cloud/local cache:', err);
  }

  let finalThemes: Theme[] = [];

  if (cloudThemes && cloudThemes.length > 0) {
    // Cloud DB already populated: merge Cloud (authoritative) + any newer/unsynced local edits,
    // NEVER letting stale serverThemes overwrite newer cloud or local themes!
    finalThemes = mergeThemeLists(cloudThemes, localThemes, deletedMap);

    // If signed in and local has unsynced newer themes, push them to Firestore automatically
    if (auth?.currentUser && localThemes.length > 0) {
      syncThemesToFirestore(finalThemes).catch((e) =>
        console.warn('Background Firestore sync notice:', e)
      );
    }
  } else if (isLocallyCleared && localThemes.length === 0) {
    finalThemes = [];
  } else {
    // Cloud DB not yet seeded (or offline): non-destructive merge preferring newer local edits over server seed!
    finalThemes = mergeThemeLists(localThemes, serverThemes, deletedMap);

    // Re-hydrate ephemeral server with any local-only/local-newer themes
    if (localThemes.length > 0) {
      const serverById = new Map(serverThemes.map((t) => [t.id, t]));
      for (const lt of localThemes) {
        const st = serverById.get(lt.id);
        if (!st || getThemeTimestampMs(lt) > getThemeTimestampMs(st)) {
          fetch('/api/themes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(lt),
          }).catch(() => {});
        }
      }
    }

    // Seed Firestore automatically if admin is already signed in
    if (auth?.currentUser && finalThemes.length > 0 && cloudThemes && cloudThemes.length === 0) {
      syncThemesToFirestore(finalThemes).catch((e) =>
        console.warn('Initial Firestore seed notice:', e)
      );
    }
  }

  saveLocalThemes(finalThemes);
  return finalThemes;
}

export async function createTheme(themeData: { id?: string; name: string; category?: string; sop: string }): Promise<Theme> {
  const localThemes = getLocalThemes();
  const clean = sanitizeThemeFields({
    id: themeData.id || `THEME_${Date.now().toString().slice(-6)}`,
    name: themeData.name,
    category: themeData.category || '일반',
    sop: themeData.sop,
    isDefault: false,
  });

  const nowIso = new Date().toISOString();
  const newTheme: Theme = {
    id: clean.id,
    name: clean.name,
    category: clean.category,
    sop: clean.sop,
    createdAt: nowIso,
    updatedAt: nowIso,
    isDefault: false,
  };

  unmarkThemeDeletedLocally(clean.id);

  // 1. Update client-side localStorage cache immediately
  const existingIdx = localThemes.findIndex((t) => t.id === clean.id);
  let updatedList: Theme[];
  if (existingIdx >= 0) {
    updatedList = [...localThemes];
    updatedList[existingIdx] = newTheme;
  } else {
    updatedList = [newTheme, ...localThemes];
  }
  saveLocalThemes(updatedList);

  // 2. Persist to Firebase Firestore when signed in as Admin
  if (auth?.currentUser) {
    await upsertThemeInFirestore(clean);
  }

  // 3. Sync to backend /api/themes for server-side consistency
  try {
    const res = await fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTheme),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.theme) {
        return { ...newTheme, ...data.theme };
      }
    }
  } catch (err) {
    console.warn('Backend createTheme sync failed (persisted in cloud/local):', err);
  }

  return newTheme;
}

export async function updateTheme(id: string, themeData: Partial<Theme>): Promise<Theme> {
  const safeId = sanitizeThemeId(id);
  const localThemes = getLocalThemes();
  const existingIdx = localThemes.findIndex((t) => t.id === safeId || t.id === id);
  const base = existingIdx >= 0 ? localThemes[existingIdx] : undefined;
  const nowIso = new Date().toISOString();

  const clean = sanitizeThemeFields({
    id: safeId,
    name: themeData.name ?? base?.name ?? '무제 테마',
    category: themeData.category ?? base?.category ?? '일반',
    sop: themeData.sop ?? base?.sop ?? '',
    isDefault: themeData.isDefault ?? base?.isDefault ?? false,
  });

  const targetTheme: Theme = {
    ...(base || {}),
    id: clean.id,
    name: clean.name,
    category: clean.category,
    sop: clean.sop,
    isDefault: clean.isDefault,
    createdAt: base?.createdAt || nowIso,
    updatedAt: nowIso,
  };

  unmarkThemeDeletedLocally(clean.id);

  if (existingIdx >= 0) {
    const updatedList = [...localThemes];
    updatedList[existingIdx] = targetTheme;
    saveLocalThemes(updatedList);
  } else {
    saveLocalThemes([targetTheme, ...localThemes]);
  }

  // Persist update to Firebase Firestore when signed in as Admin
  if (auth?.currentUser) {
    await upsertThemeInFirestore(clean);
  }

  try {
    const res = await fetch(`/api/themes/${encodeURIComponent(id)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(targetTheme),
    });
    if (res.ok) {
      const data = await res.json();
      if (data && data.success && data.theme) {
        return { ...targetTheme, ...data.theme };
      }
    }
  } catch (err) {
    console.warn('Backend updateTheme sync failed (persisted in cloud/local):', err);
  }

  return targetTheme;
}

export async function deleteTheme(id: string): Promise<void> {
  const localThemes = getLocalThemes();
  const remaining = localThemes.filter((t) => t.id !== id);
  saveLocalThemes(remaining);
  markThemeDeletedLocally(id);

  if (auth?.currentUser) {
    await deleteThemeInFirestore(id);
  }

  try {
    await fetch(`/api/themes/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  } catch (err) {
    console.warn('Backend deleteTheme sync failed (deleted in cloud/local):', err);
  }
}

export async function resetThemesToDefault(): Promise<Theme[]> {
  const existing = getLocalThemes();
  for (const t of existing) {
    markThemeDeletedLocally(t.id);
    if (auth?.currentUser) {
      await deleteThemeInFirestore(t.id);
    }
  }
  saveLocalThemes([]);
  try {
    localStorage.setItem(THEMES_CLEARED_KEY, 'true');
  } catch {}

  try {
    await fetch('/api/themes/reset', {
      method: 'POST',
    });
  } catch (err) {
    console.warn('Backend resetThemes sync failed (cleared in cloud/local):', err);
  }
  return [];
}

export async function importThemesBulk(importedThemes: Array<{ id?: string; name: string; category?: string; sop: string; isDefault?: boolean }>): Promise<Theme[]> {
  const current = getLocalThemes();
  const nowIso = new Date().toISOString();
  const cleanedIncoming: Theme[] = importedThemes
    .filter((t) => t && t.name && t.sop)
    .map((t) => {
      const clean = sanitizeThemeFields(t);
      unmarkThemeDeletedLocally(clean.id);
      return {
        id: clean.id,
        name: clean.name,
        category: clean.category,
        sop: clean.sop,
        isDefault: clean.isDefault,
        createdAt: nowIso,
        updatedAt: nowIso,
      };
    });

  const merged = mergeThemeLists(cleanedIncoming, current, getDeletedThemeIds());
  saveLocalThemes(merged);

  if (auth?.currentUser) {
    await syncThemesToFirestore(merged);
  }

  for (const t of cleanedIncoming) {
    fetch('/api/themes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(t),
    }).catch(() => {});
  }

  return merged;
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
  lyricConcept?: string;
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
      lyricConcept: params.lyricConcept,
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
    const cleanText = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
    const snippet = cleanText.slice(0, 150);
    if (res.status === 504 || res.status === 502 || snippet.toLowerCase().includes('gateway') || snippet.toLowerCase().includes('timeout')) {
      throw new Error(`서버 응답 시간 초과 (HTTP ${res.status}): AI 생성 처리 시간이 초과되었습니다. 모델 설정을 더 빠른 모델(Gemini Flash-Lite 등)로 변경하시거나 잠시 후 다시 시도해 주세요.`);
    }
    if (res.status === 500) {
      throw new Error(`서버 응답 오류 (HTTP 500): ${snippet || '서버 내부 처리 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요.'}`);
    }
    throw new Error(`서버 응답 오류 (HTTP ${res.status}): ${snippet || '유효하지 않은 응답'}`);
  }

  if (!res.ok || !data || !data.success) {
    const errorMsg = data?.message || `AI 생성 실패 (HTTP ${res.status})`;
    throw new Error(errorMsg);
  }

  if (data.result && Array.isArray(data.result.tracks)) {
    const specs = parseClientSopSpecs(params.theme);
    data.result.tracks = data.result.tracks.map((tr: any, idx: number) => ({
      ...tr,
      trackNumber: idx + 1,
      title: cleanTitleSingleLanguage(tr.title, specs.targetLang, specs.isJapanese ? '新曲' : specs.isKoreanTitle ? '새로운 트랙' : (tr.title || `Track ${idx + 1}`)),
      fullLyrics: formatAndCleanLyrics(tr.fullLyrics, specs.isJapanese, !specs.forbidsIntroOutro)
    }));
  }

  return data;
}

function parseClientSopSpecs(theme: Theme) {
  const combined = `${theme.name || ''} ${theme.category || ''} ${theme.sop || ''}`.toLowerCase();
  const rawSop = theme.sop || '';

  const engCharCount = (rawSop.match(/[a-zA-Z]/g) || []).length;
  const korCharCount = (rawSop.match(/[\uAC00-\uD7AF]/g) || []).length;
  const jpnCharCount = (rawSop.match(/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/g) || []).length;

  // Check if Japanese J-POP / Electronic R&B is explicitly requested
  const isJapanese = (
    combined.includes('j-pop') ||
    combined.includes('jpop') ||
    combined.includes('제이팝') ||
    combined.includes('일본어') ||
    combined.includes('japanese') ||
    combined.includes('alt-pop / electronic r&b') ||
    combined.includes('electronic r&b j-pop') ||
    combined.includes('시티 팝') ||
    combined.includes('city pop') ||
    jpnCharCount > 10
  );

  // Check if Korean or Kor-Eng code-switching is intended in the SOP
  const hasKoreanDirectives = !isJapanese && (
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
    korCharCount > 30
  );

  const isKorEngMixed = !isJapanese && (
    combined.includes('한영 혼용') ||
    combined.includes('한영혼용') ||
    combined.includes('kor-eng') ||
    combined.includes('code-switching') ||
    (combined.includes('한국어') && (combined.includes('영어') || combined.includes('english')))
  );

  // Strictly check if 100% English is explicitly mandated without Korean mixing
  const isEnglishExplicit = !isJapanese && (
    (combined.includes('100% english') ||
     combined.includes('in 100% english') ||
     combined.includes('all lyrics must be written in 100% english') ||
     combined.includes('all lyrics must be written in english') ||
     combined.includes('write lyrics naturally in english') ||
     combined.includes('100% 영문') ||
     combined.includes('영어로만 작성') ||
     combined.includes('written in 100% english')) &&
    !hasKoreanDirectives
  );

  const isEnglishOnly = !isJapanese && isEnglishExplicit && !hasKoreanDirectives;

  const targetLang: 'japanese' | 'english' | 'korean' = 
    isJapanese ? 'japanese' :
    isEnglishOnly ? 'english' : 'korean';

  const isKoreanTitle = targetLang === 'korean';
  const isJapaneseTitle = targetLang === 'japanese';

  // Differentiate Korean R&B Hip-Hop from J-POP
  const isKoreanHipHopRnb = !isJapanese && (
    combined.includes('한국 알앤비') ||
    combined.includes('한국 힙합') ||
    combined.includes('인스타 감성') ||
    combined.includes('느좋') ||
    ((combined.includes('알앤비') || combined.includes('힙합') || combined.includes('hip-hop') || combined.includes('trap')) &&
     (combined.includes('한영 혼용') || combined.includes('한영혼용') || combined.includes('특수 보컬 질감') || combined.includes('suno 키워드')))
  );

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

  const isCinematic = !isJapanese && (
    combined.includes('film') ||
    combined.includes('movie') ||
    combined.includes('cinematic') ||
    combined.includes('ost') ||
    combined.includes('soundtrack')
  );

  return { 
    isJapanese,
    targetLang,
    isEnglishOnly, 
    isKoreanTitle, 
    isJapaneseTitle,
    isKorEngMixed, 
    isKoreanHipHopRnb, 
    forbidsIntroOutro, 
    isShellacVintage, 
    isCinematic, 
    engCharCount, 
    korCharCount,
    jpnCharCount
  };
}

// Helper: Ensure track title contains ONLY the target language (no bilingual parentheses or multi-line translations)
function cleanTitleSingleLanguage(
  title: string, 
  targetLang: 'japanese' | 'english' | 'korean', 
  fallbackTitle = 'Track Title'
): string {
  if (!title) return fallbackTitle;
  let clean = title.trim();
  clean = clean.replace(/^\[?track\s*\d*\]?:?\s*/i, '').replace(/^["'`]|["'`]$/g, '').trim();

  // If title contains multiple numbered lines (e.g. from SOP Step 4: "1. 画面の向こう\n2. on the other side...\n3. 화면 너머")
  const lines = clean.split('\n').map(l => l.trim()).filter(Boolean);
  if (lines.length > 1) {
    if (targetLang === 'japanese') {
      const jpLine = lines.find(l => /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(l) && !/[\uAC00-\uD7AF]/.test(l));
      if (jpLine) clean = jpLine;
    } else if (targetLang === 'english') {
      const engLine = lines.find(l => /[a-zA-Z]/.test(l) && !/[\uAC00-\uD7AF]/.test(l) && !/[\u3040-\u309F\u30A0-\u30FF]/.test(l));
      if (engLine) clean = engLine;
    } else {
      const korLine = lines.find(l => /[\uAC00-\uD7AF]/.test(l));
      if (korLine) clean = korLine;
    }
  }

  // Strip leading numbering e.g. "1. ", "1) ", "- "
  clean = clean.replace(/^(?:\d+[\.\)]|[-•*])\s*/, '').trim();

  // If title has parentheses e.g. "画面の向こう (화면 너머)" or "画面の向こう (on the other side)"
  const parenMatch = clean.match(/^([^(]+)\s*\(([^)]+)\)$/);
  if (parenMatch) {
    const part1 = parenMatch[1].trim();
    const part2 = parenMatch[2].trim();
    if (targetLang === 'japanese') {
      const p1IsJp = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(part1) && !/[\uAC00-\uD7AF]/.test(part1);
      const p2IsJp = /[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(part2) && !/[\uAC00-\uD7AF]/.test(part2);
      if (p1IsJp) return part1;
      if (p2IsJp) return part2;
    } else if (targetLang === 'english') {
      const p1IsEng = /[a-zA-Z]/.test(part1) && !/[\uAC00-\uD7AF]/.test(part1);
      const p2IsEng = /[a-zA-Z]/.test(part2) && !/[\uAC00-\uD7AF]/.test(part2);
      if (p2IsEng) return part2;
      if (p1IsEng) return part1;
    } else {
      const p1IsKor = /[\uAC00-\uD7AF]/.test(part1);
      const p2IsKor = /[\uAC00-\uD7AF]/.test(part2);
      if (p1IsKor) return part1;
      if (p2IsKor) return part2;
    }
  }

  // Strip remaining unwanted brackets in other languages
  if (targetLang === 'japanese') {
    clean = clean.replace(/\([\uAC00-\uD7AF\s]+\)/g, '').replace(/\([a-zA-Z0-9\s-]+\)/g, '').trim();
    if (/[\uAC00-\uD7AF]/.test(clean)) {
      clean = clean.replace(/[\uAC00-\uD7AF]/g, '').trim();
    }
  } else if (targetLang === 'english') {
    clean = clean.replace(/\([\uAC00-\uD7AF\s]+\)/g, '').replace(/\([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+\)/g, '').trim();
    if (/[\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]/.test(clean)) {
      clean = clean.replace(/[\uAC00-\uD7AF\u3040-\u309F\u30A0-\u30FF]/g, '').trim();
    }
  } else {
    clean = clean.replace(/\([a-zA-Z0-9\s-]+\)/g, '').replace(/\([\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s]+\)/g, '').trim();
  }

  return clean || fallbackTitle;
}

// Helper: Ensure structure tags [Section: Guide] are on their own lines, sections have proper line breaks, and instrumental sections contain NO sung lyrics
function formatAndCleanLyrics(rawLyrics: string, isJapanese: boolean, includeEndTag: boolean = true): string {
  if (!rawLyrics) return '';
  let text = rawLyrics.trim();

  // Normalize line breaks
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Strip all duplicate/stray [End] tags before parsing
  text = text.replace(/\[\s*end\s*\]/gi, '');

  // Step 0: Normalize bracket tags [ ... ]
  // Transform curly braces or mixed braces into square brackets:
  // e.g. {Verse 1: ...} -> [Verse 1: ...]
  // e.g. [Tag: (Description)] -> [Tag: Description]
  text = text.replace(/\{([^{}\n\r]+)\}/g, '[$1]');
  text = text.replace(/\[\s*([^:\]]+)\s*:\s*[\({]([^\)}]+)[\)}]\s*\]/g, '[$1: $2]');
  text = text.replace(/[\{\}]/g, '');

  // Step 1: If a bracketed section tag is followed on the same line by text (e.g., "[Intro: ...] lyrics..."), split them!
  text = text.replace(/(\[[^\]]+\])[ \t]*([^\n\r]+)/g, (match, tag, rest) => {
    const trimmedRest = rest.trim();
    if (!trimmedRest) return tag;
    return `${tag}\n${trimmedRest}`;
  });

  // Step 2: Parse into structured sections based on bracket tags
  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const sections: Array<{ tag: string; contentLines: string[] }> = [];
  let currentTag = '';
  let currentContent: string[] = [];

  for (const line of rawLines) {
    if (/^\[\s*end\s*\]$/i.test(line)) {
      continue;
    }
    if (/^\[[^\]]+\]$/.test(line)) {
      if (currentTag || currentContent.length > 0) {
        sections.push({ tag: currentTag, contentLines: currentContent });
      }
      currentTag = line;
      currentContent = [];
    } else {
      currentContent.push(line);
    }
  }
  if (currentTag || currentContent.length > 0) {
    sections.push({ tag: currentTag, contentLines: currentContent });
  }

  // Step 3: Process and clean each section
  const formattedBlocks: string[] = [];
  for (let sIdx = 0; sIdx < sections.length; sIdx++) {
    const sec = sections[sIdx];
    let tag = sec.tag;
    const content = sec.contentLines;

    // Normalize tag: ensure clean [Section: Guide] without nested brackets
    tag = tag.replace(/\[\s*([^:\]]+)\s*:\s*[\({]([^\)}]+)[\)}]\s*\]/g, '[$1: $2]');
    tag = tag.replace(/[\{\}]/g, '');

    const tagHeader = tag.replace(/^\[|\].*$/g, '').trim().split(':')[0].trim().toLowerCase();
    const isInstrumental = /^(intro|outro|instrumental|interlude|break|piano solo|guitar solo|solo)$/i.test(tagHeader) ||
      /^\[\s*(intro|outro|instrumental|interlude|break|solo)/i.test(tag);

    if (isInstrumental) {
      const isInterludeOrBreak = /^(instrumental|interlude|break|piano solo|guitar solo|solo)/i.test(tagHeader) || /instrumental|solo/i.test(tag);
      const isIntro = /^intro/i.test(tagHeader) || /^\[\s*intro/i.test(tag);
      const isOutro = /^outro/i.test(tagHeader) || /^\[\s*outro/i.test(tag);

      // Check if tag already describes the instrument after colon, e.g. [Outro: Mellow piano fading...]
      const tagDescMatch = tag.match(/^\[[^:]+:\s*([^\]]+)\]$/);
      const tagDesc = tagDescMatch ? tagDescMatch[1].trim() : '';

      const cleanedLines: string[] = [];
      for (const line of content) {
        if (/^\(.*\)$/.test(line)) {
          // If the tag itself already has an arrangement prompt ([Outro: ...] or [Instrumental Interlude: ...]),
          // suppress redundant parenthesized guide lines underneath to avoid double prompts!
          if (!tagDesc) {
            cleanedLines.push(line);
          }
        } else if (isInterludeOrBreak) {
          // Strictly NO SUNG LYRICS in Instrumental section!
          if (sIdx + 1 < sections.length && !/^(intro|outro|instrumental|interlude|break|piano solo|guitar solo|solo)$/i.test(
            sections[sIdx + 1].tag.replace(/^\[|\].*$/g, '').trim().split(':')[0].trim().toLowerCase()
          )) {
            sections[sIdx + 1].contentLines.unshift(line);
          }
        } else if (isIntro) {
          if (sIdx + 1 < sections.length && /verse/i.test(sections[sIdx + 1].tag)) {
            sections[sIdx + 1].contentLines.unshift(line);
          }
        } else if (isOutro) {
          // Discard sung lyrics from Outro (instrumental fade only)
        }
      }

      if (!tagDesc && cleanedLines.length === 0) {
        if (isInterludeOrBreak) {
          cleanedLines.push('(Instrumental motif, rhythm section swells)');
        } else if (isIntro) {
          cleanedLines.push('(Atmospheric instrumental opening)');
        } else if (isOutro) {
          cleanedLines.push('(Gentle instrumental fadeout)');
        }
      }

      formattedBlocks.push(tag ? (cleanedLines.length > 0 ? `${tag}\n${cleanedLines.join('\n')}` : tag) : cleanedLines.join('\n'));
    } else {
      // Vocal sections: NEVER split regular English/Korean lines by single space!
      const linesOut: string[] = [];
      for (const line of content) {
        if (isJapanese && content.length <= 4 && (line.includes('\u3000') || line.includes('  '))) {
          const parts = line.split(/[\u3000]|\s{2,}/).map((p: string) => p.trim()).filter(Boolean);
          if (parts.length >= 2) {
            linesOut.push(...parts);
            continue;
          }
        }
        linesOut.push(line);
      }

      formattedBlocks.push(tag ? `${tag}\n${linesOut.join('\n')}` : linesOut.join('\n'));
    }
  }

  let result = formattedBlocks.filter(Boolean).join('\n\n').trim();
  result = result.replace(/\[\s*end\s*\]/gi, '').trim();
  if (includeEndTag) {
    result += '\n\n[End]';
  }

  return result;
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
  model: string,
  lyricConcept?: string
) {
  const specs = parseClientSopSpecs(theme);

  const vocalTag =
    vocal === 'female' ? 'sincere expressive female vocal, emotional delivery' :
    vocal === 'male' ? 'male heartfelt soulful vocal, warm tone' :
    vocal === 'none' ? 'instrumental, no vocals' : 'expressive emotional vocal harmonies';

  const tracks: any[] = [];
  const effectiveCount = Math.min(Math.max(trackCount || 1, 1), 10);

  let templates: Array<{ title: string; mood: string; style: string; lyrics: string; metaInfo?: any }> = [];

  if (specs.isShellacVintage) {
    templates = [
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
  } else if (specs.isEnglishOnly && specs.isCinematic) {
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
  } else if (specs.isJapanese) {
    // Japanese J-POP / Electronic R&B - 100% Japanese Title & 100% Japanese Sung Lyrics with English bracket tags
    templates = [
      {
        title: '画面の向こう',
        mood: '画面越しの孤独と真夜中の静けさに寄り添う、都会的で洗練された電子オルタナティブR&B',
        metaInfo: {
          vocal: '20s Japanese female vocal, intimate low-register tone, delicate breathy delivery, restrained vibrato',
          genre: 'Electronic R&B J-POP, Alt-Pop',
          mood: 'Urban Loneliness, Intimate & Quietly Devastating',
          bpm: '94 BPM',
          targetLength: '3:15'
        },
        style: `electronic R&B J-pop, cinematic Japanese alt-pop, philosophical city ballad, late-night urban solitude, intimate, lonely, quietly devastating, warm vintage Rhodes electric piano chords with slow stereo tremolo, glassy analog synthesizer pads, atmospheric ambient room tone, soft filtered 808 sub-bass pulse, 90-96 bpm minimal 4/4 electronic drum groove, subtle vinyl crackle and turntable patina, foley rain ambience against apartment window glass, sparse clean electric guitar fragments, 20s Japanese female vocal, intimate low register tone, delicate breathy delivery, restrained vibrato, wide emotional expansion in chorus, clear vocal presence, dry lead vocal mix, front-and-center lead vocal placement, modern Tokyo night playlist mastering, 94 bpm, -over-belting, -rock vocal drive, -orchestra, -bright brass, -edm drop, -fast rock tempo, -monotone delivery`,
        lyrics: `[Intro: Mellow Rhodes electric piano, atmospheric room tone]
(Soft ambient room tone, mellow electric piano arpeggios slowly breathing)

[Verse 1: Intimate low verse, soft kick and clean guitar fragments]
青い光が照らし出す部屋
指先がなぞる冷たい画面
既読のつかないメッセージだけが
暗闇の中に浮かんでいる
眠らない街のどこかで
あなたも同じ月を見ているの？
言葉にならない溜息ひとつ
静かに夜の底へと沈んでいく

[Pre-Chorus: Rising emotional tension, subtle sub-bass lift]
届かない距離ばかり数えて
胸の奥が少しだけ痛むけれど
この孤独さえ愛おしいと思えるのは
あなたが残したぬくもりのせい

[Chorus: Wide emotional delivery, restrained vibrato, full bass lift]
画面の向こう、遠く離れた街で
私の声は聴こえていますか
どれだけ夜を重ねても消えない想い
小さなスクロールの向こう側に
確かにある温もりを信じているから
言えないさよならを抱きしめて
今夜も静かにあなたを想う

[Verse 2: Intimate storytelling, delicate electric piano chords]
通り過ぎる電車の遠い響き
カーテンを揺らす真夜中の風
誰かの足音が遠ざかるたび
ひとりきりの輪郭が深くなる
思い出ばかりが鮮やかすぎて
未来の景色が滲んでしまう
それでもこの場所で息をしている

[Pre-Chorus: Rising emotional tension, subtle sub-bass lift]
届かない距離ばかり数えて
胸の奥が少しだけ痛むけれど
この孤独さえ愛おしいと思えるのは
あなたが残したぬくもりのせい

[Chorus: Wide emotional delivery, restrained vibrato, full bass lift]
画面の向こう、遠く離れた街で
私の声は聴こえていますか
どれだけ夜を重ねても消えない想い
小さなスクロールの向こう側に
確かにある温もりを信じているから
言えないさよならを抱きしめて
今夜も静かにあなたを想う

[Bridge: Stripped back acoustic piano, vulnerable close delivery]
触れ合えなくても
言葉が途切れても
あの日の笑顔が消えることはない
心はいつでもあなたの隣にいる

[Final Chorus: Maximum emotional release, subtle vocal doubles]
画面の向こう、夜明けが近づく空
孤独な光を包み込んでいく
どれだけ遠く離れていても
この想いは色褪せないまま
画面の向こうのあなたへと届いて
また新しい朝が始まるまで
静かに目を閉じて眠りにつく

[Outro: Mellow electric piano fading to ambient city night silence]
(Mellow electric piano softly resolving into silence)
[End]`
      },
      {
        title: '夜を泳ぐ',
        mood: '深夜の首都高と冷たいネオンライト、静寂を漂うエレクトロニック・シティ・バラード',
        metaInfo: {
          vocal: '20s Japanese female vocal, hushed breathy tone, melancholic whisper-singing',
          genre: 'Electronic R&B J-POP, City Ballad',
          mood: 'Nocturnal Loneliness, Dreamy & Sophisticated',
          bpm: '92 BPM',
          targetLength: '3:10'
        },
        style: `electronic R&B J-pop, cinematic Japanese alt-pop, philosophical city ballad, midnight highway expressway drive, nocturnal solitude, dreamy and sophisticated, mellow vintage Fender Rhodes electric piano, lush detuned analog synthesizer textures, deep gliding 808 sub-bass, soft minimal kick, clean dry snare, subtle distant city traffic foley ambience, 20s Japanese female vocal, intimate low register, whispered vocal delivery, restrained vibrato, wide emotional extension and layered falsetto hook, clear vocal presence, front-and-center lead vocal placement, dry intimate vocal mix, spacious stereo panorama, punchy low-end headroom, modern Tokyo playlist mastering, 92 bpm, -over-belting, -rock vocal drive, -orchestra, -bright brass, -edm drop, -fast rock tempo, -monotone delivery`,
        lyrics: `[Intro: Atmospheric synth pad and gentle Rhodes chords]
(Gentle Rhodes chords with subtle tape saturation and distant city ambience)

[Verse 1: Breathy intimate vocal, minimal beat and warm Rhodes]
ハイウェイを流れていく車のテールランプ
赤と白の光が滲むフロントガラス
助手席の空白に投げたジャケット
深夜二時の静寂が胸を満たす
どこへ向かえば忘れられるだろう
交差点の青信号がただ冷たく光る
アクセルを踏み込むたびに
昨日の記憶がバックミラーを掠める

[Pre-Chorus: Subtle rising pulse, gentle hi-hat movement]
街の灯りが星空のように瞬いて
私の孤独をそっと照らし出す
言い出せなかった本当の言葉が
喉の奥で小さく震えている

[Chorus: Wide emotional delivery, restrained vibrato, full bass lift]
夜を泳ぐ、暗闇の深い海を
光の届かない場所まで深く
あなたなしでも息ができるように
静かな波に身を任せて
消えそうな面影を追いかけながら
孤独さえも私の味方にして
夜明け前の風を抱きしめる

[Verse 2: Conversational tone, soft kick and Rhodes]
カーラジオから流れる古いR&B
いつかふたりで口ずさんだメロディ
ボリュームを少しだけ上げてみるけれど
切なさばかりが胸に響いてくる
誰も知らない秘密の抜け道
ヘッドライトが照らすアスファルト
私たちはどこで擦れ違ったのかな

[Chorus: Wide emotional delivery, restrained vibrato, full bass lift]
夜を泳ぐ、暗闇の深い海を
光の届かない場所まで深く
あなたなしでも息ができるように
静かな波に身を任せて
消えそうな面影を追いかけながら
孤独さえも私の味方にして
夜明け前の風を抱きしめる

[Bridge: Stripped-down Rhodes chords, intimate whisper]
振り向かないと決めたはずなのに
まだあなたの匂いが残っている
さよならは始まりの合図だから
もう涙は見せないと誓うよ

[Final Chorus: Maximum emotional release, layered vocal harmonies]
夜を泳ぐ、東の空が白むまで
哀しみさえも光に変えて
あなたと過ごしたすべての時間を
美しかった記憶として残すために
この夜を泳ぎ切ったその先で
私はきっと前を向いて歩き出せる

[Outro: Soft Fender Rhodes fading to dawn silence]
(Fender Rhodes fading to soft morning silence)
[End]`
      },
      {
        title: '残響の街',
        mood: '都会の雑踏と通り過ぎる日常のディテール、美しく切ないオルタナティブ・ポップ',
        metaInfo: {
          vocal: '20s Japanese female vocal, cool crystalline tone, intimate low register, wide emotional chorus',
          genre: 'Philosophical Electronic R&B J-POP',
          mood: 'Philosophical Melancholy, Elegant Urban Solitude',
          bpm: '96 BPM',
          targetLength: '3:20'
        },
        style: `electronic R&B J-pop, cinematic Japanese alt-pop, philosophical city ballad, rainy metropolitan Shibuya aesthetic, urban, intimate, lonely, quietly devastating, glassy electric piano arpeggios, spacious warm analog synthesizer textures, tight sub bass pulse, minimal 4/4 electronic percussion, clean muted jazz guitar chords, vinyl needle grain, authentic foley rain drops on asphalt, 20s Japanese female vocal, intimate low tone, cool crystalline vocal timbre, restrained vibrato, wide emotional chorus lift, clear vocal presence, front-and-center lead vocal placement, wide stereophonic field, pristine modern playlist master, 96 bpm, -over-belting, -rock vocal drive, -orchestra, -bright brass, -edm drop, -fast rock tempo, -monotone delivery`,
        lyrics: `[Intro: Glassy synth keys and muted clean guitar motif]
(Glassy synth keys floating over subtle vinyl crackle and distant rain foley)

[Verse 1: Cool crystalline vocal, sparse electric piano chords]
傘を打つ雨粒のリズムに合わせて
見慣れた交差点を渡る人波
すれ違う誰の目にも映らない
透明な私だけがここに立っている
カフェの窓ガラスに残る指紋のように
日常の隙間に焼きついた記憶
触れれば消えてしまう幻を
今もまだ探しているのかもしれない

[Pre-Chorus: Subtle bass entrance, rising emotional cadence]
日常という名の波に流されながら
大切なものを見失いそうになる
それでも胸の奥の小さな鼓動が
忘れてはいけない痛みを教えてくれる

[Chorus: Wide emotional delivery, restrained vibrato, full bass lift]
残響の街、ビルボードの光の下で
あなたの名前を心で呼ぶ
騒がしい雑踏の真ん中で
ふたりだけの静寂を覚えている
言葉では届かない深い場所へ
この切なさが溶け込んでいくように
今夜も雨の街に歌を降らせる

[Verse 2: Intimate reflective delivery, rhythmic soft beat]
濡れた歩道に反射するネオンの文字
通り過ぎるタクシーが跳ね上げる水しぶき
ありふれた景色のひとつひとつが
なぜかこんなにも愛おしく思える
完璧な愛なんてなかったけれど
不器用な優しさは本物だった
そう思える今が少し誇らしい

[Chorus: Wide emotional delivery, restrained vibrato, full bass lift]
残響の街、ビルボードの光の下で
あなたの名前を心で呼ぶ
騒がしい雑踏の真ん中で
ふたりだけの静寂を覚えている
言葉では届かない深い場所へ
この切なさが溶け込んでいくように
今夜も雨の街に歌を降らせる

[Bridge: Delicate electric piano solo, emotional vulnerability]
やまない雨はないと誰かが言っても
この雨に洗われていたい夜がある
悲しみも全部抱きしめたまま
明日へと歩いていくから

[Final Chorus: Highest emotional peak, wide layered backing vocals]
残響の街、雲の切れ間に光が射す
雨上がりの匂いが立ち込めて
あなたのくれたすべての愛が
私の足元を確かに照らしている
どんなに世界が色褪せようとも
この歌はずっと街の風に乗って響き続ける

[Outro: Glassy synth keys and rain fading out]
(Glassy synth keys gently fading into rain ambience)
[End]`
      }
    ];
  } else if (specs.isKoreanHipHopRnb || specs.isKorEngMixed) {
    templates = [
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
    const rawSop = theme.sop || '';
    const styleMatch = rawSop.match(/(?:Style(?:\s+of\s+Music)?(?:\s+Prompt)?(?:\s+지침)?\s*[:]\s*['"]?)([^'"\n\r]+)/i);
    const customStyle = styleMatch && styleMatch[1].trim()
      ? styleMatch[1].trim()
      : `${theme.category || theme.name}, emotive instrumentation, ${vocalTag}, 92 bpm, faithful to SOP`;

    const bpmMatch = rawSop.match(/(\d{2,3})\s*(?:~|-|\/)?\s*(\d{2,3})?\s*bpm/i);
    const customBpm = bpmMatch ? `${bpmMatch[1]} BPM` : '92 BPM';

    templates = [
      {
        title: specs.isEnglishOnly ? 'Whispers in the Silence' : `${theme.name} - 1번 트랙`,
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
        title: specs.isEnglishOnly ? 'Echoes Across the Horizon' : `${theme.name} - 2번 트랙`,
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
  const randomOffset = getNonRepeatingClientOffset(templates.length);

  for (let i = 0; i < effectiveCount; i++) {
    const tmpl = templates[(i + randomOffset) % templates.length];
    const rawTitle = effectiveCount > templates.length && i >= templates.length
      ? `${tmpl.title} Part ${Math.floor(i / templates.length) + 1}`
      : tmpl.title;

    const cleanConcept = (lyricConcept || '').trim();
    const effectiveMood = cleanConcept
      ? `${tmpl.mood} · 컨셉: ${cleanConcept}`
      : tmpl.mood;

    tracks.push({
      trackNumber: i + 1,
      title: cleanTitleSingleLanguage(rawTitle, specs.targetLang, specs.isJapanese ? '新曲' : (specs.isKoreanTitle ? '새로운 트랙' : `Track ${i + 1}`)),
      mood: effectiveMood,
      metaInfo: tmpl.metaInfo,
      stylePrompt: tmpl.style,
      fullLyrics: formatAndCleanLyrics(tmpl.lyrics, specs.isJapanese, !specs.forbidsIntroOutro)
    });
  }

  const tracklistText = tracks.map((t, idx) => {
    const min = Math.floor(idx * 3 + (idx * 20) / 60);
    const sec = ((idx * 24) % 60).toString().padStart(2, '0');
    return `${(idx + 1).toString().padStart(2, '0')}. ${t.title} (${min}:${sec})`;
  }).join('\n');

  const youtubeTitle = specs.isShellacVintage
    ? `[PLAYLIST] 1940s Vintage Shellac 78 RPM Phonograph | Worn Record Memories for Relaxing & Sleep 📻 ☕️`
    : specs.isJapanese
    ? `[PLAYLIST] ${theme.name} | 深夜の都市と孤独を包む洗練されたオルタナティブ R&B J-POP 🌙 🎧`
    : specs.isKoreanHipHopRnb
    ? `[PLAYLIST] ${theme.name} | 늦은 밤 감각적인 새벽 드라이브 느좋 칠(Chill) 알앤비 힙합 🌙 🎧`
    : specs.isEnglishOnly
    ? `[PLAYLIST] ${theme.name} | Emotional Ballads for Deep Focus & Heartbreak 🎬 ☕️`
    : `[PLAYLIST] ${theme.name} | 영화 같은 하루를 선물하는 감성 플레이리스트 🎬 ☕️`;

  const youtubeDesc = specs.isShellacVintage
    ? `Travel back in time to the 1940s. Authentic Type B worn and gritty shellac 78 RPM phonograph recordings with warm needle crackle, nostalgic melodies, and sincere vintage vocals.\n\n[🎧 Tracklist]\n${tracklistText}\n\n[📻 Sound Identity]\n- 1940s shellac 78 RPM record played on an antique wooden phonograph\n- Narrow frequency band, surface crackles & mechanical needle noise\n- Thick warm midrange & analog tube saturation\n\n#PlymasterFactory #Vintage1940s #ShellacRecord #78RPM #Phonograph #SunoAI`
    : specs.isJapanese
    ? `都会の夜と静寂に溶け込む洗練されたオルタナティブ R&B J-POP。\n${theme.name}のSOPに基づき、心に染み渡るサウンドと日本語歌詞でお届けします。\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #JPOP #ElectronicRnB #CityPop #AltPop #SunoAI`
    : specs.isKoreanHipHopRnb
    ? `감각적인 늦은 밤, 몽환적인 칠(Chill) 트랩 비트와 세련된 한영 혼용 보컬/싱랩의 향연.\n${theme.name} 플레이리스트와 함께 새벽 드라이브의 미묘한 텐션과 여유를 즐겨보세요.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #인스타감성 #느좋 #알앤비힙합 #한국알앤비 #새벽드라이브 #SunoAI`
    : specs.isEnglishOnly
    ? `Immerse yourself in a musical journey. Crafted precisely according to your SOP specifications.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #Playlist #SunoAI`
    : `지친 마음에 깊은 울림을 전하는 ${theme.name} 플레이리스트입니다.\n입력된 SOP 지침을 바탕으로 기획된 감성 사운드로 편안한 힐링과 몰입을 즐겨보세요.\n\n[🎧 Tracklist]\n${tracklistText}\n\n#PlymasterFactory #플레이리스트 #음악추천 #BGM #감성음악`;

  const hashtags = specs.isShellacVintage
    ? '#Vintage1940s #ShellacPhonograph #78RPM #VintagePop #RetroBallad #SunoAI'
    : specs.isJapanese
    ? '#JPOP #ElectronicRnB #CityPop #AltPop #SunoAI #Playlist'
    : specs.isKoreanHipHopRnb
    ? '#인스타감성 #느좋 #알앤비 #한국힙합 #칠트랩 #새벽음악 #SunoAI'
    : specs.isEnglishOnly
    ? '#Playlist #MusicProduction #SunoAI #AudioCards'
    : '#플레이리스트 #음악추천 #감성음악 #SunoAI';

  const thumbnailPrompt = specs.isShellacVintage
    ? '1940s antique wooden phonograph playing a spinning shellac 78 RPM record on a polished mahogany table, soft warm amber incandescent glow, atmospheric dust motes floating in light rays, vintage sepia tone, cinematic 16:9 photorealistic 8k'
    : specs.isJapanese
    ? '16:9 Tokyo rainy night view through high-rise apartment window, soft neon reflections on wet glass, warm interior desk lamp, sophisticated urban loneliness, cinematic 35mm photography 8k'
    : specs.isKoreanHipHopRnb
    ? '16:9 aesthetic Korean late night mood, rainy city car window reflections, neon bokeh, moody cinema lighting, 35mm film grain, photorealistic 8k'
    : 'Cinematic 16:9 movie still, melancholic beautiful scene, soft warm golden hour light through sheer curtain, 35mm film aesthetic, photorealistic, 8k resolution --ar 16:9';

  const backgroundImagePrompt = specs.isShellacVintage
    ? '16:9 seamless vintage room loop: antique 1940s gramophone with brass horn, gentle spinning record, warm amber fireplace glow, slow cozy dust particles, relaxing vintage aesthetic'
    : specs.isJapanese
    ? '16:9 seamless loop: Tokyo midnight city lights through raindrop glass window, slow ambient reflections, calm urban atmosphere'
    : specs.isKoreanHipHopRnb
    ? '16:9 seamless loop: late night neon city lights reflecting through car windshield, slow ambient motion, moody aesthetic atmosphere'
    : '16:9 seamless film loop background: warm vintage cinema aesthetic, slow ambient light rays, soft floating dust particles, emotional cozy atmosphere';

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
