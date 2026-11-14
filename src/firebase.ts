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

let app: FirebaseApp | null = null;
export let db: Firestore | null = null;
export let auth: Auth | null = null;
export let hasFirebaseConfig = false;
let connectionTested = false;

function initWithConfig(cfg: FirebaseAppletConfig): boolean {
  if (!cfg.apiKey || !cfg.projectId || !cfg.appId) return false;
  if (app && db && auth) return true;

  app = getApps().length > 0 ? getApps()[0] : initializeApp(cfg);
  db = cfg.firestoreDatabaseId
    ? getFirestore(app, cfg.firestoreDatabaseId)
    : getFirestore(app);
  auth = getAuth(app);
  hasFirebaseConfig = true;
  void testConnection();
  return true;
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

// Synchronous initialization when bundled config or build-time VITE_* env vars are present
initWithConfig(initialConfig);

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
        if (res.ok) {
          const data = await res.json();
          if (data?.configured && data?.config) {
            initWithConfig(data.config);
          }
        }
      } catch (err) {
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
    throw new Error('Firebase 환경 변수(VITE_FIREBASE_*) 또는 설정 파일이 구성되지 않았습니다.');
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
