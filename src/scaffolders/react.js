"use strict";

const path = require("path");
const { write, mkdir } = require("../utils/files");
const {
  gitignore, firebaseEnvVite, firebaseConverters,
  firebaseErrors, useLocalStorage, libUtils, globalTypes,
} = require("../templates/shared");

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
  ];
  if (opts.firebase) dirs.push("src/lib/firebase/hooks");
  dirs.forEach(d => mkdir(path.join(root, d)));
}

function _createConfigFiles(root, name, opts) {
  write(path.join(root, "package.json"), JSON.stringify({
    name, version: "0.1.0", private: true, type: "module",
    scripts: { dev: "vite", build: "tsc && vite build", preview: "vite preview", lint: "eslint . --ext ts,tsx" },
    dependencies: { react: "^18", "react-dom": "^18", "react-router-dom": "^6", ...(opts.firebase ? { firebase: "^10.12.2" } : {}) },
    devDependencies: {
      "@types/react": "^18", "@types/react-dom": "^18", "@vitejs/plugin-react": "^4",
      typescript: "^5", vite: "^5", eslint: "^8",
      "eslint-plugin-comment-cleaner": "^1.1.0",
      ...(opts.tailwind ? { tailwindcss: "^3.4.1", postcss: "^8", autoprefixer: "^10.0.1" } : {}),
    },
  }, null, 2));

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

  write(path.join(root, "vite.config.ts"), `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
export default defineConfig({ plugins: [react()], resolve: { alias: { "@": path.resolve(__dirname, "./src") } } });
`);

  write(path.join(root, "eslint.config.mjs"), `import commentCleaner from "eslint-plugin-comment-cleaner";
export default [{ plugins: { "comment-cleaner": commentCleaner }, rules: { "comment-cleaner/no-commented-code": "warn", "comment-cleaner/no-commented-imports": "warn" } }];
`);

  if (opts.tailwind) {
    write(path.join(root, "tailwind.config.ts"), `import type { Config } from "tailwindcss";\nconst config: Config = { content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"], theme: { extend: {} }, plugins: [] };\nexport default config;\n`);
    write(path.join(root, "postcss.config.mjs"), `export default { plugins: { tailwindcss: {}, autoprefixer: {} } };\n`);
    write(path.join(root, "src/index.css"), `@tailwind base;\n@tailwind components;\n@tailwind utilities;\n* { box-sizing: border-box; }\nbody { min-height: 100vh; margin: 0; }\n`);
  }

  write(path.join(root, "index.html"), `<!DOCTYPE html>\n<html lang="en">\n  <head>\n    <meta charset="UTF-8" />\n    <meta name="viewport" content="width=device-width, initial-scale=1.0" />\n    <title>${name}</title>\n  </head>\n  <body>\n    <div id="root"></div>\n    <script type="module" src="/src/main.tsx"></script>\n  </body>\n</html>\n`);
}

function _createAppFiles(root, name, opts) {
  write(path.join(root, "src/main.tsx"), `import React from "react";\nimport ReactDOM from "react-dom/client";\nimport { BrowserRouter } from "react-router-dom";\nimport App from "./App";\n${opts.tailwind ? `import "./index.css";\n` : ""}ReactDOM.createRoot(document.getElementById("root")!).render(<React.StrictMode><BrowserRouter><App /></BrowserRouter></React.StrictMode>);\n`);

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
}

function _createPages(root, name, opts) {
  write(path.join(root, "src/pages/Home.tsx"), opts.tailwind
    ? `export default function Home() {\n  return <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white px-6"><div className="text-center max-w-xl"><h1 className="text-5xl font-bold tracking-tight mb-4">${name}</h1><p className="text-gray-400 text-lg mb-8">Your project is ready. Start building.</p><div className="flex gap-4 justify-center"><a href="/dashboard" className="bg-white text-gray-950 font-semibold px-6 py-3 rounded-lg hover:bg-gray-200 transition">Get started</a><a href="https://vitejs.dev" target="_blank" rel="noopener noreferrer" className="border border-gray-700 text-gray-300 font-semibold px-6 py-3 rounded-lg hover:border-gray-400 transition">Docs →</a></div></div></main>;\n}\n`
    : `export default function Home() {\n  return <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0a0a", color: "#fff" }}><div style={{ textAlign: "center" }}><h1 style={{ fontSize: "3rem", fontWeight: 700 }}>${name}</h1><p style={{ color: "#888" }}>Your project is ready.</p></div></main>;\n}\n`
  );

  write(path.join(root, "src/pages/NotFound.tsx"), opts.tailwind
    ? `import { Link } from "react-router-dom";\nexport default function NotFound() {\n  return <main className="min-h-screen flex flex-col items-center justify-center bg-gray-950 text-white"><h1 className="text-6xl font-bold mb-4">404</h1><p className="text-gray-400 mb-6">Page not found.</p><Link to="/" className="text-blue-400 hover:underline">Go home</Link></main>;\n}\n`
    : `import { Link } from "react-router-dom";\nexport default function NotFound() {\n  return <main style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}><h1>404</h1><Link to="/">Go home</Link></main>;\n}\n`
  );
}

function _createComponents(root, name, opts) {
  write(path.join(root, "src/components/Navbar.tsx"), opts.tailwind
    ? `import { Link } from "react-router-dom";\nexport default function Navbar() {\n  return <nav className="border-b border-gray-800 px-6 py-4 flex items-center justify-between bg-gray-950"><Link to="/" className="font-bold text-lg text-white">${name}</Link><div className="flex gap-6 text-sm text-gray-400"><Link to="/" className="hover:text-white transition">Home</Link></div></nav>;\n}\n`
    : `import { Link } from "react-router-dom";\nexport default function Navbar() {\n  return <nav style={{ borderBottom: "1px solid #2a2a2a", padding: "1rem 1.5rem", display: "flex", justifyContent: "space-between", background: "#0a0a0a" }}><Link to="/" style={{ fontWeight: 700, color: "#fff", textDecoration: "none" }}>${name}</Link></nav>;\n}\n`
  );

  write(path.join(root, "src/components/ui/Button.tsx"), opts.tailwind
    ? `import { ButtonHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "primary" | "secondary" | "ghost"; size?: "sm" | "md" | "lg"; }\nexport default function Button({ children, variant = "primary", size = "md", className, ...props }: ButtonProps) {\n  const base = "inline-flex items-center justify-center font-semibold rounded-lg transition focus:outline-none disabled:opacity-50";\n  const variants = { primary: "bg-white text-gray-950 hover:bg-gray-200", secondary: "border border-gray-700 text-gray-300 hover:border-gray-400", ghost: "text-gray-400 hover:text-white" };\n  const sizes = { sm: "px-3 py-1.5 text-sm", md: "px-5 py-2.5 text-sm", lg: "px-7 py-3 text-base" };\n  return <button className={cn(base, variants[variant], sizes[size], className)} {...props}>{children}</button>;\n}\n`
    : `import { ButtonHTMLAttributes } from "react";\ninterface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> { variant?: "primary" | "secondary"; }\nexport default function Button({ children, variant = "primary", ...props }: ButtonProps) {\n  return <button style={{ padding: "0.6rem 1.4rem", borderRadius: "8px", fontWeight: 600, cursor: "pointer", background: variant === "primary" ? "#fff" : "transparent", color: variant === "primary" ? "#000" : "#fff", border: variant === "secondary" ? "1px solid #444" : "none" }} {...props}>{children}</button>;\n}\n`
  );

  write(path.join(root, "src/components/ui/Input.tsx"), opts.tailwind
    ? `import { InputHTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\nexport default function Input({ label, error, className, ...props }: InputProps) {\n  return <div className="flex flex-col gap-1">{label && <label className="text-sm font-medium text-gray-300">{label}</label>}<input className={cn("w-full px-4 py-2.5 rounded-lg bg-gray-900 border border-gray-700 text-white placeholder-gray-500 focus:outline-none focus:border-gray-400 transition", error && "border-red-500", className)} {...props} />{error && <p className="text-xs text-red-400">{error}</p>}</div>;\n}\n`
    : `import { InputHTMLAttributes } from "react";\ninterface InputProps extends InputHTMLAttributes<HTMLInputElement> { label?: string; error?: string; }\nexport default function Input({ label, error, ...props }: InputProps) {\n  return <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>{label && <label style={{ fontSize: "0.85rem", color: "#ccc" }}>{label}</label>}<input style={{ padding: "0.6rem 1rem", borderRadius: "8px", background: "#1a1a1a", border: "1px solid #333", color: "#fff" }} {...props} />{error && <p style={{ fontSize: "0.75rem", color: "#f87171" }}>{error}</p>}</div>;\n}\n`
  );

  write(path.join(root, "src/components/ui/Card.tsx"), opts.tailwind
    ? `import { HTMLAttributes } from "react";\nimport { cn } from "@/lib/utils";\ninterface CardProps extends HTMLAttributes<HTMLDivElement> {}\nexport default function Card({ children, className, ...props }: CardProps) {\n  return <div className={cn("bg-gray-900 border border-gray-800 rounded-xl p-6", className)} {...props}>{children}</div>;\n}\n`
    : `import { HTMLAttributes } from "react";\nexport default function Card({ children, ...props }: HTMLAttributes<HTMLDivElement>) {\n  return <div style={{ background: "#1a1a1a", border: "1px solid #2a2a2a", borderRadius: "12px", padding: "1.5rem" }} {...props}>{children}</div>;\n}\n`
  );
}

function _createLib(root, opts) {
  write(path.join(root, "src/lib/utils.ts"), libUtils);

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
    write(path.join(root, "src/lib/firebase/errors.ts"),     firebaseErrors);
    write(path.join(root, "src/lib/firebase/hooks/useAuth.ts"), `import { useEffect, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "../config";
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
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
    if (!res.ok) { const body = await res.json().catch(() => ({})); return { data: null, error: (body as any).message ?? \`Error \${res.status}\` }; }
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

function _createHooks(root) {
  write(path.join(root, "src/hooks/useLocalStorage.ts"), useLocalStorage);
}

function _createTypes(root, opts) {
  write(path.join(root, "src/types/index.ts"), globalTypes(opts.firebase));
}

function _createConstants(root, name) {
  write(path.join(root, "src/constants/index.ts"), `export const APP_NAME = "${name}";\nexport const APP_URL  = import.meta.env.VITE_APP_URL ?? "http://localhost:5173";\nexport const ROUTES = { home: "/", dashboard: "/dashboard", signin: "/signin", signup: "/signup" } as const;\n`);
}

function _createEnvAndDocs(root, name, opts) {
  write(path.join(root, ".gitignore"), gitignore);
  write(path.join(root, ".env.example"), `VITE_APP_NAME="${name}"\nVITE_APP_URL="http://localhost:5173"\nVITE_API_URL=""\n${opts.firebase ? firebaseEnvVite : ""}`);
  write(path.join(root, "README.md"), `# ${name}\n\n> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)\n\n## Getting Started\n\n\`\`\`bash\nnpm install\n${opts.firebase ? "cp .env.example .env.local\n" : ""}npm run dev\n\`\`\`\n`);
}

module.exports = { scaffold };
