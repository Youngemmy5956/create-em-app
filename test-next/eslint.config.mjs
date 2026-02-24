import { dirname } from "path";
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
