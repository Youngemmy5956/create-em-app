"use strict";

const path = require("path");
const { write, mkdir } = require("./files");

/**
 * Generate all SEO files for a project.
 *
 * For Next.js:
 *   - src/app/sitemap.ts       → dynamic sitemap via Next.js Metadata API
 *   - src/app/robots.ts        → robots.txt via Next.js Metadata API
 *   - src/lib/seo.ts           → reusable generateMetadata() helper
 *   - src/app/opengraph-image.tsx → OG image via Next.js ImageResponse
 *
 * For React:
 *   - public/sitemap.xml       → static sitemap
 *   - public/robots.txt        → static robots.txt
 *   - src/lib/seo.ts           → reusable head meta helper
 */
function generateSeo(root, name, opts) {
    if (opts.stack === "next") {
        _nextSeo(root, name, opts);
    } else if (opts.stack === "react") {
        _reactSeo(root, name, opts);
    }
    // Node.js APIs don't need SEO
}

// ── Next.js SEO ──────────────────────────────────────────────────────────────

function _nextSeo(root, name, opts) {
    const seo = opts.seo;
    const url = opts.siteUrl || `https://${name}.com`;

    // ── src/app/sitemap.ts ────────────────────────────────────────────────────
    write(path.join(root, "src/app/sitemap.ts"), `import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "${url}";

/**
 * Dynamic sitemap — add your routes here as you build pages.
 * Next.js will serve this at /sitemap.xml automatically.
 *
 * Docs: https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap
 */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: \`\${BASE_URL}/about\`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: \`\${BASE_URL}/contact\`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Add more routes here as you build them:
    // { url: \`\${BASE_URL}/blog\`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
  ];
}
`);

    // ── src/app/robots.ts ────────────────────────────────────────────────────
    write(path.join(root, "src/app/robots.ts"), `import { MetadataRoute } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "${url}";

/**
 * robots.txt — controls how search engines crawl your site.
 * Next.js will serve this at /robots.txt automatically.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/dashboard/", "/admin/", "/_next/"],
      },
    ],
    sitemap: \`\${BASE_URL}/sitemap.xml\`,
    host: BASE_URL,
  };
}
`);

    // ── src/lib/seo.ts ───────────────────────────────────────────────────────
    write(path.join(root, "src/lib/seo.ts"), `import { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? "${url}";

interface SeoOptions {
  title?:       string;
  description?: string;
  image?:       string;
  url?:         string;
  noIndex?:     boolean;
}

/**
 * Reusable SEO metadata generator.
 *
 * Usage in any page.tsx:
 *   export const metadata = generateMetadata({ title: "About Us" });
 *
 * Or for dynamic pages:
 *   export async function generateMetadata({ params }) {
 *     return generateMetadata({ title: params.slug, description: "..." });
 *   }
 */
export function generateMetadata({
  title,
  description = "${seo.description}",
  image = "/og-image.png",
  url = BASE_URL,
  noIndex = false,
}: SeoOptions = {}): Metadata {
  const fullTitle = title ? \`\${title} | ${name}\` : "${name}";

  return {
    title:       fullTitle,
    description,
    metadataBase: new URL(BASE_URL),
    alternates:  { canonical: url },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true, googleBot: { index: true, follow: true } },
    openGraph: {
      title:       fullTitle,
      description,
      url,
      siteName:    "${name}",
      type:        "website",
      locale:      "en_US",
      images: [{ url: image, width: 1200, height: 630, alt: fullTitle }],
    },
    twitter: {
      card:        "summary_large_image",
      title:       fullTitle,
      description,
      images:      [image],
    },
    keywords: ${JSON.stringify(seo.keywords)},
  };
}

/**
 * Default site-wide metadata — used in layout.tsx.
 */
export const defaultMetadata: Metadata = generateMetadata();
`);

    // ── Update layout.tsx metadata to use generateMetadata ───────────────────
    // We write a separate seo-enhanced layout patch — the main layout already
    // exists, so we write a note file telling the dev what to do.
    write(path.join(root, "src/lib/seo.README.md"), `# SEO Setup

Your project has full SEO pre-configured. Here is what was generated:

## Files

| File | Purpose |
|------|---------|
| \`src/app/sitemap.ts\` | Dynamic sitemap — served at \`/sitemap.xml\` |
| \`src/app/robots.ts\`  | robots.txt — served at \`/robots.txt\` |
| \`src/lib/seo.ts\`     | \`generateMetadata()\` helper for all pages |

## Using generateMetadata in a page

\`\`\`ts
// src/app/about/page.tsx
import { generateMetadata as genMeta } from "@/lib/seo";

export const metadata = genMeta({
  title:       "About Us",
  description: "Learn more about ${name}.",
  url:         "/about",
});

export default function AboutPage() { ... }
\`\`\`

## Adding a new route to the sitemap

Open \`src/app/sitemap.ts\` and add your new route:

\`\`\`ts
{ url: \`\${BASE_URL}/blog\`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
\`\`\`

## Project description used for SEO

> ${seo.description}

## Keywords

${seo.keywords.map(k => `- ${k}`).join("\n")}
`);

    // ── Update layout.tsx to use defaultMetadata ─────────────────────────────
    // Re-write the layout to pull metadata from seo.ts
    const geistLine = "    <html lang=\"en\" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>";

    const layoutLines = [
        `import type { Metadata } from "next";`,
        `import { GeistSans } from "geist/font/sans";`,
        `import { GeistMono } from "geist/font/mono";`,
        `import Header from "@/components/Header";`,
        `import Footer from "@/components/Footer";`,
        `import { defaultMetadata } from "@/lib/seo";`,
        `import "./globals.css";`,
        ``,
        `export const metadata: Metadata = defaultMetadata;`,
        ``,
        `export default function RootLayout({ children }: { children: React.ReactNode }) {`,
        `  return (`,
        geistLine,
        `      <body className="min-h-screen bg-background font-sans antialiased flex flex-col">`,
        `        <Header />`,
        `        <main className="flex-1">`,
        `          {children}`,
        `        </main>`,
        `        <Footer />`,
        `      </body>`,
        `    </html>`,
        `  );`,
        `}`,
        ``,
    ].join("\n");

    // Overwrite layout with SEO-enhanced version
    write(path.join(root, "src/app/layout.tsx"), layoutLines);
}

// ── React SEO ─────────────────────────────────────────────────────────────────

function _reactSeo(root, name, opts) {
    const seo = opts.seo;
    const url = opts.siteUrl || `https://${name}.com`;
    const today = new Date().toISOString().split("T")[0];

    // ── public/sitemap.xml ───────────────────────────────────────────────────
    write(path.join(root, "public/sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">

  <url>
    <loc>${url}/</loc>
    <lastmod>${today}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>

  <url>
    <loc>${url}/about</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>

  <url>
    <loc>${url}/contact</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>

  <!-- Add more URLs here as you build pages -->

</urlset>
`);

    // ── public/robots.txt ────────────────────────────────────────────────────
    write(path.join(root, "public/robots.txt"), `User-agent: *
Allow: /
Disallow: /api/
Disallow: /dashboard/
Disallow: /admin/

Sitemap: ${url}/sitemap.xml
`);

    // ── src/lib/seo.ts ───────────────────────────────────────────────────────
    write(path.join(root, "src/lib/seo.ts"), `/**
 * SEO helper — inject <head> meta tags for any page.
 *
 * Usage (with react-helmet or manually in index.html):
 *   const meta = getSeoMeta({ title: "About Us" });
 */

const BASE_URL = import.meta.env.VITE_APP_URL ?? "${url}";
const SITE_NAME = "${name}";
const DEFAULT_DESCRIPTION = "${seo.description}";
const DEFAULT_KEYWORDS = ${JSON.stringify(seo.keywords)};

interface SeoMeta {
  title:       string;
  description: string;
  keywords:    string[];
  ogTitle:     string;
  ogDesc:      string;
  ogUrl:       string;
  canonical:   string;
}

export function getSeoMeta({
  title,
  description = DEFAULT_DESCRIPTION,
  url = BASE_URL,
}: {
  title?:       string;
  description?: string;
  url?:         string;
} = {}): SeoMeta {
  const fullTitle = title ? \`\${title} | \${SITE_NAME}\` : SITE_NAME;
  return {
    title:       fullTitle,
    description,
    keywords:    DEFAULT_KEYWORDS,
    ogTitle:     fullTitle,
    ogDesc:      description,
    ogUrl:       url,
    canonical:   url,
  };
}

export const defaultSeo = getSeoMeta();
`);

    // ── index.html — inject meta tags ────────────────────────────────────────
    // Overwrite index.html with full SEO head
    write(path.join(root, "index.html"), `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />

    <!-- Primary SEO -->
    <title>${name}</title>
    <meta name="description" content="${seo.description}" />
    <meta name="keywords" content="${seo.keywords.join(", ")}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />

    <!-- Open Graph -->
    <meta property="og:type"        content="website" />
    <meta property="og:site_name"   content="${name}" />
    <meta property="og:title"       content="${name}" />
    <meta property="og:description" content="${seo.description}" />
    <meta property="og:url"         content="${url}" />
    <meta property="og:image"       content="${url}/og-image.png" />

    <!-- Twitter Card -->
    <meta name="twitter:card"        content="summary_large_image" />
    <meta name="twitter:title"       content="${name}" />
    <meta name="twitter:description" content="${seo.description}" />
    <meta name="twitter:image"       content="${url}/og-image.png" />

    <!-- Favicon -->
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`);

    write(path.join(root, "src/lib/seo.README.md"), `# SEO Setup

## Files

| File | Purpose |
|------|---------|
| \`public/sitemap.xml\` | Static sitemap — submit to Google Search Console |
| \`public/robots.txt\`  | Search engine crawling rules |
| \`src/lib/seo.ts\`     | \`getSeoMeta()\` helper for page-level meta |
| \`index.html\`         | Pre-filled OG and Twitter meta tags |

## Adding a page to the sitemap

Open \`public/sitemap.xml\` and add:

\`\`\`xml
<url>
  <loc>${url}/blog</loc>
  <lastmod>${today}</lastmod>
  <changefreq>daily</changefreq>
  <priority>0.9</priority>
</url>
\`\`\`

## Project description used for SEO

> ${seo.description}

## Keywords

${seo.keywords.map(k => `- ${k}`).join("\n")}
`);
}

/**
 * Parse a free-text project description into structured SEO fields.
 * No AI needed — smart keyword extraction from the description itself.
 */
function parseSeoFromDescription(description, name) {
    const words = description
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 3);

    // Remove common stop words
    const stopWords = new Set([
        "that", "this", "with", "from", "have", "will", "been", "they",
        "their", "what", "when", "where", "which", "about", "into", "through",
        "during", "before", "after", "above", "below", "between", "each",
        "more", "also", "than", "then", "some", "your", "just", "over",
        "such", "like", "only", "both", "very", "well", "even", "most",
        "users", "user", "platform", "application", "system", "based",
    ]);

    const keywords = [...new Set(words.filter(w => !stopWords.has(w)))].slice(0, 10);

    // Keep description under 160 chars for meta tag
    const metaDesc = description.length > 155
        ? description.slice(0, 152) + "..."
        : description;

    return {
        description: metaDesc,
        keywords: [name, ...keywords],
    };
}

module.exports = { generateSeo, parseSeoFromDescription };