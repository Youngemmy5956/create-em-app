# create-em-app

> Scaffold a new project the right way — structured, typed, and linted from day one.

[![npm version](https://img.shields.io/npm/v/create-em-app.svg)](https://www.npmjs.com/package/create-em-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)

---

## What it does

One command and you get a complete, properly structured project — not just empty folders. Every file is pre-written, configured, and ready to run. No default boilerplate, no placeholder garbage.

---

## Installation

```bash
npm install -g create-em-app
```

Or use without installing:

```bash
npx create-em-app my-app --next --shadcn
```

---

## How it works

### One-liner (fastest)

```bash
create-em-app my-app --next --shadcn --firebase
```

### Interactive mode (guided)

```bash
create-em-app --interactive
# or shorthand
create-em-app -i
```

It will ask:

```
  Project name: my-shop
  Which stack?
    1. Next.js + TypeScript
    2. React + Vite + TypeScript
    3. Node.js API + Express + TypeScript
  Include shadcn/ui + Radix UI + Lucide + Geist font? (y/n): y
  Include Firebase? (y/n): y
  Run npm install now? (y/n): y
```

---

## Supported stacks

| Flag | Stack |
|------|-------|
| `--next` | Next.js 14, App Router, TypeScript, Turbopack |
| `--react` | React 18, Vite 5, React Router v6, TypeScript |
| `--node` | Node.js, Express 4, TypeScript |

### Add-ons

| Flag | What it adds |
|------|-------------|
| `--shadcn` | shadcn/ui + Radix UI + Lucide React + Geist font — fully configured |
| `--tailwind` | Tailwind CSS only (no shadcn) |
| `--firebase` | Firebase config, Firestore converters, error helpers, `useAuth` hook |

> `--shadcn` automatically includes Tailwind — no need to pass both flags.

---

## All options

```
create-em-app <project-name> [options]

  -i, --interactive    Walk through setup with prompts
  --next               Next.js 14 + TypeScript + Turbopack (App Router)
  --react              React + Vite + TypeScript
  --node               Node.js + Express + TypeScript API
  --shadcn             shadcn/ui + Radix UI + Lucide React + Geist font
  --tailwind           Tailwind CSS only
  --firebase           Firebase setup
  --no-install         Skip npm install
  -h, --help           Show help
```

---

## Examples

```bash
# Next.js — full stack with shadcn
create-em-app my-shop --next --shadcn --firebase

# Next.js — Tailwind only
create-em-app my-blog --next --tailwind

# React + Vite — full
create-em-app my-dashboard --react --shadcn --firebase

# Node.js API
create-em-app my-api --node --firebase

# Interactive
create-em-app -i
```

---

## What gets generated

### Next.js (`--next --shadcn --firebase`)

```
my-app/
├── .github/
│   └── pull_request_template.md   ← checklist appears on every GitHub PR
├── src/
│   ├── app/
│   │   ├── (routes)/              ← your pages go here
│   │   ├── globals.css            ← Tailwind + shadcn CSS variables
│   │   ├── layout.tsx             ← Geist font wired in
│   │   ├── page.tsx               ← custom homepage (not the default Next.js page)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── not-found.tsx
│   ├── components/
│   │   ├── Navbar.tsx             ← with Lucide Menu icon
│   │   └── ui/
│   │       ├── button.tsx         ← shadcn/ui Button (all variants)
│   │       ├── card.tsx           ← shadcn/ui Card
│   │       ├── input.tsx          ← shadcn/ui Input
│   │       └── badge.tsx          ← shadcn/ui Badge
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts               ← cn() using clsx + tailwind-merge
│   │   └── firebase/
│   │       ├── config.ts          ← db, auth, storage exports
│   │       ├── converters.ts      ← type-safe Firestore converter
│   │       ├── errors.ts          ← Firebase error → readable message
│   │       └── hooks/
│   │           └── useAuth.ts
│   ├── services/
│   │   └── api.ts                 ← typed fetch wrapper
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       └── index.ts
├── CHECKLIST.md                   ← pre-merge checklist
├── components.json                ← shadcn/ui config
├── tailwind.config.ts             ← with shadcn theme tokens
├── next.config.mjs
├── tsconfig.json
├── .env.example
└── .gitignore
```

### React + Vite (`--react --shadcn --firebase`)

```
my-app/
├── .github/
│   └── pull_request_template.md
├── src/
│   ├── App.tsx                    ← React Router wired up
│   ├── main.tsx                   ← BrowserRouter wraps everything
│   ├── index.css                  ← Tailwind + shadcn CSS variables
│   ├── pages/
│   │   ├── Home.tsx               ← styled homepage
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── Navbar.tsx             ← with Lucide icon
│   │   └── ui/
│   │       ├── button.tsx
│   │       ├── card.tsx
│   │       ├── input.tsx
│   │       └── badge.tsx
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts
│   │   └── firebase/
│   │       ├── config.ts          ← uses import.meta.env.VITE_*
│   │       ├── converters.ts
│   │       ├── errors.ts
│   │       └── hooks/
│   │           └── useAuth.ts
│   ├── services/
│   │   └── api.ts
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       └── index.ts
├── CHECKLIST.md
├── components.json
├── tailwind.config.ts
├── vite.config.ts                 ← @ alias configured
├── tsconfig.json
├── .env.example
└── .gitignore
```

### Node.js API (`--node --firebase`)

```
my-api/
├── src/
│   ├── index.ts                   ← Express + helmet + cors + rate-limit
│   ├── routes/index.ts
│   ├── controllers/
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── models/
│   ├── services/
│   ├── lib/firebase/
│   │   └── admin.ts               ← Firebase Admin SDK
│   ├── types/index.ts
│   ├── constants/index.ts
│   └── config/index.ts
├── tests/
├── CHECKLIST.md
├── tsconfig.json
├── .env.example
└── .gitignore
```

---

## Pre-Merge Checklist

Every project gets a `CHECKLIST.md` and a `.github/pull_request_template.md` automatically.

The checklist covers:
- Code quality — no commented-out code, no unused vars, no `console.log`, no hardcoded secrets
- Structure — components in right folders, no business logic in UI, no direct API calls in components
- UI — responsive, loading states, error states, no hardcoded colours
- Security — no sensitive data in frontend, input validation, protected routes
- Performance — no unnecessary re-renders, optimised images, lazy loading
- Testing — edge cases covered, no regressions
- Before merging — lint passes, build passes, branch up to date

The PR template appears automatically on every GitHub pull request so no one can skip it.

---

## After scaffolding

```bash
cd my-app
npm install                        # if you skipped it
cp .env.example .env.local         # fill in Firebase keys (if used)
npm run dev
```

- Next.js → http://localhost:3000
- React + Vite → http://localhost:5173
- Node.js → http://localhost:3000/health

---

## Using the components

```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, User } from "lucide-react";

<Button>Submit</Button>
<Button variant="outline">Cancel</Button>
<Button variant="ghost" size="icon"><Search className="h-4 w-4" /></Button>

<Card>
  <CardHeader>
    <CardTitle>Hello</CardTitle>
  </CardHeader>
  <CardContent>Content here</CardContent>
</Card>

<Input placeholder="Search..." />
<Badge variant="secondary">New</Badge>
```

---

## Adding more shadcn components

The `components.json` file is already configured so you can use the shadcn CLI directly:

```bash
npx shadcn@latest add dialog
npx shadcn@latest add dropdown-menu
npx shadcn@latest add toast
npx shadcn@latest add table
```

---

## Firebase

```ts
import { db, auth, storage } from "@/lib/firebase/config";
```

**Auth hook:**
```tsx
import { useAuth } from "@/lib/firebase/hooks/useAuth";

const { user, loading } = useAuth();
```

**Type-safe Firestore:**
```ts
import { createConverter } from "@/lib/firebase/converters";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase/config";

interface Product { id: string; name: string; price: number; }

const ref = doc(db, "products", id).withConverter(createConverter<Product>());
const snap = await getDoc(ref);
const product = snap.data(); // typed as Product
```

---

## Project structure

```
create-em-app/
├── bin/
│   └── create-em-app.js       ← CLI entry point
├── src/
│   ├── index.js               ← main orchestrator
│   ├── scaffolders/
│   │   ├── nextjs.js          ← Next.js scaffold logic
│   │   ├── react.js           ← React + Vite scaffold logic
│   │   └── node.js            ← Node.js scaffold logic
│   ├── templates/
│   │   ├── shared.js          ← shared code templates (Firebase, hooks, types)
│   │   └── shadcn.js          ← shadcn/ui + Geist + Lucide templates
│   └── utils/
│       ├── colors.js          ← terminal colours
│       ├── files.js           ← file write/mkdir helpers
│       ├── prompt.js          ← interactive prompts
│       ├── args.js            ← CLI argument parser
│       └── checklist.js       ← pre-merge checklist generator
└── package.json
```

---

## Related

- [eslint-plugin-comment-cleaner](https://www.npmjs.com/package/eslint-plugin-comment-cleaner)
- [shadcn/ui](https://ui.shadcn.com)
- [GitHub](https://github.com/Youngemmy5956/create-em-app)

---

## Author

**Nwamini Emmanuel O**
- GitHub: [@Youngemmy5956](https://github.com/Youngemmy5956)
- npm: [@youngemmy](https://www.npmjs.com/~youngemmy)

---

## License

MIT © 2026 Nwamini Emmanuel O