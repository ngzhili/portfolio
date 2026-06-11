# Personal Portfolio

A polished, fully-responsive developer portfolio built with **Next.js (App Router)**,
**TypeScript**, and **Tailwind CSS v4**. Dark theme, electric-violet + cyan accents,
smooth Framer Motion animations, and a Markdown (MDX) blog. Ships as a **static export**
for free hosting on **GitHub Pages**.

- ⚡ Static export — no server, deploys anywhere
- 📱 Mobile-first responsive (320 → 1440px+), accessible hamburger nav
- ♿ Semantic HTML, keyboard-navigable, focus states, reduced-motion aware
- 🔍 SEO: per-page metadata, Open Graph, sitemap, robots.txt
- ✍️ MDX blog with auto-generated post pages
- 🎨 All content in one easy-to-edit file

---

## Quick start (run locally)

Requires **Node 18+** (Node 20 recommended).

```bash
npm install      # install dependencies
npm run dev      # start the dev server → http://localhost:3000
```

Build a production static export and preview it:

```bash
npm run build    # outputs the static site to ./out (with .nojekyll)
npm run serve:out  # serve ./out locally to test the build
```

> Note: `npm run dev` serves at the site root. The GitHub Pages subpath
> (`basePath`) only applies to production builds, so links work in both.

---

## ✏️ How to edit your content

Almost everything lives in **`content/site.ts`** — open it and change the values:

| What | Where in `content/site.ts` |
| --- | --- |
| Name, role, tagline, intro | `site` object |
| Email + social links (GitHub, LinkedIn, X) | `socials` object |
| Public site URL (for SEO/sitemap) | `SITE_URL` constant |
| Work experience timeline | `experience` array |
| Projects / work gallery | `projects` array |
| Skills by category | `skills` array |
| About bio + stats | `about` object |

Other content:

- **Résumé:** replace `public/resume.pdf` with your real PDF (keep the filename).
- **Project thumbnails:** drop images in `public/projects/` and point each
  project's `image` field at them (e.g. `/projects/my-app.png`).
- **Social share image:** replace `public/og-image.svg` (ideally with a
  1200×630 PNG; then update `site.ogImage` in `content/site.ts`).
- **Blog posts:** add `.mdx` files in `content/blog/` — see below.
- **Nav items:** edit `src/lib/nav.ts` (ids must match each section's `id`).

### Writing blog posts

Create a file in `content/blog/`, e.g. `content/blog/my-post.mdx`:

```mdx
---
title: "My Post Title"
date: "2025-03-01"
excerpt: "A one-line summary shown on the blog index."
tags: ["nextjs", "career"]
author: "Your Name"
---

# Hello

Write **Markdown** here. Code blocks, lists, links, images — all supported.
```

The filename becomes the URL: `content/blog/my-post.mdx` → `/blog/my-post`.
Posts are sorted newest-first by `date`.

---

## 🚀 Deploy to GitHub Pages

### 1. Set the `basePath` for your repo

Open **`next.config.mjs`** and edit the single `repoName` line near the top:

```js
const repoName = '/portfolio'; // <-- CHANGE THIS
```

- **Project repo** (URL is `https://<user>.github.io/<repo>`):
  set it to `'/<your-repo-name>'` (must start with `/`).
- **User/org repo** (the repo is literally named `<user>.github.io`):
  set it to `''` (empty string).

Also set **`SITE_URL`** in `content/site.ts` to your final public URL so the
sitemap and Open Graph tags are correct.

### 2. Push to GitHub

```bash
git init
git add .
git commit -m "Initial portfolio"
git branch -M main
git remote add origin https://github.com/<your-username>/<your-repo>.git
git push -u origin main
```

### 3. Enable Pages (one time)

In your repo on GitHub: **Settings → Pages → Build and deployment → Source:
"GitHub Actions"**.

### 4. Done

The included workflow (`.github/workflows/deploy.yml`) runs on every push to
`main`: it installs deps, builds the static export to `out/` (with `.nojekyll`),
and deploys to Pages. Watch progress in the **Actions** tab; your site goes live
at `https://<your-username>.github.io/<your-repo>/`.

---

## Project structure

```
content/
  site.ts            # ⭐ all page content (edit this)
  blog/*.mdx         # blog posts
public/              # static assets (resume.pdf, og-image.svg, projects/)
src/
  app/               # routes: layout, home, blog, sitemap, robots
  components/
    layout/          # Navbar, Footer, Section, Container
    sections/        # Hero, Experience, Projects, Skills, About, Contact
    ui/              # Button, Tag, Reveal, icons
  lib/               # blog (MDX), nav, asset-path helpers
next.config.mjs      # static export + basePath (edit repoName here)
.github/workflows/deploy.yml  # GitHub Pages CI
```

## Tech notes

- **Tailwind v4** is configured in `src/app/globals.css` via `@theme` — there is
  no `tailwind.config.js`.
- `images.unoptimized: true` is required because static export has no image
  optimization server.
- The `postbuild` script copies `.nojekyll` into `out/` so GitHub Pages serves
  the `_next/` asset folder.

## License

MIT — make it yours.
