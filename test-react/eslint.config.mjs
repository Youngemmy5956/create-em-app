import commentCleaner from "eslint-plugin-comment-cleaner";
export default [{ plugins: { "comment-cleaner": commentCleaner }, rules: { "comment-cleaner/no-commented-code": "warn", "comment-cleaner/no-commented-imports": "warn" } }];
