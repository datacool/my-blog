# My Blog — Claude Code Guide

## Project Overview

A static blog that reads local Markdown files and renders them as a clean, readable website. No build tools, no frameworks — pure HTML, CSS, and JavaScript only.

## Architecture

```
my-blog/
├── index.html          # Home page — lists all posts
├── post.html           # Single post viewer
├── style.css           # All styles (light + dark mode)
├── app.js              # Post list logic (fetches posts/index.json)
├── post.js             # Single post logic (fetches + renders Markdown)
├── marked.min.js       # Markdown parser (vendored, no CDN)
└── posts/
    ├── index.json      # Post manifest [{ slug, title, date, summary }]
    └── *.md            # Post content files
```

Navigation: `index.html` links to `post.html?slug=<slug>`. `post.js` reads the `slug` query param, fetches `posts/<slug>.md`, and renders it via `marked`.

## Design Constraints

- **No frameworks.** No React, Vue, Next.js, Tailwind, Bootstrap, or bundlers.
- **No CDN.** Vendor all third-party scripts (e.g., `marked.min.js`) locally.
- **Pure static.** Everything works when served from any static file server or opened via `file://`.
- Markdown rendering: use [marked.js](https://marked.js.org/) (vendored).

## Design Goals

| Goal | Implementation |
|------|---------------|
| Clean, readable typography | System font stack, comfortable line-height (~1.7), max-width ~720px |
| Dark mode | CSS `prefers-color-scheme` media query + `data-theme` toggle on `<html>` |
| Mobile-friendly | Fluid layout, no fixed widths, touch-friendly tap targets (≥44px) |
| Fast | No network requests beyond post `.md` files |

## CSS Conventions

- Use CSS custom properties (`--color-bg`, `--color-text`, `--color-accent`, etc.) for all theme values.
- Light mode values are set on `:root`; dark mode overrides inside `@media (prefers-color-scheme: dark)` AND when `html[data-theme="dark"]` (manual toggle).
- A single `<button id="theme-toggle">` in the header switches themes and persists the choice in `localStorage`.
- Breakpoint: `@media (max-width: 640px)` for mobile adjustments.

## CSS Custom Properties (reference)

```css
:root {
  --color-bg: #ffffff;
  --color-surface: #f5f5f5;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-accent: #2563eb;
  --color-border: #e5e5e5;
  --color-code-bg: #f3f4f6;
  --font-body: system-ui, -apple-system, sans-serif;
  --font-mono: ui-monospace, monospace;
  --max-width: 720px;
}
```

## posts/index.json Format

```json
[
  {
    "slug": "hello-world",
    "title": "Hello World",
    "date": "2026-06-05",
    "summary": "My first post."
  }
]
```

`slug` must match the filename: `posts/hello-world.md`.

## Key Behaviors

- **Theme toggle**: reads `localStorage.getItem('theme')` on page load; applies `data-theme` attribute to `<html>`; updates on button click.
- **404 handling**: if a `.md` fetch fails (404), show a friendly "Post not found" message instead of a blank page.
- **Date formatting**: display dates in a human-readable format (e.g., "June 5, 2026") using `Intl.DateTimeFormat`.
- **Page title**: set `document.title` dynamically to the post title on post pages.

## Commands

```bash
# Serve locally (Python)
python -m http.server 8080

# Serve locally (Node)
npx serve .
```

No build step needed. Edit files and refresh the browser.

## Non-Goals

- No search, tags, categories, or pagination in v1.
- No comments system.
- No RSS feed.
- No server-side rendering.
