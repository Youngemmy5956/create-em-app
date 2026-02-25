"use strict";

const path = require("path");
const { write, mkdir } = require("../utils/files");
const {
  gitignore, firebaseEnvNext, firebaseConfig,
  firebaseConverters, firebaseErrors, useLocalStorage, globalTypes,
} = require("../templates/shared");
const shadcn = require("../templates/shadcn");

function scaffold(root, name, opts) {
  _createFolders(root, opts);
  _createConfigFiles(root, name, opts);
  _createAppFiles(root, name, opts);
  _createComponents(root, name, opts);
  _createLib(root, name, opts);
  _createServices(root);
  _createHooks(root);
  _createTypes(root, opts);
  _createConstants(root, name);
  _createEnvAndDocs(root, name, opts);
}

function _createFolders(root, opts) {
  const dirs = [
    "src/app/(routes)",
    "src/components/ui",
    "src/hooks",
    "src/lib",
    "src/services",
    "src/types",
    "src/constants",
    "public/images",
    "public/icons",
    ".github",
  ];
  if (opts.firebase) dirs.push("src/lib/firebase/hooks");
  dirs.forEach(d => mkdir(path.join(root, d)));
}

function _createConfigFiles(root, name, opts) {
  // ── package.json ────────────────────────────────────────────────────────────
  write(path.join(root, "package.json"), JSON.stringify({
    name,
    version: "0.1.0",
    private: true,
    scripts: {
      dev: "next dev",
      build: "next build",
      start: "next start",
      lint: "next lint",
    },
    dependencies: {
      next: "14.2.3",
      react: "^18",
      "react-dom": "^18",
      // Fonts
      geist: "^1.3.0",
      // Icons
      "lucide-react": "^0.400.0",
      ...(opts.shadcn ? {
        // shadcn/ui + Radix primitives
        "@radix-ui/react-slot": "^1.0.2",
        "class-variance-authority": "^0.7.0",
        clsx: "^2.1.1",
        "tailwind-merge": "^2.3.0",
        "tailwindcss-animate": "^1.0.7",
      } : {
        clsx: "^2.1.1",
        "tailwind-merge": "^2.3.0",
      }),
      ...(opts.firebase ? { firebase: "^10.12.2" } : {}),
    },
    devDependencies: {
      typescript: "^5",
      "@types/node": "^20",
      "@types/react": "^18",
      "@types/react-dom": "^18",
      eslint: "^8",
      "eslint-config-next": "14.2.3",
      "eslint-plugin-comment-cleaner": "^1.1.0",
      tailwindcss: "^3.4.1",
      postcss: "^8",
      autoprefixer: "^10.0.1",
    },
  }, null, 2));

  // ── tsconfig.json ────────────────────────────────────────────────────────────
  write(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      lib: ["dom", "dom.iterable", "esnext"],
      allowJs: true, skipLibCheck: true, strict: true, noEmit: true,
      esModuleInterop: true, module: "esnext", moduleResolution: "bundler",
      resolveJsonModule: true, isolatedModules: true, jsx: "preserve",
      incremental: true, plugins: [{ name: "next" }],
      paths: { "@/*": ["./src/*"] },
    },
    include: ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
    exclude: ["node_modules"],
  }, null, 2));

  // ── next.config.mjs — Turbopack enabled ──────────────────────────────────────
  write(path.join(root, "next.config.mjs"), `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [] },
};
export default nextConfig;
`);

  // ── eslint.config.mjs ────────────────────────────────────────────────────────
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

  // ── Tailwind ─────────────────────────────────────────────────────────────────
  write(path.join(root, "tailwind.config.ts"),
    opts.shadcn ? shadcn.tailwindConfig : `import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist-sans)"],
        mono: ["var(--font-geist-mono)"],
      },
    },
  },
  plugins: [],
};
export default config;
`);

  write(path.join(root, "postcss.config.mjs"),
    `const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };\nexport default config;\n`);

  // ── components.json (shadcn) ─────────────────────────────────────────────────
  if (opts.shadcn) {
    write(path.join(root, "components.json"), shadcn.componentsJson(name));
  }
}

function _createAppFiles(root, name, opts) {
  // ── globals.css ───────────────────────────────────────────────────────────────
  write(path.join(root, "src/app/globals.css"),
    opts.shadcn ? shadcn.globalsCss : `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { min-height: 100vh; }\n`
  );

  // ── layout.tsx — Header and Footer wired in ──────────────────────────────────
  write(path.join(root, "src/app/layout.tsx"),
    opts.shadcn ? shadcn.layoutTsx(name) : `import type { Metadata } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name}",
  description: "Built with create-em-app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={\`\${GeistSans.variable} \${GeistMono.variable}\`}>
      <body className="min-h-screen font-sans antialiased flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
`);

  // ── page.tsx — custom homepage ────────────────────────────────────────────────
  write(path.join(root, "src/app/page.tsx"),
    opts.shadcn ? shadcn.pageTsx(name) : `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">${name}</h1>
        <p className="text-muted-foreground text-lg mb-8">Your project is ready. Start building.</p>
        <div className="flex gap-4 justify-center">
          <a href="/dashboard" className="bg-foreground text-background font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition">Get started</a>
          <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="border font-semibold px-6 py-3 rounded-lg hover:bg-accent transition">Docs →</a>
        </div>
      </div>
    </main>
  );
}
`);

  // ── loading.tsx ───────────────────────────────────────────────────────────────
  write(path.join(root, "src/app/loading.tsx"),
    `export default function Loading() {\n  return <div className="min-h-screen flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-transparent rounded-full animate-spin" /></div>;\n}\n`
  );

  // ── not-found.tsx ─────────────────────────────────────────────────────────────
  write(path.join(root, "src/app/not-found.tsx"),
    `export default function NotFound() {\n  return <main className="min-h-screen flex flex-col items-center justify-center"><h1 className="text-6xl font-bold mb-4">404</h1><p className="text-muted-foreground mb-6">Page not found.</p><a href="/" className="underline">Go home</a></main>;\n}\n`
  );

  // ── error.tsx ─────────────────────────────────────────────────────────────────
  write(path.join(root, "src/app/error.tsx"),
    `"use client";\nimport { useEffect } from "react";\nexport default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {\n  useEffect(() => { console.error(error); }, [error]);\n  return <main className="min-h-screen flex flex-col items-center justify-center gap-4"><h2 className="text-2xl font-semibold">Something went wrong</h2><button onClick={reset} className="underline">Try again</button></main>;\n}\n`
  );
}

function _createComponents(root, name, opts) {
  if (opts.shadcn) {
    // ── Header (shadcn) ───────────────────────────────────────────────────────
    write(path.join(root, "src/components/Header.tsx"), shadcn.headerTsx(name));

    // ── Footer (shadcn) ───────────────────────────────────────────────────────
    write(path.join(root, "src/components/Footer.tsx"), shadcn.footerTsx(name));

    // ── Pre-built shadcn/ui components ────────────────────────────────────────
    write(path.join(root, "src/components/ui/button.tsx"), shadcn.buttonComponent);
    write(path.join(root, "src/components/ui/card.tsx"), shadcn.cardComponent);
    write(path.join(root, "src/components/ui/input.tsx"), shadcn.inputComponent);
    write(path.join(root, "src/components/ui/badge.tsx"), shadcn.badgeComponent);
  } else {
    // ── Header (plain Tailwind) ───────────────────────────────────────────────
    write(path.join(root, "src/components/Header.tsx"), `import Link from "next/link";

/**
 * Header — modify this to customize your site header.
 * Already wired into layout.tsx, no extra setup needed.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link href="/" className="font-bold text-lg">${name}</Link>
        <nav className="flex items-center gap-6 text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground transition">Home</Link>
          <Link href="/about" className="hover:text-foreground transition">About</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link href="/signin" className="text-sm font-medium hover:underline">Sign in</Link>
          <Link href="/signup" className="text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition">Get started</Link>
        </div>
      </div>
    </header>
  );
}
`);

    // ── Footer (plain Tailwind) ───────────────────────────────────────────────
    write(path.join(root, "src/components/Footer.tsx"), `import Link from "next/link";

/**
 * Footer — modify this to customize your site footer.
 * Already wired into layout.tsx, no extra setup needed.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link href="/" className="font-bold text-lg">${name}</Link>
            <p className="mt-2 text-sm text-muted-foreground">Built with create-em-app.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/" className="hover:text-foreground transition">Home</Link></li>
              <li><Link href="/about" className="hover:text-foreground transition">About</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/privacy" className="hover:text-foreground transition">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-foreground transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
          <p>© {year} ${name}. All rights reserved.</p>
          <p>Built with <a href="https://github.com/Youngemmy5956/create-em-app" target="_blank" rel="noopener noreferrer" className="underline hover:text-foreground transition">create-em-app</a></p>
        </div>
      </div>
    </footer>
  );
}
`);

    // ── Plain UI components ───────────────────────────────────────────────────
    write(path.join(root, "src/components/ui/Button.tsx"), `import { ButtonHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg"; }\nexport default function Button({ children, variant = "primary", size = "md", className, ...props }: ButtonProps) {\n  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none disabled:opacity-50";\n  const variants = { primary: "bg-foreground text-background hover:opacity-90", secondary: "border hover:bg-accent", ghost: "text-muted-foreground hover:text-foreground" };\n  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3 text-base" };\n  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;\n}\n`);
    write(path.join(root, "src/components/ui/Input.tsx"), `import { InputHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\nexport default function Input({ label, error, className, ...props }: InputProps) {\n  return <div className="flex flex-col gap-1">{label && <label className="text-sm font-medium">{label}</label>}<input className={cn("w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition", error && "border-destructive", className)} {...props} />{error && <p className="text-xs text-destructive">{error}</p>}</div>;\n}\n`);
    write(path.join(root, "src/components/ui/Card.tsx"), `import { HTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\nexport default function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm p-6", className)} {...props}>{children}</div>;\n}\n`);
  }
}

function _createLib(root, name, opts) {
  // lib/utils.ts — uses clsx + tailwind-merge (shadcn standard)
  write(path.join(root, "src/lib/utils.ts"),
    opts.shadcn ? shadcn.libUtils : `import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string): string {
  return new Date(date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
}

export function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
`);

  if (opts.firebase) {
    write(path.join(root, "src/lib/firebase/config.ts"), firebaseConfig("process.env.NEXT_PUBLIC_"));
    write(path.join(root, "src/lib/firebase/converters.ts"), firebaseConverters);
    write(path.join(root, "src/lib/firebase/errors.ts"), firebaseErrors);
    write(path.join(root, "src/lib/firebase/hooks/useAuth.ts"), `"use client";
import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config";

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, u => { setUser(u); setLoading(false); });
    return () => unsub();
  }, []);
  return { user, loading };
}
`);
  }
}

function _createServices(root) {
  write(path.join(root, "src/services/api.ts"), `const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

async function request<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(\`\${BASE_URL}\${endpoint}\`, { headers: { "Content-Type": "application/json" }, ...options });
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
  get:    <T>(url: string, opts?: RequestInit) => request<T>(url, { method: "GET", ...opts }),
  post:   <T>(url: string, body: unknown, opts?: RequestInit) => request<T>(url, { method: "POST",   body: JSON.stringify(body), ...opts }),
  put:    <T>(url: string, body: unknown, opts?: RequestInit) => request<T>(url, { method: "PUT",    body: JSON.stringify(body), ...opts }),
  delete: <T>(url: string, opts?: RequestInit) => request<T>(url, { method: "DELETE", ...opts }),
};
`);
}

function _createHooks(root) {
  write(path.join(root, "src/hooks/useLocalStorage.ts"), useLocalStorage);
}

function _createTypes(root, opts) {
  write(path.join(root, "src/types/index.ts"), globalTypes(opts.firebase));
}

function _createConstants(root, name) {
  write(path.join(root, "src/constants/index.ts"), `export const APP_NAME = "${name}";
export const APP_URL  = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const ROUTES = {
  home:      "/",
  dashboard: "/dashboard",
  signin:    "/signin",
  signup:    "/signup",
} as const;
`);
}

function _createEnvAndDocs(root, name, opts) {
  write(path.join(root, ".gitignore"), gitignore);
  write(path.join(root, ".env.example"), `NEXT_PUBLIC_APP_NAME="${name}"\nNEXT_PUBLIC_APP_URL="http://localhost:3000"\n${opts.firebase ? firebaseEnvNext : ""}`);
  write(path.join(root, "README.md"), `# ${name}\n\n> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)\n\n## Stack\n\n- Next.js 14 + Turbopack\n- TypeScript\n- Tailwind CSS\n- Geist Font${opts.shadcn ? "\n- shadcn/ui + Radix UI\n- Lucide React" : "\n- Lucide React"}${opts.firebase ? "\n- Firebase" : ""}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\n${opts.firebase ? "cp .env.example .env.local\n" : ""}npm run dev\n\`\`\`\n\n## Before merging any PR, check \`CHECKLIST.md\`\n`);
}

module.exports = { scaffold };