"use strict";

const path = require("path");
const { write, mkdir } = require("../utils/files");
const {
  gitignore, firebaseEnvNext, firebaseConfig,
  firebaseConverters, firebaseErrors, useLocalStorage,
  libUtils, globalTypes,
} = require("../templates/shared");

function scaffold(root, name, opts) {
  _createFolders(root, opts);
  _createConfigFiles(root, name, opts);
  _createAppFiles(root, name, opts);
  _createComponents(root, name, opts);
  _createLib(root, name, opts);
  _createServices(root, name);
  _createHooks(root);
  _createTypes(root, opts);
  _createConstants(root, name);
  _createEnvAndDocs(root, name, opts);
}

function _createFolders(root, opts) {
  const dirs = [
    "src/app/(routes)",
    "src/app/components",
    "src/components/ui",
    "src/hooks",
    "src/lib",
    "src/services",
    "src/types",
    "src/constants",
    "public/images",
    "public/icons",
  ];
  if (opts.firebase) {
    dirs.push("src/lib/firebase/hooks");
  }
  dirs.forEach(d => mkdir(path.join(root, d)));
}

function _createConfigFiles(root, name, opts) {
  // package.json
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
      next:        "14.2.3",
      react:       "^18",
      "react-dom": "^18",
      ...(opts.firebase ? { firebase: "^10.12.2" } : {}),
    },
    devDependencies: {
      typescript:           "^5",
      "@types/node":        "^20",
      "@types/react":       "^18",
      "@types/react-dom":   "^18",
      eslint:               "^8",
      "eslint-config-next": "14.2.3",
      "eslint-plugin-comment-cleaner": "^1.1.0",
      ...(opts.tailwind ? {
        tailwindcss:  "^3.4.1",
        postcss:      "^8",
        autoprefixer: "^10.0.1",
      } : {}),
    },
  }, null, 2));

  // tsconfig.json
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

  // next.config.mjs
  write(path.join(root, "next.config.mjs"), `/** @type {import('next').NextConfig} */
const nextConfig = {
  images: { remotePatterns: [] },
};
export default nextConfig;
`);

  // eslint.config.mjs
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

  // Tailwind
  if (opts.tailwind) {
    write(path.join(root, "tailwind.config.ts"), `import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: { extend: { colors: {}, fontFamily: {} } },
  plugins: [],
};
export default config;
`);
    write(path.join(root, "postcss.config.mjs"), `const config = { plugins: { tailwindcss: {}, autoprefixer: {} } };
export default config;
`);
  }
}

function _createAppFiles(root, name, opts) {
  // globals.css
  write(path.join(root, "src/app/globals.css"), opts.tailwind
    ? `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { min-height: 100vh; }\n`
    : `* { box-sizing: border-box; padding: 0; margin: 0; }\nbody { min-height: 100vh; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }\n`
  );

  // layout.tsx
  write(path.join(root, "src/app/layout.tsx"), `import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "${name}",
  description: "Built with create-em-app",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
`);

  // page.tsx — custom homepage
  write(path.join(root, "src/app/page.tsx"), opts.tailwind
    ? `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">${name}</h1>
        <p className="text-gray-400 text-lg mb-8">Your project is ready. Start building.</p>
        <div className="flex gap-4 justify-center">
          <a href="/dashboard" className="bg-white text-gray-950 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition">Get started</a>
          <a href="https://nextjs.org/docs" target="_blank" rel="noopener noreferrer" className="border border-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg hover:border-gray-400 transition">Docs →</a>
        </div>
      </div>
    </main>
  );
}
`
    : `export default function Home() {
  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff" }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ fontSize: "3rem", fontWeight: 700, marginBottom: "1rem" }}>${name}</h1>
        <p style={{ color: "#888" }}>Your project is ready. Start building.</p>
      </div>
    </main>
  );
}
`);

  // loading, error, not-found
  write(path.join(root, "src/app/loading.tsx"), opts.tailwind
    ? `export default function Loading() {\n  return <div className="min-h-screen flex items-center justify-center bg-gray-950"><div className="w-8 h-8 border-4 border-white border-t-transparent rounded-full animate-spin" /></div>;\n}\n`
    : `export default function Loading() {\n  return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}><p>Loading...</p></div>;\n}\n`
  );

  write(path.join(root, "src/app/not-found.tsx"), opts.tailwind
    ? `export default function NotFound() {\n  return <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white"><h1 className="text-6xl font-bold mb-4">404</h1><p className="text-gray-400 mb-6">Page not found.</p><a href="/" className="text-blue-400 hover:underline">Go home</a></main>;\n}\n`
    : `export default function NotFound() {\n  return <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><h1>404</h1><a href="/">Go home</a></main>;\n}\n`
  );

  write(path.join(root, "src/app/error.tsx"), `"use client";
import { useEffect } from "react";
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h2>Something went wrong</h2>
      <button onClick={reset}>Try again</button>
    </main>
  );
}
`);
}

function _createComponents(root, name, opts) {
  // Navbar
  write(path.join(root, "src/components/Navbar.tsx"), opts.tailwind
    ? `import Link from "next/link";\nexport default function Navbar() {\n  return <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between"><Link href="/" className="font-bold text-lg text-white">${name}</Link><div className="flex gap-6 text-sm text-gray-400"><Link href="/" className="hover:text-white transition">Home</Link></div></nav>;\n}\n`
    : `import Link from "next/link";\nexport default function Navbar() {\n  return <nav style={{ borderBottom: "1px solid #2a2a2a", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between" }}><Link href="/" style={{ fontWeight: 700, color: "#fff" }}>${name}</Link></nav>;\n}\n`
  );

  // Button
  write(path.join(root, "src/components/ui/Button.tsx"), opts.tailwind
    ? `import { ButtonHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\n\ninterface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {\n  variant?: "primary" | "secondary" | "ghost";\n  size?: "sm" | "md" | "lg";\n}\n\nexport default function Button({ children, variant = "primary", size = "md", className, ...props }: ButtonProps) {\n  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none disabled:opacity-50";\n  const variants = { primary: "bg-white text-gray-950 hover:bg-gray-200", secondary: "border border-gray-700 text-gray-300 hover:border-gray-400", ghost: "text-gray-400 hover:text-white" };\n  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3 text-base" };\n  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;\n}\n`
    : `import { ButtonHTMLAttributes } from "react";\ninterface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "primary" | "secondary"; }\nexport default function Button({ children, variant = "primary", ...props }: ButtonProps) {\n  return <button style={{ padding: "0.6rem 1.4rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer", background: variant === "primary" ? "#fff" : "transparent", color: variant === "primary" ? "#000" : "#fff", border: variant === "secondary" ? "1px solid #444" : "none" }} {...props}>{children}</button>;\n}\n`
  );

  // Input
  write(path.join(root, "src/components/ui/Input.tsx"), opts.tailwind
    ? `import { InputHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\nexport default function Input({ label, error, className, ...props }: InputProps) {\n  return <div className="flex flex-col gap-1">{label && <label className="text-sm font-medium text-gray-300">{label}</label>}<input className={cn("w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition", error && "border-red-500", className)} {...props} />{error && <p className="text-xs text-red-400">{error}</p>}</div>;\n}\n`
    : `import { InputHTMLAttributes } from "react";\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\nexport default function Input({ label, error, ...props }: InputProps) {\n  return <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{label && <label style={{ fontSize: "0.85rem", color: "#ccc" }}>{label}</label>}<input style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #333", color: "#fff" }} {...props} />{error && <p style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</p>}</div>;\n}\n`
  );

  // Card
  write(path.join(root, "src/components/ui/Card.tsx"), opts.tailwind
    ? `import { HTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface CardProps extends HTMLAttributes<HTMLDivElement> {}\nexport default function Card({ children, className, ...props }: CardProps) {\n  return <div className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)} {...props}>{children}</div>;\n}\n`
    : `import { HTMLAttributes } from "react";\nexport default function Card({ children, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "1.5rem" }} {...props}>{children}</div>;\n}\n`
  );
}

function _createLib(root, name, opts) {
  write(path.join(root, "src/lib/utils.ts"), libUtils);

  if (opts.firebase) {
    write(path.join(root, "src/lib/firebase/config.ts"),
      firebaseConfig("process.env.NEXT_PUBLIC_"));
    write(path.join(root, "src/lib/firebase/converters.ts"), firebaseConverters);
    write(path.join(root, "src/lib/firebase/errors.ts"),     firebaseErrors);
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

function _createServices(root, name) {
  write(path.join(root, "src/services/api.ts"), `const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "";

async function request<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(\`\${BASE_URL}\${endpoint}\`, { headers: { "Content-Type": "application/json" }, ...options });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return { data: null, error: body.message ?? \`Error \${res.status}\` };
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
  write(path.join(root, "README.md"), `# ${name}\n\n> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)\n\n## Getting Started\n\n\`\`\`bash\nnpm install\n${opts.firebase ? "cp .env.example .env.local\n" : ""}npm run dev\n\`\`\`\n`);
}

module.exports = { scaffold };
