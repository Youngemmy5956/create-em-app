"use strict";

const path = require("path");
const fs = require("fs");
const { execSync } = require("child_process");
const { parseArgs, printHelp } = require("./utils/args");
const { createRL, ask, askChoice, askYesNo } = require("./utils/prompt");
const { log, info, ok, warn, step, header, spin, done, paint, c } = require("./utils/colors");
const { printTree } = require("./utils/files");
const { generateChecklist } = require("./utils/checklist");
const { generateSeo, parseSeoFromDescription } = require("./utils/seo");

const nextScaffolder = require("./scaffolders/nextjs");
const reactScaffolder = require("./scaffolders/react");
const nodeScaffolder = require("./scaffolders/node");

async function main() {
  const opts = parseArgs(process.argv);

  log(paint(c.cyan + c.bold, `
╔══════════════════════════════════════════╗
║     🏗️   create-em-app                   ║
║  Scaffold projects like a pro            ║
╚══════════════════════════════════════════╝`));

  if (opts.help) { printHelp(); process.exit(0); }

  const rl = createRL();

  // ── Interactive mode ────────────────────────────────────────────────────────
  if (opts.interactive || (!opts.name && !opts.stack)) {
    log();
    if (!opts.name) {
      opts.name = (await ask(rl, paint(c.bold, "  Project name: "))).trim();
    }
    if (!opts.name) {
      log(paint(c.red, "  Project name is required."));
      rl.close(); process.exit(1);
    }

    const stackChoice = await askChoice(rl, "Which stack?", [
      "Next.js + TypeScript",
      "React + Vite + TypeScript",
      "Node.js API + Express + TypeScript",
    ]);
    opts.stack = stackChoice.startsWith("Next") ? "next" : stackChoice.startsWith("React") ? "react" : "node";

    if (opts.stack !== "node") {
      opts.shadcn = await askYesNo(rl, "Include shadcn/ui + Radix UI + Lucide + Geist font?");
      if (!opts.shadcn) {
        opts.tailwind = await askYesNo(rl, "Include Tailwind CSS?");
      }
    }

    opts.firebase = await askYesNo(rl, "Include Firebase?");

    // ── SEO prompt ────────────────────────────────────────────────────────────
    if (opts.stack !== "node") {
      opts.seo = await askYesNo(rl, "Include SEO? (sitemap, robots.txt, metadata)");
      if (opts.seo) {
        log();
        log(paint(c.dim, "  Describe your project in 1-2 sentences."));
        log(paint(c.dim, "  This will be used for your site description, keywords, and metadata.\n"));
        opts.description = (await ask(rl, paint(c.bold, "  Project description: "))).trim();
        opts.siteUrl = (await ask(rl, paint(c.bold, "  Production URL (e.g. https://myapp.com): "))).trim();
        if (!opts.siteUrl) opts.siteUrl = `https://${opts.name}.com`;
      }
    }

    opts.install = await askYesNo(rl, "Run npm install now?");
  }

  // ── SEO — non-interactive flag mode ────────────────────────────────────────
  if (opts.seo && !opts.description) {
    log();
    log(paint(c.dim, "  Describe your project in 1-2 sentences."));
    log(paint(c.dim, "  This will be used for your site description, keywords, and metadata.\n"));
    opts.description = (await ask(rl, paint(c.bold, "  Project description: "))).trim();
    if (!opts.siteUrl) {
      opts.siteUrl = (await ask(rl, paint(c.bold, "  Production URL (e.g. https://myapp.com): "))).trim();
    }
  }

  rl.close();

  // shadcn always implies tailwind
  if (opts.shadcn) opts.tailwind = true;

  // Parse description into structured SEO fields
  const rawSeoFlag = opts.seo;
  if (rawSeoFlag && opts.description) {
    opts.seo = parseSeoFromDescription(opts.description, opts.name || "app");
  }

  // ── Validate ─────────────────────────────────────────────────────────────────
  if (!opts.name) { log(paint(c.red, "\n  ❌ Project name required.\n")); printHelp(); process.exit(1); }
  if (!opts.stack) { log(paint(c.red, "\n  ❌ Stack required.\n")); printHelp(); process.exit(1); }

  const projectName = opts.name.toLowerCase().replace(/\s+/g, "-");
  const root = path.resolve(process.cwd(), projectName);

  if (fs.existsSync(root)) {
    log(paint(c.red, `\n  ❌ Folder "${projectName}" already exists.\n`));
    process.exit(1);
  }

  // ── Summary ──────────────────────────────────────────────────────────────────
  log();
  info(`Project  : ${paint(c.bold, projectName)}`);
  info(`Stack    : ${paint(c.bold, opts.stack === "next" ? "Next.js 14 + TypeScript" : opts.stack === "react" ? "React + Vite + TypeScript" : "Node.js API + TypeScript")}`);
  info(`Tailwind : ${opts.tailwind ? paint(c.green, "yes") : paint(c.dim, "no")}`);
  info(`shadcn/ui: ${opts.shadcn ? paint(c.green, "yes (+ Radix UI + Lucide + Geist)") : paint(c.dim, "no")}`);
  info(`Firebase : ${opts.firebase ? paint(c.green, "yes") : paint(c.dim, "no")}`);
  info(`SEO      : ${opts.seo ? paint(c.green, "yes (sitemap + robots.txt + metadata)") : paint(c.dim, "no")}`);
  info(`ESLint   : ${paint(c.green, "yes (comment-cleaner included)")}`);
  if (opts.seo) info(`Site URL : ${paint(c.cyan, opts.siteUrl || `https://${projectName}.com`)}`);
  log();

  // ── Scaffold ──────────────────────────────────────────────────────────────────
  step("Scaffolding files...");
  if (opts.stack === "next") nextScaffolder.scaffold(root, projectName, opts);
  else if (opts.stack === "react") reactScaffolder.scaffold(root, projectName, opts);
  else if (opts.stack === "node") nodeScaffolder.scaffold(root, projectName, opts);
  ok("Files created");

  // ── SEO ───────────────────────────────────────────────────────────────────────
  if (opts.seo) {
    step("Generating SEO files...");
    generateSeo(root, projectName, opts);
    ok("sitemap, robots.txt, and metadata helper created");
  }

  // ── Checklist ─────────────────────────────────────────────────────────────────
  step("Generating pre-merge checklist...");
  generateChecklist(root, projectName, opts);
  ok("CHECKLIST.md + .github/pull_request_template.md created");

  // ── Install ───────────────────────────────────────────────────────────────────
  if (opts.install !== false) {
    step("Installing dependencies...");
    spin("npm install");
    try {
      execSync("npm install", { cwd: root, stdio: "pipe" });
      done();
      ok("Dependencies installed");
    } catch {
      done();
      warn("npm install failed. Run it manually inside the project folder.");
    }
  }

  // ── Tree ──────────────────────────────────────────────────────────────────────
  log();
  header("  📁 Project structure:");
  log(paint(c.cyan + c.bold, `\n  ${projectName}/`));
  printTree(root);

  // ── Next steps ────────────────────────────────────────────────────────────────
  log();
  ok(`${projectName} is ready!`);
  log();
  log(paint(c.bold, "  Next steps:"));
  log(paint(c.cyan, `\n    cd ${projectName}`));
  if (opts.install === false) log(paint(c.cyan, `    npm install`));
  if (opts.firebase) log(paint(c.cyan, `    cp .env.example .env.local`));
  log(paint(c.cyan, `    npm run dev`));
  if (opts.seo) {
    log();
    log(paint(c.green, `  🔍 SEO ready:`));
    log(paint(c.dim, `     • /sitemap.xml  — submit to Google Search Console`));
    log(paint(c.dim, `     • /robots.txt   — search engine crawl rules`));
    log(paint(c.dim, `     • src/lib/seo.ts — use generateMetadata() in every page`));
    log(paint(c.dim, `     • read src/lib/seo.README.md for full usage guide`));
  }
  log();
  log(paint(c.yellow, `  📋 Read CHECKLIST.md before merging any pull request`));
  log();
  log(paint(c.dim, `  Scaffolded by create-em-app\n`));
}

main().catch(err => { console.error(err); process.exit(1); });