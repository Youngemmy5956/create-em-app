"use strict";

function parseArgs(argv) {
  const args = argv.slice(2);
  const opts = {
    name: null,
    stack: null,
    tailwind: false,
    firebase: false,
    shadcn: false,
    install: true,
    interactive: false,
    help: false,
  };

  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "-h" || a === "--help") opts.help = true;
    else if (a === "-i" || a === "--interactive") opts.interactive = true;
    else if (a === "--next") opts.stack = "next";
    else if (a === "--react") opts.stack = "react";
    else if (a === "--node") opts.stack = "node";
    else if (a === "--tailwind") opts.tailwind = true;
    else if (a === "--firebase") opts.firebase = true;
    else if (a === "--shadcn") opts.shadcn = true;
    else if (a === "--no-install") opts.install = false;
    else if (!a.startsWith("-")) opts.name = a;
  }

  // shadcn requires tailwind
  if (opts.shadcn) opts.tailwind = true;

  return opts;
}

function printHelp() {
  const { log, paint, c } = require("./colors");
  log(`
${paint(c.cyan + c.bold, "create-em-app")} — Scaffold a new project the right way

${paint(c.bold, "Usage:")}
  create-em-app <project-name> [options]
  create-em-app --interactive

${paint(c.bold, "Options:")}
  -i, --interactive   Walk through setup with prompts
  --next              Next.js 14 + TypeScript + Turbopack
  --react             React + Vite + TypeScript
  --node              Node.js + Express + TypeScript API
  --tailwind          Include Tailwind CSS
  --shadcn            Include shadcn/ui + Radix UI + Lucide + Geist font
  --firebase          Include Firebase setup
  --no-install        Skip npm install
  -h, --help          Show this help

${paint(c.bold, "Examples:")}
  create-em-app my-app --next --shadcn --firebase
  create-em-app my-api --node --firebase
  create-em-app my-site --react --shadcn
  create-em-app --interactive
`);
}

module.exports = { parseArgs, printHelp };