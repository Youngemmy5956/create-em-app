# create-em-app

> Scaffold a new project the right way — structured, typed, and linted from day one.

[![npm version](https://img.shields.io/npm/v/create-em-app.svg)](https://www.npmjs.com/package/create-em-app)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/node-%3E%3D16.0.0-brightgreen)](https://nodejs.org)

---

## What it does

One command and you get a complete, properly structured project — not just empty folders. Every file is pre-written, configured, and ready to run. No default boilerplate, no fish page, no placeholder garbage.

---

## Installation

```bash
npm install -g create-em-app
```

Or use without installing:

```bash
npx create-em-app my-app --next --tailwind
```

---

## How it works

### One-liner (fastest)

Pass your project name and flags and it scaffolds everything instantly:

```bash
create-em-app my-app --next --tailwind --firebase
```

### Interactive mode (guided)

No flags needed — it asks you questions step by step:

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
  Include Tailwind CSS? (y/n): y
  Include Firebase? (y/n): y
  Run npm install now? (y/n): y
```

Then it scaffolds the full project, runs `npm install`, and prints your next steps.

---

## Supported stacks

| Flag | Stack |
|------|-------|
| `--next` | Next.js 14, App Router, TypeScript |
| `--react` | React 18, Vite 5, React Router v6, TypeScript |
| `--node` | Node.js, Express 4, TypeScript |

### Add-ons (mix and match)

| Flag | What it adds |
|------|-------------|
| `--tailwind` | Tailwind CSS, postcss, autoprefixer — fully configured |
| `--firebase` | Firebase config, Firestore converters, error helpers, `useAuth` hook |

---

## All options

```
create-em-app <project-name> [options]

  -i, --interactive    Walk through setup with prompts
  --next               Next.js 14 + TypeScript (App Router)
  --react              React + Vite + TypeScript
  --node               Node.js + Express + TypeScript API
  --tailwind           Include Tailwind CSS
  --firebase           Include Firebase setup
  --no-install         Skip npm install
  -h, --help           Show help
```

---

## Examples

```bash
# Next.js — full stack
create-em-app my-shop --next --tailwind --firebase

# Next.js — no Firebase
create-em-app my-blog --next --tailwind

# React + Vite — full
create-em-app my-dashboard --react --tailwind --firebase

# React + Vite — plain
create-em-app my-site --react

# Node.js API
create-em-app my-api --node --firebase

# Interactive — let it guide you
create-em-app -i
```

---

## What gets generated

### Next.js (`--next`)

```
my-app/
├── src/
│   ├── app/
│   │   ├── globals.css          ← Tailwind directives (or plain reset)
│   │   ├── layout.tsx           ← Root layout, imports globals.css
│   │   ├── page.tsx             ← Your homepage (dark, clean, not the default Next.js page)
│   │   ├── loading.tsx          ← Suspense loading state
│   │   ├── error.tsx            ← Error boundary
│   │   └── not-found.tsx        ← 404 page
│   ├── components/
│   │   ├── Navbar.tsx
│   │   └── ui/
│   │       ├── Button.tsx       ← primary / secondary / ghost variants
│   │       ├── Input.tsx        ← with label + error support
│   │       └── Card.tsx
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts             ← cn(), formatDate(), capitalize(), sleep()
│   │   └── firebase/            ← (if --firebase)
│   │       ├── config.ts        ← db, auth, storage exports
│   │       ├── converters.ts    ← Generic type-safe Firestore converter
│   │       ├── errors.ts        ← Firebase error code → readable message
│   │       └── hooks/
│   │           └── useAuth.ts   ← useAuth() hook
│   ├── services/
│   │   └── api.ts               ← api.get / post / put / delete
│   ├── types/
│   │   └── index.ts             ← ApiResponse<T>, PaginatedResponse<T>
│   └── constants/
│       └── index.ts             ← APP_NAME, APP_URL, ROUTES
├── eslint.config.mjs            ← ESLint + comment-cleaner
├── tailwind.config.ts           ← (if --tailwind)
├── next.config.ts
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

### React + Vite (`--react`)

```
my-app/
├── src/
│   ├── App.tsx                  ← Router wired with Navbar + routes
│   ├── main.tsx                 ← Entry point, BrowserRouter wraps everything
│   ├── index.css                ← Tailwind directives (if --tailwind)
│   ├── pages/
│   │   ├── Home.tsx             ← Homepage (dark, clean, styled)
│   │   └── NotFound.tsx         ← 404 page with back link
│   ├── components/
│   │   ├── Navbar.tsx           ← With React Router Link
│   │   └── ui/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       └── Card.tsx
│   ├── hooks/
│   │   └── useLocalStorage.ts
│   ├── lib/
│   │   ├── utils.ts             ← cn(), formatDate(), capitalize(), sleep()
│   │   └── firebase/            ← (if --firebase)
│   │       ├── config.ts        ← db, auth, storage (uses import.meta.env)
│   │       ├── converters.ts
│   │       ├── errors.ts
│   │       └── hooks/
│   │           └── useAuth.ts
│   ├── services/
│   │   └── api.ts               ← api.get / post / put / delete
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       └── index.ts             ← APP_NAME, ROUTES
├── eslint.config.mjs
├── vite.config.ts               ← @ alias configured
├── tailwind.config.ts           ← (if --tailwind)
├── tsconfig.json
├── .env.example                 ← VITE_ prefixed vars
├── .gitignore
└── README.md
```

### Node.js API (`--node`)

```
my-api/
├── src/
│   ├── index.ts                 ← Express app with helmet, cors, rate-limit
│   ├── routes/index.ts
│   ├── controllers/
│   ├── middleware/
│   │   └── errorHandler.ts
│   ├── models/
│   ├── services/
│   ├── lib/firebase/            ← (if --firebase, uses firebase-admin)
│   │   └── admin.ts             ← db, auth, storage via Admin SDK
│   ├── types/index.ts
│   ├── constants/index.ts
│   └── config/index.ts
├── tests/
├── tsconfig.json
├── .env.example
├── .gitignore
└── README.md
```

---

## After scaffolding

```bash
cd my-app
npm install                          # if you skipped it
cp .env.example .env.local           # fill in Firebase keys (if used)
npm run dev                          # start the dev server
```

For Next.js, open http://localhost:3000
For React + Vite, open http://localhost:5173
For Node.js API, open http://localhost:3000/health

---

## Using the components

All UI components support the `@` alias so you can import from anywhere:

```tsx
import Button from "@/components/ui/Button";
import Input  from "@/components/ui/Input";
import Card   from "@/components/ui/Card";

<Button variant="primary">Submit</Button>
<Button variant="secondary">Cancel</Button>
<Button variant="ghost">Skip</Button>

<Input label="Email" type="email" placeholder="you@example.com" error="Invalid email" />

<Card className="max-w-md">
  Content goes here
</Card>
```

---

## Using Firebase

If you used `--firebase`, config is in `src/lib/firebase/config.ts`.

**Import db, auth, or storage anywhere:**
```ts
import { db, auth, storage } from "@/lib/firebase/config";
```

**Auth hook:**
```tsx
import { useAuth } from "@/lib/firebase/hooks/useAuth";

function MyComponent() {
  const { user, loading } = useAuth();
  if (loading) return <p>Loading...</p>;
  if (!user)   return <p>Not signed in</p>;
  return <p>Hello {user.email}</p>;
}
```

**Type-safe Firestore reads:**
```ts
import { createConverter } from "@/lib/firebase/converters";
import { doc, getDoc }     from "firebase/firestore";
import { db }              from "@/lib/firebase/config";

interface Product {
  id:    string;
  name:  string;
  price: number;
}

const productConverter = createConverter<Product>();
const ref  = doc(db, "products", productId).withConverter(productConverter);
const snap = await getDoc(ref);
const product = snap.data(); // fully typed as Product
```

**Error messages:**
```ts
import { getFirebaseErrorMessage } from "@/lib/firebase/errors";

try {
  await signInWithEmailAndPassword(auth, email, password);
} catch (err: any) {
  const message = getFirebaseErrorMessage(err.code);
  setError(message); // "Incorrect password." instead of raw Firebase error
}
```

---

## Adding new pages (React + Vite)

1. Create the file in `src/pages/`:
```tsx
// src/pages/Dashboard.tsx
export default function Dashboard() {
  return <main>Dashboard</main>;
}
```

2. Register it in `src/App.tsx`:
```tsx
import Dashboard from "@/pages/Dashboard";

<Route path="/dashboard" element={<Dashboard />} />
```

---

## Adding new pages (Next.js)

Create a folder in `src/app/`:
```
src/app/dashboard/page.tsx
src/app/dashboard/loading.tsx   ← optional
```

---

## Lint and auto-fix

Every project includes [eslint-plugin-comment-cleaner](https://www.npmjs.com/package/eslint-plugin-comment-cleaner):

```bash
npm run lint              # see all issues
npx eslint ./src --fix    # auto-delete commented-out code
```

---

## Related

- [comment-cleaner CLI](https://www.npmjs.com/package/@youngemmy/comment-cleaner)
- [eslint-plugin-comment-cleaner](https://www.npmjs.com/package/eslint-plugin-comment-cleaner)
- [GitHub](https://github.com/Youngemmy5956/create-em-app)

---

## Author

**Nwamini Emmanuel O**
- GitHub: [@Youngemmy5956](https://github.com/Youngemmy5956)
- npm: [@youngemmy](https://www.npmjs.com/~youngemmy)

---

## License

MIT © 2026 Nwamini Emmanuel O
