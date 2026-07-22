#!/usr/bin/env node
/**
 * publish-blog.js
 * ----------------
 * Takes ONE Markdown post and:
 *   1. Generates a styled page at blog/<slug>.html, matching the site's
 *      existing design system (colors/fonts/layout lifted directly from the
 *      first hand-built post, blog/index.html, not reinvented).
 *   2. Pushes the same content to Dev.to via their API as a DRAFT (never
 *      auto-published — publishing is always a deliberate, separate action
 *      you take from your own Dev.to dashboard once you've reviewed it).
 *
 * IndieHackers has no public posting API, so that one still has to be a
 * manual copy-paste — this script prints the raw Markdown at the end
 * specifically so that's a paste, not a retype.
 *
 * Usage: node scripts/publish-blog.js posts/my-post.md
 */
const fs = require('fs');
const path = require('path');
const { marked } = require('marked');

const SITE_URL = 'https://minister-ballew.github.io/ai-partner-website';
const ROOT = path.resolve(__dirname, '..');
const CONFIG_PATH = path.join(__dirname, 'config.json');

function loadConfig() {
  if (!fs.existsSync(CONFIG_PATH)) return null;
  try {
    return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
  } catch {
    console.warn('Warning: scripts/config.json exists but is not valid JSON — skipping Dev.to publish.');
    return null;
  }
}

function parseFrontmatter(raw) {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error(
      'No frontmatter found. Start the file with:\n---\ntitle: ...\ndescription: ...\n---\n\nYour post body...'
    );
  }
  const [, fmBlock, body] = match;
  const meta = {};
  for (const line of fmBlock.split('\n')) {
    const lineMatch = line.match(/^([a-zA-Z_]+):\s*(.*)$/);
    if (lineMatch) meta[lineMatch[1].trim()] = lineMatch[2].trim();
  }
  return { meta, body: body.trim() };
}

function slugify(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 60);
}

function readingTime(text) {
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 200));
}

function wrapTablesForScroll(html) {
  return html
    .replace(/<table>/g, '<div class="table-scroll"><table class="compare">')
    .replace(/<\/table>/g, '</table></div>');
}

function renderPage({ title, description, tag, dek, slug, bodyHtml, minutes }) {
  const canonicalUrl = `${SITE_URL}/blog/${slug}.html`;
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>${title} | AI Partner 2.0</title>
<meta name="description" content="${description}" />
<link rel="canonical" href="${canonicalUrl}" />
<meta property="og:type" content="article" />
<meta property="og:title" content="${title}" />
<meta property="og:description" content="${description}" />
<meta property="og:url" content="${canonicalUrl}" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --surface-0: #05070a;
  --surface-1: #0b0f16;
  --surface-2: #121722;
  --surface-3: #1a212f;
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.16);
  --text-primary: #e8edf5;
  --text-muted: #9aa5b5;
  --text-dim: #5f6b7d;
  --cyan: #22d3ee;
  --purple: #a855f7;
  --green: #34d399;
  --amber: #fbbf24;
  --red: #f87171;
  --font-display: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  --font-body: 'Manrope', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  --max: 1080px;
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--surface-0);
  background-image:
    linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
img { max-width: 100%; display: block; }
a { color: inherit; }
:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }
h1, h2, h3 { text-wrap: balance; margin: 0; font-weight: 700; letter-spacing: -0.01em; }
p { margin: 0; }
.wrap { max-width: var(--max); margin: 0 auto; padding: 0 24px; }
.tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}
.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--surface-0) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.nav .wrap { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.nav-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-mono); font-weight: 700; font-size: 15px; letter-spacing: 0.02em; text-decoration: none; color: var(--text-primary); }
.nav-links { display: flex; align-items: center; gap: 28px; }
.nav-links a { font-size: 14px; color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.nav-links a:hover { color: var(--text-primary); }
.nav-cta {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--surface-0) !important;
  background: var(--cyan);
  padding: 9px 16px;
  border-radius: 5px;
  text-decoration: none;
  transition: filter 0.15s;
}
.nav-cta:hover { filter: brightness(1.1); }
.article-head { padding: 64px 0 40px; text-align: center; }
.article-head .tag { color: var(--cyan); display: block; margin-bottom: 20px; }
.article-head h1 {
  font-family: var(--font-display);
  font-size: clamp(26px, 4vw, 42px);
  line-height: 1.2;
  max-width: 820px;
  margin: 0 auto 20px;
}
.article-head .dek { max-width: 640px; margin: 0 auto; color: var(--text-muted); font-size: 17px; }
.article-meta { margin-top: 24px; font-family: var(--font-mono); font-size: 12.5px; color: var(--text-dim); }
.hero-image { max-width: 780px; width: 100%; margin: 0 auto 8px; border-radius: 10px; border: 1px solid var(--border); display: block; }
.prose { max-width: 720px; margin: 0 auto; padding-bottom: 24px; }
.prose h2 {
  font-family: var(--font-display);
  font-size: clamp(21px, 2.6vw, 27px);
  margin: 56px 0 18px;
  color: var(--text-primary);
}
.prose h3 { font-size: 17px; margin: 28px 0 10px; color: var(--text-primary); }
.prose p { margin: 0 0 18px; color: var(--text-muted); font-size: 15.5px; }
.prose p strong, .prose li strong { color: var(--text-primary); font-weight: 700; }
.prose ul, .prose ol { margin: 0 0 18px; padding-left: 22px; color: var(--text-muted); font-size: 15.5px; }
.prose li { margin-bottom: 8px; }
.prose li::marker { color: var(--cyan); }
.prose blockquote {
  border-left: 3px solid var(--purple);
  background: var(--surface-1);
  padding: 18px 22px;
  border-radius: 0 8px 8px 0;
  margin: 28px 0;
  font-size: 15px;
  color: var(--text-primary);
}
.prose blockquote p { color: var(--text-primary); margin: 0; }
.prose a { color: var(--cyan); text-decoration: underline; text-underline-offset: 2px; }
.prose code { font-family: var(--font-mono); font-size: 0.9em; background: var(--surface-1); padding: 2px 6px; border-radius: 4px; }
.table-scroll { overflow-x: auto; margin: 24px 0 32px; border: 1px solid var(--border); border-radius: 8px; }
table.compare { width: 100%; border-collapse: collapse; font-size: 13.5px; min-width: 480px; }
table.compare th, table.compare td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--border); white-space: normal; }
table.compare th { font-family: var(--font-mono); font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: var(--text-dim); background: var(--surface-1); }
table.compare td { color: var(--text-muted); }
table.compare tr:last-child td { border-bottom: none; }
table.compare td:first-child, table.compare th:first-child { color: var(--text-primary); font-weight: 600; }
.cta-block { background: var(--surface-1); border: 1px solid rgba(34,211,238,0.25); border-radius: 10px; padding: 32px; margin: 40px 0; }
.cta-block h3 { font-size: 18px; margin-bottom: 14px; }
.cta-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-top: 18px; }
.btn {
  font-family: var(--font-mono);
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  text-decoration: none !important;
  padding: 12px 20px;
  border-radius: 6px;
  transition: transform 0.15s, filter 0.15s, background 0.15s;
  display: inline-flex;
  align-items: center;
  gap: 8px;
}
.btn:hover { transform: translateY(-1px); }
.btn-primary { background: var(--cyan); color: var(--surface-0) !important; box-shadow: 0 0 0 1px rgba(34,211,238,0.4), 0 8px 24px rgba(34,211,238,0.18); }
.btn-primary:hover { filter: brightness(1.08); }
.btn-secondary { background: var(--surface-2); color: var(--text-primary) !important; border: 1px solid var(--border-strong); }
.btn-secondary:hover { background: var(--surface-3); }
footer { border-top: 1px solid var(--border); padding: 48px 0; text-align: center; }
footer .tag { color: var(--text-dim); }
.footer-links { display: flex; justify-content: center; gap: 24px; margin-top: 18px; }
.footer-links a { font-size: 13.5px; color: var(--text-muted); text-decoration: none; }
.footer-links a:hover { color: var(--text-primary); }
</style>
<script data-goatcounter="https://jball3w3.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</head>
<body>

<nav class="nav">
  <div class="wrap">
    <a class="nav-brand" href="../">AI PARTNER</a>
    <div class="nav-links">
      <a href="../#features">Features</a>
      <a href="../#pricing">Pricing</a>
      <a href="../#faq">FAQ</a>
    </div>
    <a class="nav-cta" href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-nav">Get AI Partner</a>
  </div>
</nav>

<header class="article-head">
  <div class="wrap">
    <span class="tag">${tag}</span>
    <h1>${title}</h1>
    <p class="dek">${dek}</p>
    <div class="article-meta">AI PARTNER TEAM — ${minutes} MIN READ</div>
  </div>
</header>

<article class="prose">
${bodyHtml}

<div class="cta-block">
<h3>Try it free first</h3>
<p style="color:var(--text-muted); font-size:14.5px;">The Community tier is free, no card required: chat, 2 agents, Project Builder, and Creative Studio. It's enough to get a real feel for local-first before spending anything.</p>
<div class="cta-grid">
<a class="btn btn-secondary" href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-${slug}-community">Download free</a>
<a class="btn btn-primary" href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-${slug}-standard">Get Standard — $29</a>
<a class="btn btn-secondary" href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-${slug}-pro">Get Pro — $49</a>
</div>
</div>

</article>

<footer>
  <div class="wrap">
    <span class="tag">AI Partner 2.0</span>
    <div class="footer-links">
      <a href="../">Home</a>
      <a href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-footer">Gumroad</a>
      <a href="../#pricing">Pricing</a>
      <a href="../#faq">FAQ</a>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

const POSTS_MANIFEST_PATH = path.join(ROOT, 'blog', 'posts.json');

function loadPostsManifest() {
  if (!fs.existsSync(POSTS_MANIFEST_PATH)) return [];
  try {
    return JSON.parse(fs.readFileSync(POSTS_MANIFEST_PATH, 'utf-8'));
  } catch {
    console.warn('Warning: blog/posts.json exists but is not valid JSON — starting a fresh one.');
    return [];
  }
}

function upsertPostsManifest({ slug, title, description, tag }) {
  const posts = loadPostsManifest();
  const existing = posts.find((p) => p.slug === slug);
  if (existing) {
    // Keep the original publish date on a re-run (e.g. fixing a typo)
    // instead of bumping it to today, so the listing stays in real order.
    existing.title = title;
    existing.description = description;
    existing.tag = tag;
  } else {
    posts.push({ slug, title, description, tag, date: new Date().toISOString().slice(0, 10) });
  }
  fs.writeFileSync(POSTS_MANIFEST_PATH, JSON.stringify(posts, null, 2), 'utf-8');
  return posts;
}

function renderIndexPage(posts) {
  const sorted = [...posts].sort((a, b) => (a.date < b.date ? 1 : -1));
  const cards = sorted
    .map(
      (p) => `
<a class="post-card" href="${p.slug}.html">
  <span class="tag">${p.tag}</span>
  <h2>${p.title}</h2>
  <p>${p.description}</p>
  <span class="post-date">${p.date}</span>
</a>`
    )
    .join('\n');

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>Blog | AI Partner 2.0</title>
<meta name="description" content="Honest comparisons and guides on local AI, privacy, and running your own AI assistant instead of renting one." />
<link rel="canonical" href="${SITE_URL}/blog/" />
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<style>
:root {
  --surface-0: #05070a;
  --surface-1: #0b0f16;
  --surface-2: #121722;
  --surface-3: #1a212f;
  --border: rgba(255,255,255,0.08);
  --border-strong: rgba(255,255,255,0.16);
  --text-primary: #e8edf5;
  --text-muted: #9aa5b5;
  --text-dim: #5f6b7d;
  --cyan: #22d3ee;
  --purple: #a855f7;
  --font-display: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  --font-body: 'Manrope', system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, 'SF Mono', Consolas, monospace;
  --max: 1080px;
}
*, *::before, *::after { box-sizing: border-box; }
html { scroll-behavior: smooth; }
body {
  margin: 0;
  background: var(--surface-0);
  background-image:
    linear-gradient(rgba(34,211,238,0.025) 1px, transparent 1px),
    linear-gradient(90deg, rgba(34,211,238,0.025) 1px, transparent 1px);
  background-size: 48px 48px;
  color: var(--text-primary);
  font-family: var(--font-body);
  font-size: 16px;
  line-height: 1.65;
  -webkit-font-smoothing: antialiased;
}
a { color: inherit; }
:focus-visible { outline: 2px solid var(--cyan); outline-offset: 3px; }
h1, h2 { text-wrap: balance; margin: 0; font-weight: 700; letter-spacing: -0.01em; }
p { margin: 0; }
.wrap { max-width: var(--max); margin: 0 auto; padding: 0 24px; }
.tag {
  font-family: var(--font-mono);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--cyan);
}
.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: color-mix(in srgb, var(--surface-0) 88%, transparent);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid var(--border);
}
.nav .wrap { display: flex; align-items: center; justify-content: space-between; height: 64px; }
.nav-brand { display: flex; align-items: center; gap: 10px; font-family: var(--font-mono); font-weight: 700; font-size: 15px; letter-spacing: 0.02em; text-decoration: none; color: var(--text-primary); }
.nav-links { display: flex; align-items: center; gap: 28px; }
.nav-links a { font-size: 14px; color: var(--text-muted); text-decoration: none; transition: color 0.15s; }
.nav-links a:hover { color: var(--text-primary); }
.nav-cta {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--surface-0) !important;
  background: var(--cyan);
  padding: 9px 16px;
  border-radius: 5px;
  text-decoration: none;
  transition: filter 0.15s;
}
.nav-cta:hover { filter: brightness(1.1); }
.page-head { padding: 64px 0 40px; text-align: center; }
.page-head h1 {
  font-family: var(--font-display);
  font-size: clamp(28px, 4.4vw, 44px);
  margin: 16px 0 12px;
}
.page-head p { color: var(--text-muted); font-size: 17px; max-width: 560px; margin: 0 auto; }
.post-list { max-width: 720px; margin: 0 auto; padding-bottom: 64px; display: flex; flex-direction: column; gap: 16px; }
.post-card {
  display: block;
  background: var(--surface-1);
  border: 1px solid var(--border);
  border-radius: 10px;
  padding: 24px 28px;
  text-decoration: none;
  transition: border-color 0.15s, background 0.15s;
}
.post-card:hover { border-color: rgba(34,211,238,0.35); background: var(--surface-2); }
.post-card h2 { font-size: 19px; margin: 10px 0 10px; color: var(--text-primary); }
.post-card p { color: var(--text-muted); font-size: 14.5px; margin-bottom: 12px; }
.post-date { font-family: var(--font-mono); font-size: 11.5px; color: var(--text-dim); }
footer { border-top: 1px solid var(--border); padding: 48px 0; text-align: center; }
footer .tag { color: var(--text-dim); }
.footer-links { display: flex; justify-content: center; gap: 24px; margin-top: 18px; }
.footer-links a { font-size: 13.5px; color: var(--text-muted); text-decoration: none; }
.footer-links a:hover { color: var(--text-primary); }
</style>
<script data-goatcounter="https://jball3w3.goatcounter.com/count" async src="//gc.zgo.at/count.js"></script>
</head>
<body>

<nav class="nav">
  <div class="wrap">
    <a class="nav-brand" href="../">AI PARTNER</a>
    <div class="nav-links">
      <a href="../#features">Features</a>
      <a href="../#pricing">Pricing</a>
      <a href="../#faq">FAQ</a>
    </div>
    <a class="nav-cta" href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-index-nav">Get AI Partner</a>
  </div>
</nav>

<header class="page-head">
  <div class="wrap">
    <span class="tag">Blog</span>
    <h1>Honest takes on local AI</h1>
    <p>Comparisons, guides, and the occasional fine-print reading — no hype, just what's actually true.</p>
  </div>
</header>

<div class="wrap">
  <div class="post-list">
${cards}
  </div>
</div>

<footer>
  <div class="wrap">
    <span class="tag">AI Partner 2.0</span>
    <div class="footer-links">
      <a href="../">Home</a>
      <a href="https://ballewster4.gumroad.com/l/vmgro" data-goatcounter-click="cta-blog-index-footer">Gumroad</a>
      <a href="../#pricing">Pricing</a>
      <a href="../#faq">FAQ</a>
    </div>
  </div>
</footer>

</body>
</html>
`;
}

async function publishToDevTo({ title, description, body, canonicalUrl, tags }) {
  const config = loadConfig();
  if (!config || !config.devto || !config.devto.enabled) {
    console.log('\n[Dev.to] Skipped — no scripts/config.json with a Dev.to API key found.');
    console.log('          Copy scripts/config.example.json to scripts/config.json and paste your key in to enable this.');
    return null;
  }
  const apiKey = config.devto.apiKey;
  if (!apiKey || apiKey.includes('PASTE_YOUR')) {
    console.log('\n[Dev.to] Skipped — scripts/config.json still has the placeholder API key.');
    return null;
  }

  const resp = await fetch('https://dev.to/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'api-key': apiKey },
    body: JSON.stringify({
      article: {
        title,
        description,
        body_markdown: body,
        published: false, // always a draft — publishing itself stays a manual, deliberate step
        tags,
        canonical_url: canonicalUrl,
      },
    }),
  });

  const data = await resp.json();
  if (!resp.ok) {
    throw new Error(`Dev.to API error (${resp.status}): ${JSON.stringify(data)}`);
  }
  return data;
}

async function main() {
  const inputPath = process.argv[2];

  if (inputPath === '--rebuild-index') {
    const posts = loadPostsManifest();
    fs.writeFileSync(path.join(ROOT, 'blog', 'index.html'), renderIndexPage(posts), 'utf-8');
    console.log(`✓ Rebuilt blog/index.html from blog/posts.json (${posts.length} post${posts.length === 1 ? '' : 's'})`);
    return;
  }

  if (!inputPath) {
    console.error('Usage: node scripts/publish-blog.js posts/my-post.md');
    console.error('   or: node scripts/publish-blog.js --rebuild-index');
    process.exit(1);
  }

  const raw = fs.readFileSync(path.resolve(inputPath), 'utf-8');
  const { meta, body } = parseFrontmatter(raw);

  const required = ['title', 'description'];
  for (const key of required) {
    if (!meta[key]) throw new Error(`Missing required frontmatter field: ${key}`);
  }

  const title = meta.title;
  const description = meta.description;
  const tag = meta.tag || 'Blog';
  const dek = meta.dek || description;
  const slug = meta.slug || slugify(title);
  const devtoTags = (meta.devto_tags || 'ai,localfirst')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 4);
  const minutes = readingTime(body);

  let bodyHtml = marked.parse(body);
  bodyHtml = wrapTablesForScroll(bodyHtml);

  const page = renderPage({ title, description, tag, dek, slug, bodyHtml, minutes });
  const outPath = path.join(ROOT, 'blog', `${slug}.html`);
  fs.writeFileSync(outPath, page, 'utf-8');
  console.log(`\n✓ Wrote ${path.relative(ROOT, outPath)}`);

  const posts = upsertPostsManifest({ slug, title, description, tag });
  const indexPage = renderIndexPage(posts);
  fs.writeFileSync(path.join(ROOT, 'blog', 'index.html'), indexPage, 'utf-8');
  console.log(`✓ Updated blog/index.html listing (${posts.length} post${posts.length === 1 ? '' : 's'})`);

  const canonicalUrl = `${SITE_URL}/blog/${slug}.html`;

  try {
    const devtoResult = await publishToDevTo({ title, description, body, canonicalUrl, tags: devtoTags });
    if (devtoResult) {
      console.log(`✓ Dev.to draft created: "${devtoResult.title}"`);
      console.log('  Drafts have no public preview link (Dev.to only routes published articles).');
      console.log('  Find it at https://dev.to/dashboard — it\'ll be listed with a Draft label — review it there, then hit Publish yourself.');
    }
  } catch (err) {
    console.error(`\n✗ Dev.to publish failed: ${err.message}`);
  }

  console.log('\n— IndieHackers —');
  console.log('No public posting API exists for this one, so it still needs a manual paste.');
  console.log('Raw Markdown for copy-paste is the source file you just ran this on:');
  console.log(`  ${path.resolve(inputPath)}`);

  console.log(`\nNext: git add blog/${slug}.html blog/index.html blog/posts.json && git commit && git push to make it live on your site.`);
}

main().catch((err) => {
  console.error('\nError:', err.message);
  process.exit(1);
});
