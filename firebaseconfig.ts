import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Handle global injection safely for TS
declare global {
  interface Window {
    __firebase_config?: string;
    __app_id?: string;
  }
}

// Check for environment variables (Netlify/Build) or global injection (Runtime)
const envConfig = {
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID || process.env.FIREBASE_APP_ID
};

const defaultFirebaseConfig = {
  apiKey: "demo-key",
  authDomain: "demo.firebaseapp.com",
  projectId: "demo-project",
  storageBucket: "demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

// Logic: Use Env vars -> then Window injection -> then Default
const hasEnvConfig = !!envConfig.apiKey;
const configString = typeof window !== 'undefined' ? window.__firebase_config : null;

let firebaseConfig = defaultFirebaseConfig;
if (hasEnvConfig) {
  firebaseConfig = envConfig as any;
} else if (configString) {
  firebaseConfig = JSON.parse(configString);
}

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const appId = (typeof window !== 'undefined' && window.__app_id) ? window.__app_id : (process.env.REACT_APP_FIREBASE_APP_ID || 'default-app-id');
