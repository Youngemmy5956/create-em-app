"use strict";

const gitignore = `# dependencies
/node_modules
/.pnp
.pnp.js

# build
dist
build
.next
out

# env
.env
.env.local
.env.*.local

# misc
.DS_Store
*.pem
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# editor
.vscode
.idea
`;

const firebaseEnvNext = `
# Firebase — get these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
`;

const firebaseEnvVite = `
# Firebase — get these from your Firebase project settings
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
`;

const firebaseConfig = (envPrefix) => `import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            ${envPrefix}FIREBASE_API_KEY${envPrefix.includes("import") ? ` as string` : `!`},
  authDomain:        ${envPrefix}FIREBASE_AUTH_DOMAIN${envPrefix.includes("import") ? ` as string` : `!`},
  projectId:         ${envPrefix}FIREBASE_PROJECT_ID${envPrefix.includes("import") ? ` as string` : `!`},
  storageBucket:     ${envPrefix}FIREBASE_STORAGE_BUCKET${envPrefix.includes("import") ? ` as string` : `!`},
  messagingSenderId: ${envPrefix}FIREBASE_MESSAGING_SENDER_ID${envPrefix.includes("import") ? ` as string` : `!`},
  appId:             ${envPrefix}FIREBASE_APP_ID${envPrefix.includes("import") ? ` as string` : `!`},
};

const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db:      Firestore       = getFirestore(app);
export const auth:    Auth            = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
`;

const firebaseConverters = `import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from "firebase/firestore";

/**
 * Generic Firestore converter — type-safe reads and writes.
 *
 * Usage:
 *   const userConverter = createConverter<User>();
 *   const ref = doc(db, "users", id).withConverter(userConverter);
 */
export function createConverter<T extends DocumentData>() {
  return {
    toFirestore(data: WithFieldValue<T>): DocumentData {
      return data;
    },
    fromFirestore(snapshot: QueryDocumentSnapshot, options: SnapshotOptions): T {
      return snapshot.data(options) as T;
    },
  };
}
`;

const firebaseErrors = `/**
 * Convert a Firebase error code into a human-readable message.
 */
export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found":         "No account found with this email.",
    "auth/wrong-password":         "Incorrect password.",
    "auth/email-already-in-use":   "An account with this email already exists.",
    "auth/invalid-email":          "Please enter a valid email address.",
    "auth/weak-password":          "Password must be at least 6 characters.",
    "auth/too-many-requests":      "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Network error. Check your connection.",
    "permission-denied":           "You don't have permission to do that.",
    "not-found":                   "The requested resource was not found.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}
`;

const useLocalStorage = `import { useState } from "react";

/**
 * Like useState but persisted to localStorage.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage("theme", "dark");
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? (JSON.parse(item) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(error);
    }
  };

  return [storedValue, setValue] as const;
}
`;

const libUtils = `/**
 * Merge class names — lightweight cn() utility.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date to a readable string.
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric",
  });
}

/**
 * Capitalize first letter of a string.
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sleep for n milliseconds.
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
`;

const globalTypes = (withFirebase) => `// ─── Global TypeScript types ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T | null;
  error:   string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items:    T[];
  total:    number;
  page:     number;
  pageSize: number;
  hasMore:  boolean;
}
${withFirebase ? `
export interface BaseDocument {
  id:        string;
  createdAt: Date;
  updatedAt: Date;
}
` : ""}`;

module.exports = {
  gitignore,
  firebaseEnvNext,
  firebaseEnvVite,
  firebaseConfig,
  firebaseConverters,
  firebaseErrors,
  useLocalStorage,
  libUtils,
  globalTypes,
};
