"use strict";

const fs   = require("fs");
const path = require("path");

/**
 * Write a file, creating all parent directories as needed.
 */
function write(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, "utf8");
}

/**
 * Create a directory (and all parents) if it doesn't exist.
 */
function mkdir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Print a visual tree of a directory (like the `tree` command).
 */
function printTree(root, prefix = "", depth = 0) {
  const { log } = require("./colors");
  const { c, paint } = require("./colors");

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

module.exports = { write, mkdir, printTree };
