import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';

export interface FirebaseAppletConfig {
  projectId?: string;
  appId?: string;
  apiKey?: string;
  authDomain?: string;
  firestoreDatabaseId?: string;
  storageBucket?: string;
  messagingSenderId?: string;
}

// Load firebase-applet-config.json optionally so builds succeed even when gitignored on GitHub/Vercel
const localConfigModules = import.meta.glob('../firebase-applet-config.json', { eager: true }) as Record<
  string,
  { default?: FirebaseAppletConfig } & FirebaseAppletConfig
>;
const localFileConfigRaw = Object.values(localConfigModules)[0];
const localFileConfig: FirebaseAppletConfig = localFileConfigRaw?.default || localFileConfigRaw || {};

const envConfig: FirebaseAppletConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || undefined,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || undefined,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || undefined,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || undefined,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || undefined,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || undefined,
  firestoreDatabaseId: import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || undefined,
};

const initialConfig: FirebaseAppletConfig = {
  apiKey: envConfig.apiKey || localFileConfig.apiKey,
  authDomain: envConfig.authDomain || localFileConfig.authDomain,
  projectId: envConfig.projectId || localFileConfig.projectId,
  storageBucket: envConfig.storageBucket || localFileConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || localFileConfig.messagingSenderId,
  appId: envConfig.appId || localFileConfig.appId,
  firestoreDatabaseId: envConfig.firestoreDatabaseId || localFileConfig.firestoreDatabaseId,
};

export interface FirebaseDiagnostics {
  configured: boolean;
  source: 'build-env' | 'local-file' | 'runtime-api' | 'none';
  runtimeApiStatus: number | null;
  runtimeApiReachable: boolean;
  missingKeys: string[];
  initError: string | null;
  hostname: string;
}

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;
export let hasFirebaseConfig = false;
let connectionTested = false;

const diagnostics: FirebaseDiagnostics = {
  configured: false,
  source: 'none',
  runtimeApiStatus: null,
  runtimeApiReachable: false,
  missingKeys: [],
  initError: null,
  hostname: typeof window !== 'undefined' ? window.location.hostname : '',
};

export function getFirebaseDiagnostics(): FirebaseDiagnostics {
  return { ...diagnostics };
}

function initWithConfig(
  cfg: FirebaseAppletConfig,
  source: 'build-env' | 'local-file' | 'runtime-api'
): boolean {
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return false;
  if (app && db && auth) {
    diagnostics.configured = true;
    return true;
  }

  try {
    app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
    db = cfg.firestoreDatabaseId
      ? getFirestore(app, cfg.firestoreDatabaseId)
      : getFirestore(app);
    auth = getAuth(app);
    hasFirebaseConfig = true;
    diagnostics.configured = true;
    diagnostics.source = source;
    diagnostics.initError = null;
    void testConnection();
    return true;
  } catch (err: any) {
    diagnostics.initError = err?.message || String(err);
    console.error('Firebase initialization failed:', err);
    return false;
  }
}

async function testConnection() {
  if (!db || connectionTested) return;
  connectionTested = true;
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

// Synchronous initialization when build-time VITE_* env vars or bundled config are present
if (envConfig.apiKey && envConfig.projectId && envConfig.appId) {
  initWithConfig(initialConfig, 'build-env');
} else if (localFileConfig.apiKey && localFileConfig.projectId && localFileConfig.appId) {
  initWithConfig(initialConfig, 'local-file');
}

let initPromise: Promise<{ db: Firestore | null; auth: Auth | null; configured: boolean }> | null = null;

/**
 * Ensures Firebase SDK is initialized even when Secrets / env vars are injected at runtime on the server
 * (e.g., AI Studio Secrets, Cloud Run, or Vercel runtime env) rather than baked into the Vite bundle at build time.
 */
export async function ensureFirebaseInitialized(): Promise<{
  db: Firestore | null;
  auth: Auth | null;
  configured: boolean;
}> {
  if (db && auth) {
    try {
      await Promise.race([
        auth.authStateReady(),
        new Promise<void>((resolve) => setTimeout(resolve, 1500)),
      ]);
    } catch {}
    return { db, auth, configured: true };
  }

  if (!initPromise) {
    initPromise = (async () => {
      try {
        const res = await fetch('/api/firebase-config', { cache: 'no-store' });
        diagnostics.runtimeApiStatus = res.status;
        if (res.ok) {
          const contentType = res.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            diagnostics.runtimeApiReachable = true;
            const data = await res.json();
            if (Array.isArray(data?.missingKeys)) {
              diagnostics.missingKeys = data.missingKeys;
            }
            if (data?.configured && data?.config) {
              initWithConfig(data.config, 'runtime-api');
            }
          } else {
            diagnostics.runtimeApiReachable = false;
            diagnostics.initError = '서버 설정 API(/api/firebase-config)가 JSON이 아닌 응답을 반환했습니다. 최신 버전 재배포가 필요합니다.';
          }
        }
      } catch (err: any) {
        diagnostics.initError = err?.message || String(err);
        console.warn('Failed to fetch runtime Firebase config:', err);
      }
      if (auth) {
        try {
          await Promise.race([
            auth.authStateReady(),
            new Promise<void>((resolve) => setTimeout(resolve, 1500)),
          ]);
        } catch {}
      }
      if (!db || !auth) {
        initPromise = null; // allow retry on next attempt if failed transiently
      }
      return { db, auth, configured: Boolean(db && auth) };
    })();
  }

  return await initPromise;
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth?.currentUser?.uid,
      email: auth?.currentUser?.email,
      emailVerified: auth?.currentUser?.emailVerified,
      isAnonymous: auth?.currentUser?.isAnonymous,
      tenantId: auth?.currentUser?.tenantId,
      providerInfo:
        auth?.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function signInWithGoogleForAdmin() {
  const { auth: activeAuth } = await ensureFirebaseInitialized();
  if (!activeAuth) {
    const diag = getFirebaseDiagnostics();
    if (!diag.runtimeApiReachable) {
      throw new Error(
        `현재 접속 주소(${diag.hostname})에서 Firebase 설정 API 응답을 받지 못했습니다(상태: ${diag.runtimeApiStatus ?? '연결 실패'}). 브라우저를 새로고침하거나, AI Studio Publish(다시 게시) 또는 GitHub/Vercel 최신 재배포 후 다시 시도해 주세요.`
      );
    }
    if (diag.missingKeys.length > 0) {
      throw new Error(
        `현재 서버(${diag.hostname})에 Firebase 환경 변수가 누락되었습니다: ${diag.missingKeys.join(', ')}. (AI Studio Secrets 외에 Vercel 등 외부 호스팅을 사용 중이라면 해당 호스팅의 Environment Variables에도 동일하게 추가해 주세요.)`
      );
    }
    throw new Error(
      diag.initError
        ? `Firebase 초기화 오류: ${diag.initError}`
        : 'Firebase 환경 변수(VITE_FIREBASE_*) 또는 설정 파일이 구성되지 않았습니다.'
    );
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(activeAuth, provider);
}

export async function signOutFirebase() {
  const { auth: activeAuth } = await ensureFirebaseInitialized();
  if (!activeAuth) return;
  return await signOut(activeAuth);
}
