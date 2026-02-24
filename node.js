"use strict";

const path = require("path");
const { write, mkdir } = require("../utils/files");
const { gitignore } = require("../templates/shared");

function scaffold(root, name, opts) {
  const dirs = [
    "src/routes", "src/controllers", "src/middleware",
    "src/models", "src/services", "src/lib",
    "src/types", "src/config", "src/constants", "tests",
  ];
  if (opts.firebase) dirs.push("src/lib/firebase");
  dirs.forEach(d => mkdir(path.join(root, d)));

  write(path.join(root, "package.json"), JSON.stringify({
    name, version: "0.1.0", private: true,
    scripts: { dev: "ts-node-dev --respawn --transpile-only src/index.ts", build: "tsc", start: "node dist/index.js", lint: "eslint src --ext .ts" },
    dependencies: { express: "^4.18", cors: "^2.8", dotenv: "^16", helmet: "^7", "express-rate-limit": "^7", ...(opts.firebase ? { "firebase-admin": "^12" } : {}) },
    devDependencies: { "@types/express": "^4.17", "@types/cors": "^2.8", "@types/node": "^20", typescript: "^5", "ts-node-dev": "^2", eslint: "^8", "@typescript-eslint/eslint-plugin": "^6", "@typescript-eslint/parser": "^6", "eslint-plugin-comment-cleaner": "^1.1.0" },
  }, null, 2));

  write(path.join(root, "tsconfig.json"), JSON.stringify({
    compilerOptions: { target: "ES2020", module: "commonjs", lib: ["ES2020"], outDir: "./dist", rootDir: "./src", strict: true, esModuleInterop: true, skipLibCheck: true, resolveJsonModule: true, baseUrl: ".", paths: { "@/*": ["./src/*"] } },
    include: ["src/**/*"], exclude: ["node_modules", "dist"],
  }, null, 2));

  write(path.join(root, ".eslintrc.js"), `module.exports = { parser: "@typescript-eslint/parser", plugins: ["@typescript-eslint", "comment-cleaner"], extends: ["eslint:recommended", "plugin:@typescript-eslint/recommended"], rules: { "comment-cleaner/no-commented-code": "warn", "comment-cleaner/no-commented-imports": "warn" } };\n`);

  write(path.join(root, "src/index.ts"), `import express from "express";\nimport cors from "cors";\nimport helmet from "helmet";\nimport { rateLimit } from "express-rate-limit";\nimport dotenv from "dotenv";\ndotenv.config();\nconst app = express();\nconst PORT = process.env.PORT || 3000;\napp.use(helmet()); app.use(cors()); app.use(express.json());\napp.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));\napp.get("/health", (_req, res) => res.json({ status: "ok", app: "${name}" }));\napp.listen(PORT, () => console.log(\`🚀 ${name} running on http://localhost:\${PORT}\`));\nexport default app;\n`);

  write(path.join(root, "src/config/index.ts"), `import dotenv from "dotenv";\ndotenv.config();\nexport const config = { port: process.env.PORT || "3000", nodeEnv: process.env.NODE_ENV || "development", appName: "${name}" };\n`);

  write(path.join(root, "src/middleware/errorHandler.ts"), `import { Request, Response, NextFunction } from "express";\nexport function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {\n  console.error(err.stack);\n  res.status(500).json({ error: err.message || "Internal Server Error" });\n}\n`);

  write(path.join(root, "src/routes/index.ts"), `import { Router } from "express";\nconst router = Router();\nexport default router;\n`);

  write(path.join(root, "src/types/index.ts"), `// Global TypeScript types\n`);
  write(path.join(root, "src/constants/index.ts"), `export const APP_NAME = "${name}";\n`);

  if (opts.firebase) {
    write(path.join(root, "src/lib/firebase/admin.ts"), `import admin from "firebase-admin";\nif (!admin.apps.length) {\n  admin.initializeApp({ credential: admin.credential.cert({ projectId: process.env.FIREBASE_PROJECT_ID, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\\\n/g, "\\n") }) });\n}\nexport const db = admin.firestore();\nexport const auth = admin.auth();\nexport const storage = admin.storage();\nexport default admin;\n`);
  }

  write(path.join(root, ".gitignore"), gitignore + "\ndist\n");
  write(path.join(root, ".env.example"), `PORT=3000\nNODE_ENV=development\n${opts.firebase ? `FIREBASE_PROJECT_ID=""\nFIREBASE_CLIENT_EMAIL=""\nFIREBASE_PRIVATE_KEY=""\n` : ""}`);
  write(path.join(root, "README.md"), `# ${name}\n\n> Scaffolded with [create-em-app](https://github.com/Youngemmy5956/create-em-app)\n\n## Getting Started\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`);
}

module.exports = { scaffold };
