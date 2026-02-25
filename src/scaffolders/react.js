"use strict";

const path = require("path");
const { write, mkdir } = require("../utils/files");
const {
  gitignore, firebaseEnvVite, firebaseConverters,
  firebaseErrors, useLocalStorage, globalTypes,
} = require("../templates/shared");
const shadcn = require("../templates/shadcn");

function scaffold(root, name, opts) {
  _createFolders(root, opts);
  _createConfigFiles(root, name, opts);
  _createAppFiles(root, name, opts);
  _createPages(root, name, opts);
  _createComponents(root, name, opts);
  _createLib(root, opts);
  _createServices(root);
  _createHooks(root);
  _createTypes(root, opts);
  _createConstants(root, name);
  _createEnvAndDocs(root, name, opts);
}

function _createFolders(root, opts) {
  const dirs = [
    "src/components/ui",
    "src/hooks",
    "src/lib",
    "src/pages",
    "src/services",
    "src/types",
    "src/constants",
    "src/assets",
    "public",
    ".github",
  ];
  if (opts.firebase) dirs.push("src/lib/firebase/hooks");
  dirs.forEach(d => mkdir(path.join(root, d)));
}

function _createConfigFiles(root, name, opts) {
  // ── package.json ──────────────────────────────────────────────────────────
  write(path.join(root, "package.json"), JSON.stringify({
    name, version: "0.1.0", private: true, type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
      lint: "eslint . --ext ts,tsx",
    },
    dependencies: {
      react: "^18",
      "react-dom": "^18",
      "react-router-dom": "^6",
      "lucide-react": "^0.400.0",
      ...(opts.shadcn ? {
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
      "@types/react": "^18",
      "@types/react-dom": "^18",
      "@vitejs/plugin-react": "^4",
      typescript: "^5",
      vite: "^5",
      eslint: "^8",
      "eslint-plugin-comment-cleaner": "^1.1.0",
      tailwindcss: "^3.4.1",
      postcss: "^8",
      autoprefixer: "^10.0.1",
    },
  }, null, 2));

  // ── tsconfig.json ─────────────────────────────────────────────────────────
  write(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      target: "ES2020", useDefineForClassFields: true,
      lib: ["ES2020", "DOM", "DOM.Iterable"], module: "ESNext",
      skipLibCheck: true, moduleResolution: "bundler",
      allowImportingTsExtensions: true, resolveJsonModule: true,
      isolatedModules: true, noEmit: true, jsx: "react-jsx", strict: true,
      noUnusedLocals: true, noUnusedParameters: true,
      baseUrl: ".", paths: { "@/*": ["./src/*"] },
    },
    include: ["src"], references: [{ path: "./tsconfig.node.json" }],
  }, null, 2));

  write(path.join(root, "tsconfig.node.json"), JSON.stringify({
    compilerOptions: { composite: true, skipLibCheck: true, module: "ESNext", moduleResolution: "bundler", allowSyntheticDefaultImports: true },
    include: ["vite.config.ts"],
  }, null, 2));

  // ── vite.config.ts ────────────────────────────────────────────────────────
  write(path.join(root, "vite.config.ts"), `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: { alias: { "@": path.resolve(__dirname, "./src") } },
});
`);

  // ── eslint.config.mjs ─────────────────────────────────────────────────────
  write(path.join(root, "eslint.config.mjs"), `import commentCleaner from "eslint-plugin-comment-cleaner";
export default [{
  plugins: { "comment-cleaner": commentCleaner },
  rules: {
    "comment-cleaner/no-commented-code":    "warn",
    "comment-cleaner/no-commented-imports": "warn",
  },
}];
`);

  // ── Tailwind ──────────────────────────────────────────────────────────────
  write(path.join(root, "tailwind.config.ts"),
    opts.shadcn ? shadcn.tailwindConfig.replace(
      // React uses different content paths
      `"./src/pages/**/*.{js,ts,jsx,tsx,mdx}",\n    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",\n    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",`,
      `"./index.html",\n    "./src/**/*.{js,ts,jsx,tsx}",`
    ) : `import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: { sans: ["Geist", "sans-serif"], mono: ["Geist Mono", "monospace"] },
    },
  },
  plugins: [],
};
export default config;
`);

  write(path.join(root, "postcss.config.mjs"), `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`);

  // ── globals css ───────────────────────────────────────────────────────────
  write(path.join(root, "src/index.css"),
    opts.shadcn ? shadcn.globalsCss : `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n\n* { box-sizing: border-box; }\nbody { min-height: 100vh; margin: 0; }\n`
  );

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

  // ── components.json (shadcn) ──────────────────────────────────────────────
  if (opts.shadcn) {
    write(path.join(root, "components.json"), JSON.stringify({
      "$schema": "https://ui.shadcn.com/schema.json",
      "style": "default", "rsc": false, "tsx": true,
      "tailwind": { "config": "tailwind.config.ts", "css": "src/index.css", "baseColor": "neutral", "cssVariables": true },
      "aliases": { "components": "@/components", "utils": "@/lib/utils", "ui": "@/components/ui", "lib": "@/lib", "hooks": "@/hooks" },
    }, null, 2));
  }
}

function _createAppFiles(root, name, opts) {
  // ── main.tsx ───────────────────────────────────────────────────────────────
  write(path.join(root, "src/main.tsx"), `import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
`);

  // ── App.tsx — Header and Footer wired in ──────────────────────────────────────
  write(path.join(root, "src/App.tsx"), `import { Routes, Route } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Home from "@/pages/Home";
import NotFound from "@/pages/NotFound";

export default function App() {
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        <Routes>
          <Route path="/"  element={<Home />} />
          <Route path="*"  element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
`);
}

function _createPages(root, name, opts) {
  // ── Home.tsx ──────────────────────────────────────────────────────────────
  write(path.join(root, "src/pages/Home.tsx"), opts.shadcn
    ? `import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-6 px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">${name}</h1>
        <p className="text-muted-foreground text-lg mb-8">Your project is ready. Start building.</p>
        <div className="flex gap-4 justify-center">
          <Button asChild>
            <a href="/dashboard">Get started</a>
          </Button>
          <Button variant="outline" asChild>
            <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer">Docs →</a>
          </Button>
        </div>
      </div>
    </main>
  );
}
`
    : `export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6">
      <div className="text-center max-w-xl">
        <h1 className="text-5xl font-bold tracking-tight mb-4">${name}</h1>
        <p className="text-lg mb-8 opacity-60">Your project is ready. Start building.</p>
        <div className="flex gap-4 justify-center">
          <a href="/dashboard" className="bg-foreground text-background font-semibold px-6 py-3 rounded-lg hover:opacity-90 transition">Get started</a>
          <a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer" className="border font-semibold px-6 py-3 rounded-lg hover:bg-accent transition">Docs →</a>
        </div>
      </div>
    </main>
  );
}
`);

  // ── NotFound.tsx ──────────────────────────────────────────────────────────
  write(path.join(root, "src/pages/NotFound.tsx"), `import { Link } from "react-router-dom";
export default function NotFound() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center">
      <h1 className="text-6xl font-bold mb-4">404</h1>
      <p className="text-muted-foreground mb-6">Page not found.</p>
      <Link to="/" className="underline">Go home</Link>
    </main>
  );
}
`);
}

function _createComponents(root, name, opts) {
  // ── Header ─────────────────────────────────────────────────────────────────
  write(path.join(root, "src/components/Header.tsx"), opts.shadcn
    ? `import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu } from "lucide-react";

/**
 * Header — modify this to customize your site header.
 * Already wired into App.tsx, no extra setup needed.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="flex items-center gap-2 font-bold text-lg">${name}</Link>
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <Link to="/" className="hover:text-foreground transition">Home</Link>
          <Link to="/about" className="hover:text-foreground transition">About</Link>
          <Link to="/contact" className="hover:text-foreground transition">Contact</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Button variant="ghost" className="hidden md:inline-flex" asChild>
            <Link to="/signin">Sign in</Link>
          </Button>
          <Button className="hidden md:inline-flex" asChild>
            <Link to="/signup">Get started</Link>
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}
`
    : `import { Link } from "react-router-dom";

/**
 * Header — modify this to customize your site header.
 * Already wired into App.tsx, no extra setup needed.
 */
export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <div className="container mx-auto flex h-16 items-center justify-between px-6">
        <Link to="/" className="font-bold text-lg">${name}</Link>
        <nav className="flex items-center gap-6 text-sm opacity-70">
          <Link to="/" className="hover:opacity-100 transition">Home</Link>
          <Link to="/about" className="hover:opacity-100 transition">About</Link>
        </nav>
        <div className="flex items-center gap-3">
          <Link to="/signin" className="text-sm font-medium hover:underline">Sign in</Link>
          <Link to="/signup" className="text-sm font-semibold bg-foreground text-background px-4 py-2 rounded-lg hover:opacity-90 transition">Get started</Link>
        </div>
      </div>
    </header>
  );
}
`);

  // ── Footer ─────────────────────────────────────────────────────────────────
  write(path.join(root, "src/components/Footer.tsx"), opts.shadcn
    ? `import { Link } from "react-router-dom";

/**
 * Footer — modify this to customize your site footer.
 * Already wired into App.tsx, no extra setup needed.
 */
export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="font-bold text-lg">${name}</Link>
            <p className="mt-2 text-sm text-muted-foreground">Built with create-em-app.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/" className="hover:text-foreground transition">Home</Link></li>
              <li><Link to="/about" className="hover:text-foreground transition">About</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link to="/privacy" className="hover:text-foreground transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-foreground transition">Terms of Service</Link></li>
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
`
    : `import { Link } from "react-router-dom";

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t bg-background">
      <div className="container mx-auto px-6 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div>
            <Link to="/" className="font-bold text-lg">${name}</Link>
            <p className="mt-2 text-sm opacity-60">Built with create-em-app.</p>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Links</h3>
            <ul className="space-y-2 text-sm opacity-60">
              <li><Link to="/" className="hover:opacity-100 transition">Home</Link></li>
              <li><Link to="/about" className="hover:opacity-100 transition">About</Link></li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-3">Legal</h3>
            <ul className="space-y-2 text-sm opacity-60">
              <li><Link to="/privacy" className="hover:opacity-100 transition">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:opacity-100 transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t pt-6 flex flex-col md:flex-row items-center justify-between gap-4 text-sm opacity-50">
          <p>© {year} ${name}. All rights reserved.</p>
          <p>Built with create-em-app</p>
        </div>
      </div>
    </footer>
  );
}
`);

  // ── UI components ─────────────────────────────────────────────────────────
  if (opts.shadcn) {
    write(path.join(root, "src/components/ui/button.tsx"), shadcn.buttonComponent);
    write(path.join(root, "src/components/ui/card.tsx"), shadcn.cardComponent);
    write(path.join(root, "src/components/ui/input.tsx"), shadcn.inputComponent);
    write(path.join(root, "src/components/ui/badge.tsx"), shadcn.badgeComponent);
  } else {
    write(path.join(root, "src/components/ui/Button.tsx"), `import { ButtonHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "primary" | "secondary" | "ghost"; }\nexport default function Button({ children, variant = "primary", className, ...props }: ButtonProps) {\n  const variants = { primary: "bg-foreground text-background hover:opacity-90", secondary: "border hover:bg-accent", ghost: "opacity-60 hover:opacity-100" };\n  return <button className={cn("inline-flex items-center justify-center font-semibold rounded-lg px-5 py-2.5 text-sm transition focus:outline-none disabled:opacity-50", variants[variant], className)} {...props}>{children}</button>;\n}\n`);
    write(path.join(root, "src/components/ui/Input.tsx"), `import { InputHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\nexport default function Input({ label, error, className, ...props }: InputProps) {\n  return <div className="flex flex-col gap-1">{label && <label className="text-sm font-medium">{label}</label>}<input className={cn("w-full px-4 py-2.5 rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-ring transition", error && "border-destructive", className)} {...props} />{error && <p className="text-xs text-destructive">{error}</p>}</div>;\n}\n`);
    write(path.join(root, "src/components/ui/Card.tsx"), `import { HTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\nexport default function Card({ children, className, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div className={cn("rounded-lg border bg-card text-card-foreground shadow-sm p-6", className)} {...props}>{children}</div>;\n}\n`);
  }
}

function _createLib(root, opts) {
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

const app: FirebaseApp = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
export const db:      Firestore       = getFirestore(app);
export const auth:    Auth            = getAuth(app);
export const storage: FirebaseStorage = getStorage(app);
export default app;
`);
    write(path.join(root, "src/lib/firebase/converters.ts"), firebaseConverters);
    write(path.join(root, "src/lib/firebase/errors.ts"), firebaseErrors);
    write(path.join(root, "src/lib/firebase/hooks/useAuth.ts"), `import { useEffect, useState } from "react";
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
  write(path.join(root, "src/services/api.ts"), `const BASE_URL = import.meta.env.VITE_API_URL ?? "";

async function request<T>(endpoint: string, options?: RequestInit): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await fetch(\`\${BASE_URL}\${endpoint}\`, { headers: { "Content-Type": "application/json" }, ...options });
    if (!res.ok) { const body = await res.json().catch(() => ({})); return { data: null, error: (body as { message?: string }).message ?? \`Error \${res.status}\` }; }
    return { data: await res.json() as T, error: null };
  } catch (err) { return { data: null, error: err instanceof Error ? err.message : "Network error" }; }
}

export const api = {
  get:    <T>(url: string, opts?: RequestInit) => request<T>(url, { method: "GET", ...opts }),
  post:   <T>(url: string, body: unknown, opts?: RequestInit) => request<T>(url, { method: "POST",   body: JSON.stringify(body), ...opts }),
  put:    <T>(url: string, body: unknown, opts?: RequestInit) => request<T>(url, { method: "PUT",    body: JSON.stringify(body), ...opts }),
  delete: <T>(url: string, opts?: RequestInit) => request<T>(url, { method: "DELETE", ...opts }),
};
`);
}

function _createHooks(root) { write(path.join(root, "src/hooks/useLocalStorage.ts"), useLocalStorage); }
function _createTypes(root, opts) { write(path.join(root, "src/types/index.ts"), globalTypes(opts.firebase)); }
function _createConstants(root, name) {
  write(path.join(root, "src/constants/index.ts"), `export const APP_NAME = "${name}";\nexport const APP_URL  = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";\nexport const ROUTES = { home: "/", dashboard: "/dashboard", signin: "/signin", signup: "/signup" } as const;\n`);
}

function _createEnvAndDocs(root, name, opts) {
  write(path.join(root, ".gitignore"), gitignore);
  write(path.join(root, ".env.example"), `VITE_APP_NAME="${name}"\nVITE_APP_URL="http://localhost:5173"\nVITE_API_URL=""\n${opts.firebase ? firebaseEnvVite : ""}`);
  write(path.join(root, "README.md"), `# ${name}\n\n> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)\n\n## Stack\n\n- React 18 + Vite 5\n- TypeScript\n- React Router v6\n- Tailwind CSS${opts.shadcn ? "\n- shadcn/ui + Radix UI\n- Lucide React" : "\n- Lucide React"}${opts.firebase ? "\n- Firebase" : ""}\n\n## Getting Started\n\n\`\`\`bash\nnpm install\n${opts.firebase ? "cp .env.example .env.local\n" : ""}npm run dev\n\`\`\`\n\n## Before merging any PR, check \`CHECKLIST.md\`\n`);
}

module.exports = { scaffold };