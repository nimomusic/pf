import { initializeApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, Auth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, Firestore } from 'firebase/firestore';

interface FirebaseAppletConfig {
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

const firebaseConfig: FirebaseAppletConfig = {
  apiKey: envConfig.apiKey || localFileConfig.apiKey,
  authDomain: envConfig.authDomain || localFileConfig.authDomain,
  projectId: envConfig.projectId || localFileConfig.projectId,
  storageBucket: envConfig.storageBucket || localFileConfig.storageBucket,
  messagingSenderId: envConfig.messagingSenderId || localFileConfig.messagingSenderId,
  appId: envConfig.appId || localFileConfig.appId,
  firestoreDatabaseId: envConfig.firestoreDatabaseId || localFileConfig.firestoreDatabaseId,
};

const isFirebaseConfigured = Boolean(firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId);

let app: FirebaseApp | null = null;
let dbInstance: Firestore | null = null;
let authInstance: Auth | null = null;

if (isFirebaseConfigured) {
  app = initializeApp(firebaseConfig);
  dbInstance = firebaseConfig.firestoreDatabaseId
    ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
    : getFirestore(app);
  authInstance = getAuth(app);
}

export const db: Firestore | null = dbInstance;
export const auth: Auth | null = authInstance;
export const hasFirebaseConfig = isFirebaseConfigured;

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
      userId: authInstance?.currentUser?.uid,
      email: authInstance?.currentUser?.email,
      emailVerified: authInstance?.currentUser?.emailVerified,
      isAnonymous: authInstance?.currentUser?.isAnonymous,
      tenantId: authInstance?.currentUser?.tenantId,
      providerInfo:
        authInstance?.currentUser?.providerData?.map((provider) => ({
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

async function testConnection() {
  if (!dbInstance) return;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export async function signInWithGoogleForAdmin() {
  if (!authInstance) {
    throw new Error('Firebase 환경 변수(VITE_FIREBASE_*) 또는 설정 파일이 구성되지 않았습니다.');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  return await signInWithPopup(authInstance, provider);
}

export async function signOutFirebase() {
  if (!authInstance) return;
  return await signOut(authInstance);
}
