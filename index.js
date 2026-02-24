#!/usr/bin/env node

/**
 * create-em-app
 * Scaffold a new project the right way.
 * Next.js · React + Vite · Node.js API
 * TypeScript · Tailwind · Firebase · ESLint + comment-cleaner
 */

"use strict";

const fs           = require("fs");
const path         = require("path");
const readline     = require("readline");
const { execSync } = require("child_process");

// ─── ANSI Colors ──────────────────────────────────────────────────────────────
const c = {
  reset: "\x1b[0m", bold: "\x1b[1m", dim: "\x1b[2m",
  red: "\x1b[31m", green: "\x1b[32m", yellow: "\x1b[33m",
  blue: "\x1b[34m", cyan: "\x1b[36m", magenta: "\x1b[35m",
};
const paint = (col, t) => `${col}${t}${c.reset}`;
const log   = (msg = "") => console.log(msg);
const info  = (msg) => log(paint(c.cyan,           `  ${msg}`));
const ok    = (msg) => log(paint(c.green,          `  ✅ ${msg}`));
const step  = (msg) => log(paint(c.magenta + c.bold, `\n  ▶ ${msg}`));
const header= (msg) => log(paint(c.cyan + c.bold,  msg));
const spin  = (msg) => process.stdout.write(paint(c.yellow, `  ⏳ ${msg}...`));
const done  = ()    => process.stdout.write(paint(c.green, " done\n"));

// ─── Readline helpers ─────────────────────────────────────────────────────────
function createRL() {
  return readline.createInterface({ input: process.stdin, output: process.stdout });
}
function ask(rl, question) {
  return new Promise(res => rl.question(question, res));
}
async function askChoice(rl, question, choices) {
  log();
  log(paint(c.bold, `  ${question}`));
  choices.forEach((ch, i) => log(paint(c.cyan, `    ${i + 1}. ${ch}`)));
  while (true) {
    const ans = (await ask(rl, paint(c.dim, `\n  Enter number (1-${choices.length}): `))).trim();
    const idx = parseInt(ans) - 1;
    if (idx >= 0 && idx < choices.length) return choices[idx];
    log(paint(c.red, `  Please enter a number between 1 and ${choices.length}`));
  }
}
async function askYesNo(rl, question) {
  const ans = (await ask(rl, paint(c.bold, `  ${question} `) + paint(c.dim, "(y/n): "))).trim().toLowerCase();
  return ans === "y" || ans === "yes" || ans === "";
}

// ─── File helpers ─────────────────────────────────────────────────────────────
function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}
function mkdir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}
function run(cmd, cwd) {
  execSync(cmd, { cwd, stdio: "pipe" });
}

// ─── Tree printer ─────────────────────────────────────────────────────────────
function printTree(root, prefix = "", depth = 0) {
  if (depth > 4) return;
  let entries;
  try { entries = fs.readdirSync(root, { withFileTypes: true }); } catch { return; }
  const filtered = entries.filter(e => !["node_modules", ".git", ".next"].includes(e.name));
  filtered.forEach((entry, idx) => {
    const isLast    = idx === filtered.length - 1;
    const connector = isLast ? "└── " : "├── ";
    const col       = entry.isDirectory() ? c.cyan : c.dim;
    log(paint(c.dim, `  ${prefix}${connector}`) + paint(col, entry.name));
    if (entry.isDirectory()) {
      printTree(path.join(root, entry.name), prefix + (isLast ? "    " : "│   "), depth + 1);
    }
  });
}

// ═════════════════════════════════════════════════════════════════════════════
// NEXT.JS SCAFFOLD
// ═════════════════════════════════════════════════════════════════════════════
function scaffoldNextjs(root, name, opts) {

  // ── package.json ──────────────────────────────────────────────────────────
  write(path.join(root, "package.json"), JSON.stringify({
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev:   "next dev",
      build: "next build",
      start: "next start",
      lint:  "next lint",
    },
    dependencies: {
      next:       "14.2.3",
      react:      "^18",
      "react-dom":"^18",
      ...(opts.firebase ? {
        firebase: "^10.12.2",
      } : {}),
    },
    devDependencies: {
      typescript:          "^5",
      "@types/node":       "^20",
      "@types/react":      "^18",
      "@types/react-dom":  "^18",
      eslint:              "^8",
      "eslint-config-next":"14.2.3",
      "eslint-plugin-comment-cleaner": "^1.1.0",
      ...(opts.tailwind ? {
        tailwindcss:  "^3.4.1",
        postcss:      "^8",
        autoprefixer: "^10.0.1",
      } : {}),
    },
  }, null, 2));

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  write(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      lib:                    ["dom", "dom.iterable", "esnext"],
      allowJs:                true,
      skipLibCheck:           true,
      strict:                 true,
      noEmit:                 true,
      esModuleInterop:        true,
      module:                 "esnext",
      moduleResolution:       "bundler",
      resolveJsonModule:      true,
      isolatedModules:        true,
      jsx:                    "preserve",
      incremental:            true,
      plugins:                [{ name: "next" }],
      paths:                  { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2));

  // ── next.config.ts ────────────────────────────────────────────────────────
  write(path.join(root, "next.config.ts"), `import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
`);

  // ── ESLint flat config ────────────────────────────────────────────────────
  write(path.join(root, "eslint.config.mjs"), `import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import commentCleaner from "eslint-plugin-comment-cleaner";

const __filename = fileURLToPath(import.meta.url);
const __dirname  = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    plugins: { "comment-cleaner": commentCleaner },
    rules: {
      "comment-cleaner/no-commented-code":    "warn",
      "comment-cleaner/no-commented-imports": "warn",
    },
  },
];

export default eslintConfig;
`);

  // ── Tailwind ──────────────────────────────────────────────────────────────
  if (opts.tailwind) {
    write(path.join(root, "tailwind.config.ts"), `import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {},
      fontFamily: {},
    },
  },
  plugins: [],
};

export default config;
`);

    write(path.join(root, "postcss.config.mjs"), `/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    tailwindcss:  {},
    autoprefixer: {},
  },
};

export default config;
`);
  }

  // ── .gitignore ────────────────────────────────────────────────────────────
  write(path.join(root, ".gitignore"), `# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local
.env

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
`);

  // ── .env.example ─────────────────────────────────────────────────────────
  write(path.join(root, ".env.example"), `# Copy this file to .env.local and fill in your values
NEXT_PUBLIC_APP_NAME="${name}"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
${opts.firebase ? `
# Firebase — get these from your Firebase project settings
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=""
NEXT_PUBLIC_FIREBASE_PROJECT_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_APP_ID=""
` : ""}`);

  // ── src/app/globals.css ───────────────────────────────────────────────────
  write(path.join(root, "src/app/globals.css"), opts.tailwind
    ? `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Custom base styles ───────────────────────────────────── */
* {
  box-sizing: border-box;
}

body {
  min-height: 100vh;
}
`
    : `* {
  box-sizing: border-box;
  padding: 0;
  margin: 0;
}

body {
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
`);

  // ── src/app/layout.tsx ────────────────────────────────────────────────────
  write(path.join(root, "src/app/layout.tsx"), `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name}",
  description: "Built with create-em-app",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
`);

  // ── src/app/page.tsx — custom homepage, not default Next.js ──────────────
  write(path.join(root, "src/app/page.tsx"), opts.tailwind
    ? `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          ${name}
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Your project is ready. Start building.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="bg-white text-gray-950 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Get started
          </a>
          <a
            href="https://nextjs.org/docs"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg hover:border-gray-400 transition"
          >
            Docs →
          </a>
        </div>
      </div>
    </main>
  );
}
`
    : `export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem" }}>
          ${name}
        </h1>
        <p style={{ color: "#888", fontSize: "1.1rem", marginBottom: "2rem" }}>
          Your project is ready. Start building.
        </p>
      </div>
    </main>
  );
}
`);

  // ── src/app/not-found.tsx ─────────────────────────────────────────────────
  write(path.join(root, "src/app/not-found.tsx"), opts.tailwind
    ? `export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-gray-400 mb-6">Page not found.</p>
      <a href="/" className="text-blue-400 hover:underline">Go home</a>
    </main>
  );
}
`
    : `export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1>404 — Page not found</h1>
      <a href="/">Go home</a>
    </main>
  );
}
`);

  // ── src/app/loading.tsx ───────────────────────────────────────────────────
  write(path.join(root, "src/app/loading.tsx"), opts.tailwind
    ? `export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950">
      <div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
`
    : `export default function Loading() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p>Loading...</p>
    </div>
  );
}
`);

  // ── src/app/error.tsx ─────────────────────────────────────────────────────
  write(path.join(root, "src/app/error.tsx"), `"use client";

import { useEffect } from "react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
`);

  // ── Components ────────────────────────────────────────────────────────────
  // ui/Button.tsx
  write(path.join(root, "src/components/ui/Button.tsx"), opts.tailwind
    ? `import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none disabled:opacity-50";
  const variants = {
    primary:   "bg-white text-gray-950 hover:bg-gray-200",
    secondary: "border border-gray-700 text-gray-300 hover:border-gray-400",
    ghost:     "text-gray-400 hover:text-white",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
`
    : `import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({ children, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      style={{
        padding: "0.6rem 1.4rem",
        borderRadius: "8px",
        fontWeight: 600,
        cursor: "pointer",
        background: variant === "primary" ? "#fff" : "transparent",
        color: variant === "primary" ? "#000" : "#fff",
        border: variant === "secondary" ? "1px solid #444" : "none",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
`);

  // ui/Input.tsx
  write(path.join(root, "src/components/ui/Input.tsx"), opts.tailwind
    ? `import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        className={cn(
          "w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
`
    : `import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && <label style={{ fontSize: "0.85rem", color: "#ccc" }}>{label}</label>}
      <input
        style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #333", color: "#fff" }}
        {...props}
      />
      {error && <p style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</p>}
    </div>
  );
}
`);

  // ui/Card.tsx
  write(path.join(root, "src/components/ui/Card.tsx"), opts.tailwind
    ? `import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div
      className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)}
      {...props}
    >
      {children}
    </div>
  );
}
`
    : `import { HTMLAttributes } from "react";

export default function Card({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "1.5rem" }} {...props}>
      {children}
    </div>
  );
}
`);

  // Navbar.tsx
  write(path.join(root, "src/components/Navbar.tsx"), opts.tailwind
    ? `import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="font-bold text-lg text-white">
        ${name}
      </Link>
      <div className="flex gap-6 text-sm text-gray-400">
        <Link href="/" className="hover:text-white transition">Home</Link>
      </div>
    </nav>
  );
}
`
    : `import Link from "next/link";

export default function Navbar() {
  return (
    <nav style={{ borderBottom: "1px solid #2a2a2a", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between" }}>
      <Link href="/" style={{ fontWeight: 700, color: "#fff" }}>${name}</Link>
    </nav>
  );
}
`);

  // ── lib/utils.ts ──────────────────────────────────────────────────────────
  write(path.join(root, "src/lib/utils.ts"), `/**
 * Merge class names — lightweight alternative to clsx + tailwind-merge
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

/**
 * Format a date to a readable string
 */
export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * Capitalize first letter
 */
export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Sleep for n milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
`);

  // ── lib/firebase ──────────────────────────────────────────────────────────
  if (opts.firebase) {
    write(path.join(root, "src/lib/firebase/config.ts"), `import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain:        process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId:         process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket:     process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId:             process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};

// Prevent re-initializing on hot reload in dev
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db:      Firestore        = getFirestore(app);
export const auth:    Auth             = getAuth(app);
export const storage: FirebaseStorage  = getStorage(app);
export default app;
`);

    write(path.join(root, "src/lib/firebase/converters.ts"), `import {
  DocumentData,
  QueryDocumentSnapshot,
  SnapshotOptions,
  WithFieldValue,
} from "firebase/firestore";

/**
 * Generic Firestore converter — gives you type-safe reads/writes.
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
`);

    write(path.join(root, "src/lib/firebase/errors.ts"), `/**
 * Convert a Firebase error code into a human-readable message.
 */
export function getFirebaseErrorMessage(code: string): string {
  const messages: Record<string, string> = {
    "auth/user-not-found":        "No account found with this email.",
    "auth/wrong-password":        "Incorrect password.",
    "auth/email-already-in-use":  "An account with this email already exists.",
    "auth/invalid-email":         "Please enter a valid email address.",
    "auth/weak-password":         "Password must be at least 6 characters.",
    "auth/too-many-requests":     "Too many attempts. Please try again later.",
    "auth/network-request-failed":"Network error. Check your connection.",
    "permission-denied":          "You don't have permission to do that.",
    "not-found":                  "The requested resource was not found.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}
`);

    write(path.join(root, "src/lib/firebase/hooks/useAuth.ts"), `"use client";

import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config";

interface UseAuthReturn {
  user:    User | null;
  loading: boolean;
}

/**
 * Hook that returns the current Firebase authenticated user.
 *
 * Usage:
 *   const { user, loading } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
`);
  }

  // ── hooks ─────────────────────────────────────────────────────────────────
  write(path.join(root, "src/hooks/useLocalStorage.ts"), `"use client";

import { useState } from "react";

/**
 * Like useState but persisted to localStorage.
 *
 * Usage:
 *   const [theme, setTheme] = useLocalStorage("theme", "dark");
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    if (typeof window === "undefined") return initialValue;
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
`);

  // ── types ─────────────────────────────────────────────────────────────────
  write(path.join(root, "src/types/index.ts"), `// ─── Global TypeScript types ────────────────────────────────────────────────

export interface ApiResponse<T> {
  data:    T | null;
  error:   string | null;
  success: boolean;
}

export interface PaginatedResponse<T> {
  items:      T[];
  total:      number;
  page:       number;
  pageSize:   number;
  hasMore:    boolean;
}
${opts.firebase ? `
export interface BaseDocument {
  id:        string;
  createdAt: Date;
  updatedAt: Date;
}
` : ""}
`);

  // ── constants ─────────────────────────────────────────────────────────────
  write(path.join(root, "src/constants/index.ts"), `export const APP_NAME    = "${name}";
export const APP_URL     = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const ROUTES = {
  home:      "/",
  dashboard: "/dashboard",
  signin:    "/signin",
  signup:    "/signup",
} as const;
`);

  // ── services ──────────────────────────────────────────────────────────────
  write(path.join(root, "src/services/api.ts"), `/**
 * Base API helper — wraps fetch with error handling and typed responses.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(\`\${BASE_URL}\${endpoint}\`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.message ?? \`Error \${res.status}\` };
    }

    const data = await res.json() as T;
    return { data, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  }
}

export const api = {
  get:    <T>(url: string, options?: RequestInit) => request<T>(url, { method: "GET",    ...options }),
  post:   <T>(url: string, body: unknown, options?: RequestInit) => request<T>(url, { method: "POST",   body: JSON.stringify(body), ...options }),
  put:    <T>(url: string, body: unknown, options?: RequestInit) => request<T>(url, { method: "PUT",    body: JSON.stringify(body), ...options }),
  delete: <T>(url: string, options?: RequestInit) => request<T>(url, { method: "DELETE", ...options }),
};
`);

  // ── README ────────────────────────────────────────────────────────────────
  write(path.join(root, "README.md"), `# ${name}

> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)

## Stack

- Next.js 14 (App Router)
- TypeScript
${opts.tailwind ? "- Tailwind CSS\n" : ""}\
${opts.firebase ? "- Firebase\n" : ""}\
- ESLint + comment-cleaner

## Getting Started

\`\`\`bash
npm install
${opts.firebase ? "cp .env.example .env.local  # add your Firebase keys\n" : ""}\
npm run dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

\`\`\`
src/
├── app/               # Next.js App Router pages and layouts
├── components/
│   ├── ui/            # Reusable UI primitives (Button, Input, Card)
│   └── Navbar.tsx
├── hooks/             # Custom React hooks
├── lib/
│   ├── utils.ts       # Utility functions (cn, formatDate, etc.)
│   ${opts.firebase ? "└── firebase/      # Firebase config, converters, error helpers, useAuth hook" : ""}
├── services/
│   └── api.ts         # Typed fetch wrapper
├── types/             # Global TypeScript types
└── constants/         # App-wide constants and routes
\`\`\`

## Lint

\`\`\`bash
npm run lint           # check for issues
npx eslint ./src --fix # auto-fix commented-out code
\`\`\`
`);
}

// ═════════════════════════════════════════════════════════════════════════════
// REACT + VITE SCAFFOLD
// ═════════════════════════════════════════════════════════════════════════════
function scaffoldReactVite(root, name, opts) {

  // ── Folders ───────────────────────────────────────────────────────────────
  const dirs = [
    "src/components/ui",
    "src/hooks",
    "src/contexts",
    "src/lib",
    "src/pages",
    "src/services",
    "src/types",
    "src/constants",
    "src/assets",
    "public",
  ];
  if (opts.firebase) dirs.push("src/lib/firebase", "src/lib/firebase/hooks");
  dirs.forEach(d => mkdir(path.join(root, d)));

  // ── package.json ──────────────────────────────────────────────────────────
  write(path.join(root, "package.json"), JSON.stringify({
    name,
    version: "0.1.0",
    private: true,
    type: "module",
    scripts: {
      dev:     "vite",
      build:   "tsc && vite build",
      preview: "vite preview",
      lint:    "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
    },
    dependencies: {
      react:            "^18",
      "react-dom":      "^18",
      "react-router-dom": "^6",
      ...(opts.firebase ? { firebase: "^10.12.2" } : {}),
    },
    devDependencies: {
      "@types/react":             "^18",
      "@types/react-dom":         "^18",
      "@vitejs/plugin-react":     "^4",
      typescript:                 "^5",
      vite:                       "^5",
      eslint:                     "^8",
      "eslint-plugin-comment-cleaner": "^1.1.0",
      ...(opts.tailwind ? {
        tailwindcss:  "^3.4.1",
        postcss:      "^8",
        autoprefixer: "^10.0.1",
      } : {}),
    },
  }, null, 2));

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  write(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target:                   "ES2020",
      useDefineForClassFields:  true,
      lib:                      ["ES2020", "DOM", "DOM.Iterable"],
      module:                   "ESNext",
      skipLibCheck:             true,
      moduleResolution:         "bundler",
      allowImportingTsExtensions: true,
      resolveJsonModule:        true,
      isolatedModules:          true,
      noEmit:                   true,
      jsx:                      "react-jsx",
      strict:                   true,
      noUnusedLocals:           true,
      noUnusedParameters:       true,
      noFallthroughCasesInSwitch: true,
      baseUrl:                  ".",
      paths:                    { "@/*": ["./src/*"] },
    },
    include:    ["src"],
    references: [{ path: "./tsconfig.node.json" }],
  }, null, 2));

  write(path.join(root, "tsconfig.node.json"), JSON.stringify({
    compilerOptions: {
      composite:                  true,
      skipLibCheck:               true,
      module:                     "ESNext",
      moduleResolution:           "bundler",
      allowSyntheticDefaultImports: true,
    },
    include: ["vite.config.ts"],
  }, null, 2));

  // ── vite.config.ts ────────────────────────────────────────────────────────
  write(path.join(root, "vite.config.ts"), `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
`);

  // ── ESLint ────────────────────────────────────────────────────────────────
  write(path.join(root, "eslint.config.mjs"), `import commentCleaner from "eslint-plugin-comment-cleaner";

export default [
  {
    plugins: { "comment-cleaner": commentCleaner },
    rules: {
      "comment-cleaner/no-commented-code":    "warn",
      "comment-cleaner/no-commented-imports": "warn",
    },
  },
];
`);

  // ── Tailwind ──────────────────────────────────────────────────────────────
  if (opts.tailwind) {
    write(path.join(root, "tailwind.config.ts"), `import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {},
      fontFamily: {},
    },
  },
  plugins: [],
};

export default config;
`);
    write(path.join(root, "postcss.config.mjs"), `export default {
  plugins: {
    tailwindcss:  {},
    autoprefixer: {},
  },
};
`);
    write(path.join(root, "src/index.css"), `@tailwind base;
@tailwind components;
@tailwind utilities;

/* ── Custom base styles ─────────────────────────────────── */
* {
  box-sizing: border-box;
}

body {
  min-height: 100vh;
  margin: 0;
}
`);
  }

  // ── index.html ────────────────────────────────────────────────────────────
  write(path.join(root, "index.html"), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${name}</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

  // ── main.tsx ──────────────────────────────────────────────────────────────
  write(path.join(root, "src/main.tsx"), `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
${opts.tailwind ? `import "./index.css";\n` : ""}
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`);

  // ── App.tsx — router wired up ─────────────────────────────────────────────
  write(path.join(root, "src/App.tsx"), `import { Routes, Route } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
`);

  // ── pages/Home.tsx ────────────────────────────────────────────────────────
  write(path.join(root, "src/pages/Home.tsx"), opts.tailwind
    ? `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          ${name}
        </h1>
        <p className="text-gray-400 text-lg mb-8">
          Your project is ready. Start building.
        </p>
        <div className="flex gap-4 justify-center">
          <a
            href="/dashboard"
            className="bg-white text-gray-950 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition"
          >
            Get started
          </a>
          <a
            href="https://vitejs.dev/guide/"
            target="_blank"
            rel="noopener noreferrer"
            className="border border-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg hover:border-gray-400 transition"
          >
            Docs →
          </a>
        </div>
      </div>
    </main>
  );
}
`
    : `export default function Home() {
  return (
    <main style={{
      minHeight: "100vh",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      justifyContent: "center",
      background: "#0a0a0a",
      color: "#fff",
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 480 }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem" }}>
          ${name}
        </h1>
        <p style={{ color: "#888", fontSize: "1.1rem", marginBottom: "2rem" }}>
          Your project is ready. Start building.
        </p>
      </div>
    </main>
  );
}
`);

  // ── pages/NotFound.tsx ────────────────────────────────────────────────────
  write(path.join(root, "src/pages/NotFound.tsx"), opts.tailwind
    ? `import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-gray-400 mb-6">Page not found.</p>
      <Link to="/" className="text-blue-400 hover:underline">Go home</Link>
    </main>
  );
}
`
    : `import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1>404 — Page not found</h1>
      <Link to="/">Go home</Link>
    </main>
  );
}
`);

  // ── components/Navbar.tsx ─────────────────────────────────────────────────
  write(path.join(root, "src/components/Navbar.tsx"), opts.tailwind
    ? `import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-950">
      <Link to="/" className="font-bold text-lg text-white">
        ${name}
      </Link>
      <div className="flex gap-6 text-sm text-gray-400">
        <Link to="/" className="hover:text-white transition">Home</Link>
      </div>
    </nav>
  );
}
`
    : `import { Link } from "react-router-dom";

export default function Navbar() {
  return (
    <nav style={{ borderBottom: "1px solid #2a2a2a", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", background: "#0a0a0a" }}>
      <Link to="/" style={{ fontWeight: 700, color: "#fff", textDecoration: "none" }}>${name}</Link>
    </nav>
  );
}
`);

  // ── components/ui/Button.tsx ──────────────────────────────────────────────
  write(path.join(root, "src/components/ui/Button.tsx"), opts.tailwind
    ? `import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md" | "lg";
}

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className,
  ...props
}: ButtonProps) {
  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none disabled:opacity-50";
  const variants = {
    primary:   "bg-white text-gray-950 hover:bg-gray-200",
    secondary: "border border-gray-700 text-gray-300 hover:border-gray-400",
    ghost:     "text-gray-400 hover:text-white",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5 text-sm",
    lg: "px-7 py-3 text-base",
  };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </button>
  );
}
`
    : `import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export default function Button({ children, variant = "primary", ...props }: ButtonProps) {
  return (
    <button
      style={{
        padding: "0.6rem 1.4rem",
        borderRadius: "8px",
        fontWeight: 600,
        cursor: "pointer",
        background: variant === "primary" ? "#fff" : "transparent",
        color: variant === "primary" ? "#000" : "#fff",
        border: variant === "secondary" ? "1px solid #444" : "none",
      }}
      {...props}
    >
      {children}
    </button>
  );
}
`);

  // ── components/ui/Input.tsx ───────────────────────────────────────────────
  write(path.join(root, "src/components/ui/Input.tsx"), opts.tailwind
    ? `import { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, className, ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm font-medium text-gray-300">{label}</label>}
      <input
        className={cn(
          "w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition",
          error && "border-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
`
    : `import { InputHTMLAttributes } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export default function Input({ label, error, ...props }: InputProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      {label && <label style={{ fontSize: "0.85rem", color: "#ccc" }}>{label}</label>}
      <input style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #333", color: "#fff" }} {...props} />
      {error && <p style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</p>}
    </div>
  );
}
`);

  // ── components/ui/Card.tsx ────────────────────────────────────────────────
  write(path.join(root, "src/components/ui/Card.tsx"), opts.tailwind
    ? `import { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface CardProps extends HTMLAttributes<HTMLDivElement> {}

export default function Card({ children, className, ...props }: CardProps) {
  return (
    <div className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)} {...props}>
      {children}
    </div>
  );
}
`
    : `import { HTMLAttributes } from "react";

export default function Card({ children, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "1.5rem" }} {...props}>
      {children}
    </div>
  );
}
`);

  // ── lib/utils.ts ──────────────────────────────────────────────────────────
  write(path.join(root, "src/lib/utils.ts"), `/**
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
`);

  // ── lib/firebase ──────────────────────────────────────────────────────────
  if (opts.firebase) {
    write(path.join(root, "src/lib/firebase/config.ts"), `import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import { getFirestore, type Firestore } from "firebase/firestore";
import { getAuth, type Auth } from "firebase/auth";
import { getStorage, type FirebaseStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY as string,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID as string,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID as string,
};

// Prevent re-initializing on hot reload
const app: FirebaseApp = getApps().length === 0
  ? initializeApp(firebaseConfig)
  : getApps()[0];

export const db:      Firestore       = getFirestore(app);
export const auth:    Auth            = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
`);

    write(path.join(root, "src/lib/firebase/converters.ts"), `import {
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
`);

    write(path.join(root, "src/lib/firebase/errors.ts"), `/**
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
    "permission-denied":           "You don\\'t have permission to do that.",
    "not-found":                   "The requested resource was not found.",
  };
  return messages[code] ?? "Something went wrong. Please try again.";
}
`);

    write(path.join(root, "src/lib/firebase/hooks/useAuth.ts"), `import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config";

interface UseAuthReturn {
  user:    User | null;
  loading: boolean;
}

/**
 * Returns the currently authenticated Firebase user.
 *
 * Usage:
 *   const { user, loading } = useAuth();
 */
export function useAuth(): UseAuthReturn {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  return { user, loading };
}
`);
  }

  // ── hooks/useLocalStorage.ts ──────────────────────────────────────────────
  write(path.join(root, "src/hooks/useLocalStorage.ts"), `import { useState } from "react";

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
`);

  // ── services/api.ts ───────────────────────────────────────────────────────
  write(path.join(root, "src/services/api.ts"), `/**
 * Base API helper — typed fetch wrapper with error handling.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(\`\${BASE_URL}\${endpoint}\`, {
      headers: { "Content-Type": "application/json" },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: (body as { message?: string }).message ?? \`Error \${res.status}\` };
    }
    return { data: await res.json() as T, error: null };
  } catch (err) {
    return { data: null, error: err instanceof Error ? err.message : "Network error" };
  }
}

export const api = {
  get:    <T>(url: string, opts?: RequestInit) =>
    request<T>(url, { method: "GET", ...opts }),
  post:   <T>(url: string, body: unknown, opts?: RequestInit) =>
    request<T>(url, { method: "POST", body: JSON.stringify(body), ...opts }),
  put:    <T>(url: string, body: unknown, opts?: RequestInit) =>
    request<T>(url, { method: "PUT",  body: JSON.stringify(body), ...opts }),
  delete: <T>(url: string, opts?: RequestInit) =>
    request<T>(url, { method: "DELETE", ...opts }),
};
`);

  // ── types/index.ts ────────────────────────────────────────────────────────
  write(path.join(root, "src/types/index.ts"), `// ─── Global TypeScript types ────────────────────────────────────────────────

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
${opts.firebase ? `
export interface BaseDocument {
  id:        string;
  createdAt: Date;
  updatedAt: Date;
}
` : ""}
`);

  // ── constants/index.ts ────────────────────────────────────────────────────
  write(path.join(root, "src/constants/index.ts"), `export const APP_NAME = "${name}";
export const APP_URL  = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";

export const ROUTES = {
  home:      "/",
  dashboard: "/dashboard",
  signin:    "/signin",
  signup:    "/signup",
} as const;
`);

  // ── .gitignore ────────────────────────────────────────────────────────────
  write(path.join(root, ".gitignore"), `# dependencies
node_modules

# build output
dist
dist-ssr

# local env files
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
`);

  // ── .env.example ─────────────────────────────────────────────────────────
  write(path.join(root, ".env.example"), `# Copy this file to .env.local and fill in your values
# Note: Vite only exposes env vars prefixed with VITE_

VITE_APP_NAME="${name}"
VITE_APP_URL="http://localhost:5173"
VITE_API_URL=""
${opts.firebase ? `
# Firebase — get these from your Firebase project settings
VITE_FIREBASE_API_KEY=""
VITE_FIREBASE_AUTH_DOMAIN=""
VITE_FIREBASE_PROJECT_ID=""
VITE_FIREBASE_STORAGE_BUCKET=""
VITE_FIREBASE_MESSAGING_SENDER_ID=""
VITE_FIREBASE_APP_ID=""
` : ""}`);

  // ── README.md ─────────────────────────────────────────────────────────────
  write(path.join(root, "README.md"), `# ${name}

> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)

## Stack

- React 18
- Vite 5
- TypeScript
- React Router v6
${opts.tailwind ? "- Tailwind CSS\n" : ""}\
${opts.firebase ? "- Firebase\n" : ""}\
- ESLint + comment-cleaner

## Getting Started

\`\`\`bash
npm install
${opts.firebase ? "cp .env.example .env.local  # add your Firebase keys\n" : ""}\
npm run dev
\`\`\`

Open [http://localhost:5173](http://localhost:5173)

## Project Structure

\`\`\`
src/
├── components/
│   ├── ui/            # Reusable UI primitives (Button, Input, Card)
│   └── Navbar.tsx
├── pages/
│   ├── Home.tsx       # Home page — rendered at /
│   └── NotFound.tsx   # 404 page — rendered on unknown routes
├── hooks/
│   └── useLocalStorage.ts
├── lib/
│   ├── utils.ts       # cn(), formatDate(), capitalize(), sleep()
${opts.firebase ? `│   └── firebase/
│       ├── config.ts        # db, auth, storage exports
│       ├── converters.ts    # Generic Firestore type converter
│       ├── errors.ts        # Firebase error → readable message
│       └── hooks/
│           └── useAuth.ts   # useAuth() hook
` : ""}\
├── services/
│   └── api.ts         # Typed fetch wrapper (api.get/post/put/delete)
├── types/
│   └── index.ts       # ApiResponse<T>, PaginatedResponse<T>${opts.firebase ? ", BaseDocument" : ""}
├── constants/
│   └── index.ts       # APP_NAME, APP_URL, ROUTES
├── assets/            # Images, SVGs, fonts
├── App.tsx            # Root component with router
└── main.tsx           # Entry point
\`\`\`

## Routing

Routes are defined in \`src/App.tsx\` using React Router v6.
Add new pages in \`src/pages/\` and register them in App.tsx:

\`\`\`tsx
import Dashboard from "@/pages/Dashboard";

// inside <Routes>:
<Route path="/dashboard" element={<Dashboard />} />
\`\`\`

## Components

Reusable UI components live in \`src/components/ui/\`.
Import them anywhere using the \`@\` alias:

\`\`\`tsx
import Button from "@/components/ui/Button";
import Input  from "@/components/ui/Input";
import Card   from "@/components/ui/Card";

<Button variant="primary">Click me</Button>
<Button variant="secondary">Cancel</Button>
<Input label="Email" type="email" placeholder="you@example.com" />
<Card>Content goes here</Card>
\`\`\`
${opts.firebase ? `
## Firebase

Config lives in \`src/lib/firebase/config.ts\`.
Import \`db\`, \`auth\`, or \`storage\` anywhere:

\`\`\`ts
import { db, auth, storage } from "@/lib/firebase/config";
\`\`\`

**Auth hook:**
\`\`\`tsx
import { useAuth } from "@/lib/firebase/hooks/useAuth";

const { user, loading } = useAuth();
\`\`\`

**Type-safe Firestore reads:**
\`\`\`ts
import { createConverter } from "@/lib/firebase/converters";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface User { id: string; name: string; email: string; }

const userConverter = createConverter<User>();
const ref = doc(db, "users", userId).withConverter(userConverter);
const snap = await getDoc(ref);
const user = snap.data(); // typed as User
\`\`\`
` : ""}\
## API Calls

Use the typed fetch wrapper in \`src/services/api.ts\`:

\`\`\`ts
import { api } from "@/services/api";

const { data, error } = await api.get<User[]>("/users");
const { data, error } = await api.post<User>("/users", { name: "Emmanuel" });
\`\`\`

## Lint

\`\`\`bash
npm run lint           # check for issues
npx eslint ./src --fix # auto-remove commented-out code
\`\`\`
`);
}

// ═════════════════════════════════════════════════════════════════════════════
// NODE.JS API SCAFFOLD
// ═════════════════════════════════════════════════════════════════════════════
function scaffoldNodeApi(root, name, opts) {
  ["src/routes","src/controllers","src/middleware","src/models","src/services","src/utils","src/types","src/config","src/constants","tests"].forEach(d => mkdir(path.join(root, d)));
  if (opts.firebase) mkdir(path.join(root, "src/lib/firebase"));

  write(path.join(root, "package.json"), JSON.stringify({ name, version: "0.1.0", private: true, scripts: { dev: "ts-node-dev --respawn --transpile-only src/index.ts", build: "tsc", start: "node dist/index.js", lint: "eslint src --ext .ts" }, dependencies: { express: "^4.18", cors: "^2.8", dotenv: "^16", helmet: "^7", "express-rate-limit": "^7", ...(opts.firebase ? { "firebase-admin": "^12" } : {}) }, devDependencies: { "@types/express": "^4.17", "@types/cors": "^2.8", "@types/node": "^20", typescript: "^5", "ts-node-dev": "^2", eslint: "^8", "@typescript-eslint/eslint-plugin": "^6", "@typescript-eslint/parser": "^6", "eslint-plugin-comment-cleaner": "^1.1.0" } }, null, 2));
  write(path.join(root, "tsconfig.json"), JSON.stringify({ compilerOptions: { target: "ES2020", module: "commonjs", lib: ["ES2020"], outDir: "./dist", rootDir: "./src", strict: true, esModuleInterop: true, skipLibCheck: true, resolveJsonModule: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } }, include: ["src/**/*"], exclude: ["node_modules", "dist"] }, null, 2));
  write(path.join(root, "src/index.ts"), `import express from "express";\nimport cors from "cors";\nimport helmet from "helmet";\nimport { rateLimit } from "express-rate-limit";\nimport dotenv from "dotenv";\ndotenv.config();\nconst app = express();\nconst PORT = process.env.PORT || 3000;\napp.use(helmet()); app.use(cors()); app.use(express.json());\napp.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));\napp.get("/health", (_req, res) => res.json({ status: "ok", app: "${name}" }));\napp.listen(PORT, () => console.log(\`🚀 ${name} on http://localhost:\${PORT}\`));\nexport default app;\n`);
  write(path.join(root, ".gitignore"), `node_modules\ndist\n.env\n.env.local\n.DS_Store\n`);
  write(path.join(root, ".env.example"), `PORT=3000\nNODE_ENV=development\n${opts.firebase ? `FIREBASE_PROJECT_ID=""\nFIREBASE_CLIENT_EMAIL=""\nFIREBASE_PRIVATE_KEY=""\n` : ""}`);
  write(path.join(root, "README.md"), `# ${name}\n\n> Scaffolded with create-em-app\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);
}

// ─── Arg parser ───────────────────────────────────────────────────────────────
function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = { name: null, stack: null, tailwind: false, firebase: false, install: true, help: false };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-h" || a === "--help")   opts.help = true;
    else if (a === "-i" || a === "--interactive") opts.interactive = true;
    else if (a === "--next")            opts.stack = "next";
    else if (a === "--react")           opts.stack = "react";
    else if (a === "--node")            opts.stack = "node";
    else if (a === "--tailwind")        opts.tailwind = true;
    else if (a === "--firebase")        opts.firebase = true;
    else if (a === "--no-install")      opts.install = false;
    else if (!a.startsWith("-"))        opts.name = a;
  }
  return opts;
}

function printHelp() {
  log(`
${paint(c.cyan + c.bold, "create-em-app")} — Scaffold a new project the right way

${paint(c.bold, "Usage:")}
  create-em-app <project-name> [options]
  create-em-app --interactive

${paint(c.bold, "Options:")}
  -i, --interactive   Walk through setup with prompts
  --next              Next.js 14 + TypeScript (App Router)
  --react             React + Vite + TypeScript
  --node              Node.js + Express + TypeScript API
  --tailwind          Include Tailwind CSS
  --firebase          Include Firebase setup
  --no-install        Skip npm install
  -h, --help          Show this help

${paint(c.bold, "Examples:")}
  create-em-app my-app --next --tailwind --firebase
  create-em-app my-api --node --firebase
  create-em-app my-site --react --tailwind
  create-em-app --interactive
`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  const opts = parseArgs(process.argv);

  log(paint(c.cyan + c.bold, `
╔══════════════════════════════════════════╗
║     🏗️   create-em-app                   ║
║  Scaffold projects like a pro            ║
╚══════════════════════════════════════════╝`));

  if (opts.help) { printHelp(); process.exit(0); }

  const rl = createRL();

  if (opts.interactive || (!opts.name && !opts.stack)) {
    log();
    if (!opts.name) {
      opts.name = (await ask(rl, paint(c.bold, "  Project name: "))).trim();
    }
    if (!opts.name) { log(paint(c.red, "  Project name is required.")); rl.close(); process.exit(1); }
    const stackChoice = await askChoice(rl, "Which stack?", ["Next.js + TypeScript", "React + Vite + TypeScript", "Node.js API + Express + TypeScript"]);
    opts.stack = stackChoice.startsWith("Next") ? "next" : stackChoice.startsWith("React") ? "react" : "node";
    if (opts.stack !== "node") opts.tailwind = await askYesNo(rl, "Include Tailwind CSS?");
    opts.firebase = await askYesNo(rl, "Include Firebase?");
    opts.install  = await askYesNo(rl, "Run npm install now?");
  }
  rl.close();

  if (!opts.name)  { log(paint(c.red, "\n  ❌ Project name required.\n")); printHelp(); process.exit(1); }
  if (!opts.stack) { log(paint(c.red, "\n  ❌ Stack required. Use --next, --react, or --node.\n")); printHelp(); process.exit(1); }

  const projectName = opts.name.toLowerCase().replace(/\s+/g, "-");
  const root        = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(root)) {
    log(paint(c.red, `\n  ❌ Folder "${projectName}" already exists.\n`));
    process.exit(1);
  }

  log();
  info(`Project  : ${paint(c.bold, projectName)}`);
  info(`Stack    : ${paint(c.bold, opts.stack === "next" ? "Next.js 14 + TypeScript" : opts.stack === "react" ? "React + Vite + TypeScript" : "Node.js API + TypeScript")}`);
  info(`Tailwind : ${opts.tailwind ? paint(c.green, "yes") : paint(c.dim, "no")}`);
  info(`Firebase : ${opts.firebase ? paint(c.green, "yes") : paint(c.dim, "no")}`);
  info(`ESLint   : ${paint(c.green, "yes (comment-cleaner included)")}`);
  log();

  step("Scaffolding files...");
  if      (opts.stack === "next")  scaffoldNextjs(root, projectName, opts);
  else if (opts.stack === "react") scaffoldReactVite(root, projectName, opts);
  else if (opts.stack === "node")  scaffoldNodeApi(root, projectName, opts);
  ok("Files created");

  if (opts.install !== false) {
    step("Installing dependencies...");
    spin("npm install");
    try {
      run("npm install", root);
      done();
      ok("Dependencies installed");
    } catch {
      done();
      log(paint(c.yellow, "\n  ⚠️  npm install failed. Run it manually inside the project folder."));
    }
  }

  log();
  header("  📁 Project structure:");
  log(paint(c.cyan + c.bold, `\n  ${projectName}/`));
  printTree(root);

  log();
  ok(`${projectName} is ready!`);
  log();
  log(paint(c.bold, "  Next steps:"));
  log(paint(c.cyan, `\n    cd ${projectName}`));
  if (opts.install === false) log(paint(c.cyan, `    npm install`));
  if (opts.firebase) log(paint(c.cyan, `    cp .env.example .env.local`));
  log(paint(c.cyan, `    npm run dev`));
  log();
  log(paint(c.dim, `  Scaffolded by create-em-app\n`));
}

main().catch(err => { console.error(err); process.exit(1); });
