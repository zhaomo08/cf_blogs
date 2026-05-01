# Cloudflare 图文博客实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 使用 Astro 5 + Cloudflare Pages 构建图文博客，支持中英双语、全文搜索、拍摄地地图、RSS、暗色模式，全部在 Cloudflare 免费套餐内运行。

**Architecture:** 全站 SSG 静态生成，deploy 到 Cloudflare Pages。图片存储在 Cloudflare R2，通过自定义域名 CDN 访问。搜索由 Pagefind 在构建时生成静态索引，客户端本地运行。

**Tech Stack:** Astro 5、@astrojs/rss、@astrojs/sitemap、Leaflet.js、Pagefind、Cloudflare Pages、Cloudflare R2、wrangler CLI

---

## 文件清单

| 文件 | 职责 |
|------|------|
| `astro.config.mjs` | Astro 配置：output static、sitemap 集成、site URL |
| `src/content/config.ts` | 博客文章 schema（title、date、location、cover 等） |
| `src/i18n/index.ts` | 语言枚举、默认语言常量 |
| `src/i18n/translations.ts` | UI 翻译字符串、`t()`、`getLangFromUrl()`、`getAlternateUrl()` |
| `src/styles/global.css` | CSS 自定义属性（light/dark token）、基础样式重置 |
| `src/layouts/BaseLayout.astro` | HTML 外壳：SEO meta、OG 标签、anti-FOUC 脚本、head slot |
| `src/layouts/PostLayout.astro` | 文章页布局：封面图、标签、正文、地图、上下篇导航 |
| `src/components/ThemeToggle.astro` | 暗色模式切换按钮 |
| `src/components/LanguageSwitcher.astro` | 语言切换链接 |
| `src/components/Header.astro` | 顶部导航（logo、nav、语言切换、主题切换） |
| `src/components/Footer.astro` | 页脚（版权、RSS 链接、sitemap） |
| `src/components/PostCard.astro` | 文章卡片（封面图、标题、摘要、标签、日期） |
| `src/components/LocationMap.astro` | Leaflet 地图组件，仅在有 location 时渲染 |
| `src/pages/index.astro` | 根路径重定向到 /zh/ |
| `src/pages/search.astro` | Pagefind 搜索页 |
| `src/pages/[lang]/index.astro` | 首页：文章列表 |
| `src/pages/[lang]/blog/[slug].astro` | 文章详情页 |
| `src/pages/[lang]/rss.xml.ts` | RSS Feed 端点 |
| `wrangler.toml` | Cloudflare 项目配置 |

---

## Task 1：项目初始化

**Files:**
- Create: `package.json`
- Create: `astro.config.mjs`
- Create: `tsconfig.json`
- Create: `public/favicon.svg`

- [ ] **Step 1: 初始化 Astro 项目**

```bash
cd /Users/mesay/AI/antigravity_learn/cloudflare_
npm create astro@latest . -- --template minimal --typescript strict --no-install --no-git
```

预期输出：生成 `astro.config.mjs`、`tsconfig.json`、`src/env.d.ts`

- [ ] **Step 2: 安装依赖**

```bash
npm install
npm install @astrojs/rss @astrojs/sitemap leaflet
npm install -D @types/leaflet pagefind wrangler
```

- [ ] **Step 3: 覆盖 astro.config.mjs**

```javascript
// astro.config.mjs
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';

export default defineConfig({
  site: 'https://yourdomain.com',
  output: 'static',
  integrations: [sitemap()],
});
```

> 注意：`site` 字段在获取域名后替换为实际域名。

- [ ] **Step 4: 更新 package.json scripts**

打开 `package.json`，将 scripts 改为：

```json
{
  "scripts": {
    "dev": "astro dev",
    "build": "astro build && npx pagefind --site dist",
    "preview": "astro preview",
    "check": "astro check"
  }
}
```

- [ ] **Step 5: 创建 favicon**

```bash
cat > public/favicon.svg << 'EOF'
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <text y="26" font-size="28">📷</text>
</svg>
EOF
```

- [ ] **Step 6: 验证 dev server 启动**

```bash
npm run dev
```

预期：`http://localhost:4321` 可访问（空白页面即可）

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: initialize Astro project with dependencies"
```

---

## Task 2：Content Schema + 示例文章

**Files:**
- Create: `src/content/config.ts`
- Create: `src/content/blog/zh/hello-world.md`
- Create: `src/content/blog/en/hello-world.md`

- [ ] **Step 1: 创建 Content Collection schema**

```typescript
// src/content/config.ts
import { defineCollection, z } from 'astro:content';

const blog = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    date: z.coerce.date(),
    cover: z.string().optional(),
    tags: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    location: z.object({
      name: z.string(),
      lat: z.number(),
      lng: z.number(),
    }).optional(),
  }),
});

export const collections = { blog };
```

- [ ] **Step 2: 创建中文示例文章**

```markdown
<!-- src/content/blog/zh/hello-world.md -->
---
title: "你好，世界"
description: "这是我的第一篇博客文章，记录一次清晨的漫步。"
date: 2026-05-01
cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
tags: ["随笔", "生活"]
location:
  name: "北京，中国"
  lat: 39.9042
  lng: 116.4074
---

欢迎来到我的博客！

这是一篇测试文章，用来验证博客的各项功能是否正常工作。

![城市风光](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800)

今天的天气很好，适合出门拍照。
```

- [ ] **Step 3: 创建英文示例文章**

```markdown
<!-- src/content/blog/en/hello-world.md -->
---
title: "Hello, World"
description: "My first blog post, documenting a morning walk."
date: 2026-05-01
cover: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800"
tags: ["journal", "life"]
location:
  name: "Beijing, China"
  lat: 39.9042
  lng: 116.4074
---

Welcome to my blog!

This is a test post to verify all blog features are working correctly.

![City view](https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800)

Great weather today — perfect for taking photos.
```

- [ ] **Step 4: 验证 schema 类型正确**

```bash
npm run check
```

预期：无 TypeScript 错误

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add content schema and sample posts"
```

---

## Task 3：全局样式 + 翻译系统

**Files:**
- Create: `src/styles/global.css`
- Create: `src/i18n/index.ts`
- Create: `src/i18n/translations.ts`

- [ ] **Step 1: 创建全局 CSS**

```css
/* src/styles/global.css */
:root {
  --color-bg: #ffffff;
  --color-bg-secondary: #f5f5f5;
  --color-text: #1a1a1a;
  --color-text-muted: #666666;
  --color-accent: #0066cc;
  --color-border: #e5e5e5;
  --max-width: 760px;
  --font-sans: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-mono: 'Fira Code', 'Cascadia Code', Consolas, monospace;
}

[data-theme="dark"] {
  --color-bg: #111111;
  --color-bg-secondary: #1e1e1e;
  --color-text: #e8e8e8;
  --color-text-muted: #999999;
  --color-accent: #5ba3ff;
  --color-border: #2e2e2e;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  line-height: 1.6;
  transition: background-color 0.2s ease, color 0.2s ease;
}

a { color: var(--color-accent); text-decoration: none; }
a:hover { text-decoration: underline; }

img { max-width: 100%; height: auto; display: block; }

pre, code { font-family: var(--font-mono); }

pre {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 1rem;
  overflow-x: auto;
}

code:not(pre code) {
  background: var(--color-bg-secondary);
  border: 1px solid var(--color-border);
  border-radius: 3px;
  padding: 0.1em 0.4em;
  font-size: 0.9em;
}

h1, h2, h3, h4 { line-height: 1.3; }
```

- [ ] **Step 2: 创建 i18n 索引**

```typescript
// src/i18n/index.ts
export const LANGUAGES = { zh: '中文', en: 'English' } as const;
export type Lang = keyof typeof LANGUAGES;
export const DEFAULT_LANG: Lang = 'zh';
export const SUPPORTED_LANGS = Object.keys(LANGUAGES) as Lang[];
```

- [ ] **Step 3: 创建翻译工具**

```typescript
// src/i18n/translations.ts
import type { Lang } from './index';
import { DEFAULT_LANG, SUPPORTED_LANGS } from './index';

const ui = {
  zh: {
    'nav.home': '首页',
    'nav.search': '搜索',
    'nav.rss': '订阅',
    'post.tags': '标签',
    'post.location': '拍摄地',
    'post.back': '← 返回',
    'post.prev': '上一篇',
    'post.next': '下一篇',
    'search.title': '搜索',
    'search.placeholder': '搜索文章...',
    'footer.rights': '版权所有',
  },
  en: {
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.rss': 'RSS',
    'post.tags': 'Tags',
    'post.location': 'Location',
    'post.back': '← Back',
    'post.prev': 'Previous',
    'post.next': 'Next',
    'search.title': 'Search',
    'search.placeholder': 'Search posts...',
    'footer.rights': 'All rights reserved',
  },
} as const;

export type TranslationKey = keyof typeof ui['zh'];

export function t(lang: Lang, key: TranslationKey): string {
  return ui[lang][key] ?? ui[DEFAULT_LANG][key] ?? key;
}

export function getLangFromUrl(url: URL): Lang {
  const first = url.pathname.split('/').filter(Boolean)[0];
  return SUPPORTED_LANGS.includes(first as Lang) ? (first as Lang) : DEFAULT_LANG;
}

export function getAlternateUrl(url: URL, targetLang: Lang): string {
  const segments = url.pathname.split('/').filter(Boolean);
  if (SUPPORTED_LANGS.includes(segments[0] as Lang)) {
    segments[0] = targetLang;
  } else {
    segments.unshift(targetLang);
  }
  return '/' + segments.join('/');
}
```

- [ ] **Step 4: 类型检查**

```bash
npm run check
```

预期：无错误

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "feat: add global styles and i18n translation system"
```

---

## Task 4：BaseLayout

**Files:**
- Create: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: 创建 BaseLayout**

```astro
---
// src/layouts/BaseLayout.astro
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  image?: string;
  lang?: string;
}

const {
  title,
  description,
  image,
  lang = 'zh',
} = Astro.props;

const canonicalURL = Astro.url.href;
const siteName = 'My Blog';
---
<!DOCTYPE html>
<html lang={lang}>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title} | {siteName}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:site_name" content={siteName} />
    <meta property="og:type" content="website" />
    {image && <meta property="og:image" content={image} />}
    <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {image && <meta name="twitter:image" content={image} />}
    <slot name="head" />
    <script is:inline>
      const saved = localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = saved ?? preferred;
    </script>
  </head>
  <body>
    <slot />
  </body>
</html>
```

- [ ] **Step 2: 验证类型检查通过**

```bash
npm run check
```

- [ ] **Step 3: Commit**

```bash
git add src/layouts/BaseLayout.astro
git commit -m "feat: add BaseLayout with SEO meta and anti-FOUC dark mode"
```

---

## Task 5：ThemeToggle + LanguageSwitcher

**Files:**
- Create: `src/components/ThemeToggle.astro`
- Create: `src/components/LanguageSwitcher.astro`

- [ ] **Step 1: 创建 ThemeToggle**

```astro
<!-- src/components/ThemeToggle.astro -->
<button id="theme-toggle" aria-label="切换主题">
  <span class="sun">☀️</span>
  <span class="moon">🌙</span>
</button>

<script>
  const btn = document.getElementById('theme-toggle')!;
  const html = document.documentElement;

  function sync() {
    const dark = html.dataset.theme === 'dark';
    (btn.querySelector('.sun') as HTMLElement).style.display = dark ? 'none' : 'inline';
    (btn.querySelector('.moon') as HTMLElement).style.display = dark ? 'inline' : 'none';
  }

  sync();

  btn.addEventListener('click', () => {
    const next = html.dataset.theme === 'dark' ? 'light' : 'dark';
    html.dataset.theme = next;
    localStorage.setItem('theme', next);
    sync();
  });
</script>

<style>
  button {
    background: none;
    border: 1px solid var(--color-border);
    border-radius: 6px;
    cursor: pointer;
    padding: 4px 10px;
    font-size: 1rem;
    line-height: 1;
    color: var(--color-text);
  }
  button:hover { background: var(--color-bg-secondary); }
</style>
```

- [ ] **Step 2: 创建 LanguageSwitcher**

```astro
---
// src/components/LanguageSwitcher.astro
import { LANGUAGES, type Lang } from '../i18n/index';
import { getAlternateUrl } from '../i18n/translations';

interface Props {
  currentLang: Lang;
}
const { currentLang } = Astro.props;
---
<div class="lang-switcher">
  {Object.entries(LANGUAGES).map(([lang, label]) =>
    lang === currentLang
      ? <span class="active">{label}</span>
      : <a href={getAlternateUrl(Astro.url, lang as Lang)}>{label}</a>
  )}
</div>

<style>
  .lang-switcher { display: flex; gap: 0.5rem; align-items: center; font-size: 0.9rem; }
  .active { font-weight: 700; color: var(--color-text); }
  a { color: var(--color-text-muted); }
  a:hover { color: var(--color-accent); text-decoration: none; }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/ThemeToggle.astro src/components/LanguageSwitcher.astro
git commit -m "feat: add ThemeToggle and LanguageSwitcher components"
```

---

## Task 6：Header + Footer

**Files:**
- Create: `src/components/Header.astro`
- Create: `src/components/Footer.astro`

- [ ] **Step 1: 创建 Header**

```astro
---
// src/components/Header.astro
import ThemeToggle from './ThemeToggle.astro';
import LanguageSwitcher from './LanguageSwitcher.astro';
import { t, type Lang } from '../i18n/translations';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
---
<header>
  <nav class="nav-inner">
    <a href={`/${lang}/`} class="logo">📷 Blog</a>
    <div class="nav-links">
      <a href={`/${lang}/`}>{t(lang, 'nav.home')}</a>
      <a href="/search">{t(lang, 'nav.search')}</a>
      <a href={`/${lang}/rss.xml`} title="RSS">{t(lang, 'nav.rss')}</a>
    </div>
    <div class="nav-actions">
      <LanguageSwitcher currentLang={lang} />
      <ThemeToggle />
    </div>
  </nav>
</header>

<style>
  header {
    border-bottom: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    position: sticky;
    top: 0;
    background: var(--color-bg);
    z-index: 100;
  }
  .nav-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    display: flex;
    align-items: center;
    gap: 1.5rem;
  }
  .logo { font-weight: 700; font-size: 1.1rem; color: var(--color-text); flex-shrink: 0; }
  .logo:hover { text-decoration: none; opacity: 0.8; }
  .nav-links { display: flex; gap: 1.25rem; flex: 1; }
  .nav-links a { color: var(--color-text-muted); font-size: 0.95rem; }
  .nav-links a:hover { color: var(--color-accent); text-decoration: none; }
  .nav-actions { display: flex; align-items: center; gap: 0.75rem; flex-shrink: 0; }
</style>
```

- [ ] **Step 2: 创建 Footer**

```astro
---
// src/components/Footer.astro
import { t, type Lang } from '../i18n/translations';

interface Props {
  lang: Lang;
}
const { lang } = Astro.props;
const year = new Date().getFullYear();
---
<footer>
  <div class="footer-inner">
    <p>© {year} {t(lang, 'footer.rights')}</p>
    <div class="footer-links">
      <a href={`/${lang}/rss.xml`}>RSS</a>
      <a href="/sitemap-index.xml">Sitemap</a>
    </div>
  </div>
</footer>

<style>
  footer {
    border-top: 1px solid var(--color-border);
    padding: 1.5rem 1rem;
    margin-top: 4rem;
    color: var(--color-text-muted);
    font-size: 0.875rem;
  }
  .footer-inner {
    max-width: var(--max-width);
    margin: 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .footer-links { display: flex; gap: 1rem; }
  .footer-links a { color: var(--color-text-muted); }
  .footer-links a:hover { color: var(--color-accent); }
</style>
```

- [ ] **Step 3: Commit**

```bash
git add src/components/Header.astro src/components/Footer.astro
git commit -m "feat: add Header and Footer components"
```

---

## Task 7：PostCard 组件

**Files:**
- Create: `src/components/PostCard.astro`

- [ ] **Step 1: 创建 PostCard**

```astro
---
// src/components/PostCard.astro
import type { CollectionEntry } from 'astro:content';
import type { Lang } from '../i18n/index';

interface Props {
  post: CollectionEntry<'blog'>;
  lang: Lang;
}
const { post, lang } = Astro.props;
const { title, description, date, cover, tags } = post.data;

const postSlug = post.slug.split('/').slice(1).join('/');
const href = `/${lang}/blog/${postSlug}`;
const dateStr = date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
});
---
<article class="post-card">
  {cover && (
    <a href={href} class="card-image-link">
      <img src={cover} alt={title} loading="lazy" />
    </a>
  )}
  <div class="card-body">
    <time class="post-date" datetime={date.toISOString()}>{dateStr}</time>
    <h2><a href={href}>{title}</a></h2>
    <p class="post-desc">{description}</p>
    {tags.length > 0 && (
      <div class="tags">
        {tags.map(tag => <span class="tag">{tag}</span>)}
      </div>
    )}
  </div>
</article>

<style>
  .post-card {
    border: 1px solid var(--color-border);
    border-radius: 10px;
    overflow: hidden;
    background: var(--color-bg);
    transition: box-shadow 0.2s, transform 0.2s;
  }
  .post-card:hover {
    box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    transform: translateY(-2px);
  }
  .card-image-link { display: block; }
  img {
    width: 100%;
    height: 200px;
    object-fit: cover;
    transition: opacity 0.2s;
  }
  .card-image-link:hover img { opacity: 0.9; }
  .card-body { padding: 1.25rem; }
  .post-date { font-size: 0.8rem; color: var(--color-text-muted); }
  h2 { margin: 0.4rem 0 0.6rem; font-size: 1.15rem; line-height: 1.4; }
  h2 a { color: var(--color-text); }
  h2 a:hover { color: var(--color-accent); text-decoration: none; }
  .post-desc { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 0.75rem; }
  .tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .tag {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
  }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/components/PostCard.astro
git commit -m "feat: add PostCard component"
```

---

## Task 8：首页（根路径重定向 + 文章列表）

**Files:**
- Create: `src/pages/index.astro`
- Create: `src/pages/[lang]/index.astro`

- [ ] **Step 1: 创建根路径重定向**

```astro
---
// src/pages/index.astro
return Astro.redirect('/zh/', 301);
---
```

- [ ] **Step 2: 创建 [lang] 首页**

```astro
---
// src/pages/[lang]/index.astro
import { getCollection } from 'astro:content';
import BaseLayout from '../../layouts/BaseLayout.astro';
import Header from '../../components/Header.astro';
import Footer from '../../components/Footer.astro';
import PostCard from '../../components/PostCard.astro';
import { SUPPORTED_LANGS, type Lang } from '../../i18n/index';

export function getStaticPaths() {
  return SUPPORTED_LANGS.map(lang => ({ params: { lang } }));
}

const { lang } = Astro.params as { lang: Lang };

const posts = await getCollection('blog', ({ slug, data }) =>
  slug.startsWith(`${lang}/`) && !data.draft
);
const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

const title = lang === 'zh' ? '首页' : 'Home';
const description = lang === 'zh' ? '我的图文博客' : 'My Photo Blog';
---
<BaseLayout {title} {description} {lang}>
  <Header {lang} />
  <main class="container">
    {sorted.length === 0
      ? <p class="empty">暂无文章</p>
      : <div class="grid">{sorted.map(post => <PostCard {post} {lang} />)}</div>
    }
  </main>
  <Footer {lang} />
</BaseLayout>

<style>
  .container { max-width: var(--max-width); margin: 0 auto; padding: 2rem 1rem; }
  .grid { display: grid; gap: 1.5rem; }
  .empty { color: var(--color-text-muted); text-align: center; padding: 4rem 0; }

  @media (min-width: 600px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
</style>
```

- [ ] **Step 3: 本地验证首页可以正常展示文章卡片**

```bash
npm run dev
```

访问 `http://localhost:4321/zh/`，应看到 "你好，世界" 的文章卡片。访问 `http://localhost:4321/en/` 看到英文版。访问 `http://localhost:4321/` 应自动跳转到 `/zh/`。

- [ ] **Step 4: Commit**

```bash
git add src/pages/index.astro src/pages/[lang]/index.astro
git commit -m "feat: add homepage with post list and root redirect"
```

---

## Task 9：PostLayout

**Files:**
- Create: `src/layouts/PostLayout.astro`

- [ ] **Step 1: 创建 PostLayout**

```astro
---
// src/layouts/PostLayout.astro
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import { t, type Lang } from '../i18n/translations';
import type { CollectionEntry } from 'astro:content';

interface Props {
  post: CollectionEntry<'blog'>;
  lang: Lang;
  prevPost?: CollectionEntry<'blog'> | null;
  nextPost?: CollectionEntry<'blog'> | null;
}

const { post, lang, prevPost, nextPost } = Astro.props;
const { title, description, date, cover, tags, location } = post.data;

const dateStr = date.toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US', {
  year: 'numeric', month: 'long', day: 'numeric',
});

const prevSlug = prevPost ? prevPost.slug.split('/').slice(1).join('/') : null;
const nextSlug = nextPost ? nextPost.slug.split('/').slice(1).join('/') : null;
---
<BaseLayout {title} {description} image={cover} {lang}>
  <Header {lang} />
  <main class="container">
    <article>
      <header class="post-header">
        <time class="post-date" datetime={date.toISOString()}>{dateStr}</time>
        <h1>{title}</h1>
        <p class="post-desc">{description}</p>
        {tags.length > 0 && (
          <div class="tags">
            {tags.map(tag => <span class="tag">{tag}</span>)}
          </div>
        )}
      </header>

      {cover && <img src={cover} alt={title} class="cover" />}

      <div class="prose" data-pagefind-body>
        <slot />
      </div>

      {location && (
        <section class="post-location">
          <h2 class="location-title">📍 {t(lang, 'post.location')}：{location.name}</h2>
          <div
            class="location-map"
            data-lat={String(location.lat)}
            data-lng={String(location.lng)}
            data-name={location.name}
            aria-label={`${t(lang, 'post.location')}: ${location.name}`}
          ></div>
          <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
          <script>
            document.addEventListener('DOMContentLoaded', async () => {
              const el = document.querySelector('.location-map') as HTMLElement | null;
              if (!el) return;
              const L = (await import('leaflet')).default;
              const lat = parseFloat(el.dataset.lat!);
              const lng = parseFloat(el.dataset.lng!);
              const name = el.dataset.name!;
              const icon = L.icon({
                iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
                iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
                shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41],
              });
              const map = L.map(el).setView([lat, lng], 12);
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
              }).addTo(map);
              L.marker([lat, lng], { icon }).addTo(map).bindPopup(name).openPopup();
            });
          </script>
        </section>
      )}
    </article>

    <nav class="post-nav">
      {prevSlug && prevPost && (
        <a href={`/${lang}/blog/${prevSlug}`} class="nav-prev">
          ← {t(lang, 'post.prev')}：{prevPost.data.title}
        </a>
      )}
      {nextSlug && nextPost && (
        <a href={`/${lang}/blog/${nextSlug}`} class="nav-next">
          {t(lang, 'post.next')}：{nextPost.data.title} →
        </a>
      )}
    </nav>
  </main>
  <Footer {lang} />
</BaseLayout>

<style>
  .container { max-width: var(--max-width); margin: 0 auto; padding: 2rem 1rem; }
  .post-header { margin-bottom: 1.5rem; }
  .post-date { font-size: 0.85rem; color: var(--color-text-muted); }
  h1 { font-size: 2rem; margin: 0.5rem 0 0.75rem; }
  .post-desc { color: var(--color-text-muted); margin: 0 0 1rem; }
  .tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .tag {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: 4px;
    padding: 2px 8px;
    font-size: 0.8rem;
    color: var(--color-text-muted);
  }
  .cover { width: 100%; border-radius: 10px; margin: 1.5rem 0; max-height: 500px; object-fit: cover; }
  .prose { line-height: 1.8; }
  .prose h2 { font-size: 1.4rem; margin: 2rem 0 0.75rem; }
  .prose h3 { font-size: 1.15rem; margin: 1.5rem 0 0.5rem; }
  .prose p { margin: 0 0 1rem; }
  .prose img { border-radius: 8px; margin: 1.25rem 0; }
  .prose blockquote {
    border-left: 3px solid var(--color-accent);
    padding-left: 1rem;
    color: var(--color-text-muted);
    margin: 1rem 0;
  }
  .post-location { margin-top: 2.5rem; padding-top: 2rem; border-top: 1px solid var(--color-border); }
  .location-title { font-size: 1rem; margin-bottom: 0.75rem; color: var(--color-text-muted); font-weight: 600; }
  .location-map { height: 280px; border-radius: 10px; border: 1px solid var(--color-border); overflow: hidden; }
  .post-nav {
    display: flex;
    justify-content: space-between;
    margin-top: 3rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
    gap: 1rem;
  }
  .nav-prev, .nav-next { color: var(--color-text-muted); font-size: 0.9rem; max-width: 48%; line-height: 1.4; }
  .nav-next { text-align: right; margin-left: auto; }
  .nav-prev:hover, .nav-next:hover { color: var(--color-accent); text-decoration: none; }
</style>
```

- [ ] **Step 2: Commit**

```bash
git add src/layouts/PostLayout.astro
git commit -m "feat: add PostLayout with location map support"
```

---

## Task 10：文章详情页

**Files:**
- Create: `src/pages/[lang]/blog/[slug].astro`

- [ ] **Step 1: 创建文章详情路由**

```astro
---
// src/pages/[lang]/blog/[slug].astro
import { getCollection } from 'astro:content';
import PostLayout from '../../../layouts/PostLayout.astro';
import type { Lang } from '../../../i18n/index';

export async function getStaticPaths() {
  const all = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = all.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return sorted.map(post => {
    const [lang, ...rest] = post.slug.split('/');
    const slug = rest.join('/');
    const langPosts = sorted.filter(p => p.slug.startsWith(`${lang}/`));
    const idx = langPosts.indexOf(post);

    return {
      params: { lang, slug },
      props: {
        post,
        prevPost: langPosts[idx + 1] ?? null,
        nextPost: langPosts[idx - 1] ?? null,
      },
    };
  });
}

const { post, prevPost, nextPost } = Astro.props;
const { lang } = Astro.params as { lang: Lang };
const { Content } = await post.render();
---
<PostLayout {post} {lang} {prevPost} {nextPost}>
  <Content />
</PostLayout>
```

- [ ] **Step 2: 本地验证文章页渲染正确**

```bash
npm run dev
```

访问 `http://localhost:4321/zh/blog/hello-world`，应看到：
- 封面图
- 文章正文
- 地图（显示北京标记点，弹出框显示"北京，中国"）
- 标签

- [ ] **Step 3: Commit**

```bash
git add "src/pages/[lang]/blog/[slug].astro"
git commit -m "feat: add article detail page with location map"
```

---

## Task 11：RSS Feed

**Files:**
- Create: `src/pages/[lang]/rss.xml.ts`

- [ ] **Step 1: 创建 RSS 端点**

```typescript
// src/pages/[lang]/rss.xml.ts
import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SUPPORTED_LANGS, type Lang } from '../../i18n/index';

export function getStaticPaths() {
  return SUPPORTED_LANGS.map(lang => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Lang;

  const posts = await getCollection('blog', ({ slug, data }) =>
    slug.startsWith(`${lang}/`) && !data.draft
  );

  const sorted = posts.sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: lang === 'zh' ? '我的博客' : 'My Blog',
    description: lang === 'zh' ? '图文博客，记录生活与旅行' : 'Photo blog documenting life and travel',
    site: site!.toString(),
    items: sorted.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${lang}/blog/${post.slug.split('/').slice(1).join('/')}`,
      ...(post.data.cover ? { enclosure: { url: post.data.cover, length: 0, type: 'image/jpeg' } } : {}),
    })),
    customData: `<language>${lang === 'zh' ? 'zh-CN' : 'en-US'}</language>`,
  });
};
```

- [ ] **Step 2: 验证 RSS 生成**

```bash
npm run build
```

检查 `dist/zh/rss.xml` 和 `dist/en/rss.xml` 是否存在且内容正确。

- [ ] **Step 3: Commit**

```bash
git add "src/pages/[lang]/rss.xml.ts"
git commit -m "feat: add RSS feeds for zh and en"
```

---

## Task 12：Pagefind 搜索页

**Files:**
- Create: `src/pages/search.astro`

- [ ] **Step 1: 创建搜索页**

```astro
---
// src/pages/search.astro
import BaseLayout from '../layouts/BaseLayout.astro';
---
<BaseLayout title="搜索 / Search" description="搜索博客文章">
  <Fragment slot="head">
    <link rel="stylesheet" href="/pagefind/pagefind-ui.css" />
  </Fragment>
  <main class="container">
    <h1>搜索 / Search</h1>
    <div id="search"></div>
  </main>
</BaseLayout>

<script is:inline src="/pagefind/pagefind-ui.js"></script>
<script is:inline>
  window.addEventListener('DOMContentLoaded', function() {
    new PagefindUI({ element: '#search', showImages: true, showEmptyFilters: false });
  });
</script>

<style>
  .container { max-width: var(--max-width); margin: 0 auto; padding: 2rem 1rem; }
  h1 { margin-bottom: 1.5rem; }
</style>
```

- [ ] **Step 2: 完整构建验证（含 Pagefind 索引生成）**

```bash
npm run build
```

预期：
- `dist/pagefind/` 目录存在
- `dist/pagefind/pagefind-ui.js` 文件存在
- 无构建错误

- [ ] **Step 3: 本地预览验证搜索**

```bash
npm run preview
```

访问 `http://localhost:4321/search`，在搜索框输入"你好"，应出现中文文章结果。

- [ ] **Step 4: Commit**

```bash
git add src/pages/search.astro
git commit -m "feat: add Pagefind search page"
```

---

## Task 13：wrangler.toml + 构建配置

**Files:**
- Create: `wrangler.toml`
- Create: `.gitignore`（更新）

- [ ] **Step 1: 询问用户项目名称（在终端执行）**

```bash
# 检查是否已登录 wrangler
npx wrangler whoami
```

如果未登录，执行：
```bash
npx wrangler login
```

- [ ] **Step 2: 创建 wrangler.toml**

```toml
# wrangler.toml
name = "my-blog"
compatibility_date = "2024-01-01"

[vars]
SITE_NAME = "My Blog"

[[r2_buckets]]
binding = "IMAGES"
bucket_name = "blog-images"
```

> 注意：`name` 字段是 Cloudflare Pages/Workers 项目名，可自定义。

- [ ] **Step 3: 更新 .gitignore**

```bash
cat > .gitignore << 'EOF'
node_modules/
dist/
.astro/
.wrangler/
*.local
.env
.env.*
EOF
```

- [ ] **Step 4: Commit**

```bash
git add wrangler.toml .gitignore
git commit -m "chore: add wrangler config and gitignore"
```

---

## Task 14：Cloudflare Pages 部署

> 此任务需要与用户交互，涉及 Cloudflare 账号信息。

- [ ] **Step 1: 询问域名并更新配置**

向用户询问：**你在 Cloudflare 上的域名是什么？**

获取域名后，更新 `astro.config.mjs`：
```javascript
// 将 'https://yourdomain.com' 替换为实际域名，例如：
site: 'https://blog.yourdomain.com',
```

- [ ] **Step 2: 在 Cloudflare Dashboard 创建 Pages 项目**

执行以下命令将构建产物直接部署（首次部署）：

```bash
npm run build
npx wrangler pages deploy dist --project-name my-blog
```

> 首次运行会提示在 Cloudflare Dashboard 创建项目，按提示操作。

- [ ] **Step 3: 创建 R2 Bucket**

```bash
npx wrangler r2 bucket create blog-images
```

预期输出：`Created bucket 'blog-images'`

- [ ] **Step 4: 在 Cloudflare Dashboard 绑定自定义域名**

1. 打开 Cloudflare Dashboard → Pages → `my-blog` → 自定义域名
2. 添加你的域名（如 `blog.yourdomain.com`）
3. DNS 记录会自动配置（因为域名已在 CF 管理）

- [ ] **Step 5: 绑定 R2 图片自定义域名**

1. 打开 Cloudflare Dashboard → R2 → `blog-images` → Settings → Custom Domains
2. 添加 `images.yourdomain.com`
3. DNS 记录自动配置

- [ ] **Step 6: 最终构建验证**

更新 `astro.config.mjs` 中的 `site` 为实际域名后：

```bash
npm run build
```

检查 `dist/sitemap-index.xml` 中的 URL 是否包含正确的域名。

- [ ] **Step 7: Commit 最终配置**

```bash
git add astro.config.mjs
git commit -m "chore: update site URL for production deployment"
```

---

## Task 15：GitHub 自动部署（可选）

- [ ] **Step 1: 在 Cloudflare Dashboard 连接 GitHub 仓库**

1. Cloudflare Dashboard → Pages → `my-blog` → Settings → Build & Deploy
2. 连接 GitHub 仓库
3. 构建配置：
   - Build command: `npm run build`
   - Build output directory: `dist`
   - Node.js version: `20`

- [ ] **Step 2: 推送代码触发自动部署**

```bash
git push origin master
```

在 Cloudflare Dashboard 的 Pages → `my-blog` → Deployments 中观察构建状态。

---

## 验收标准

| 功能 | 验证方式 |
|------|---------|
| 首页文章列表 | 访问 `/zh/` 和 `/en/` 均显示文章 |
| 文章详情页 | 访问 `/zh/blog/hello-world` 显示正文 + 地图 |
| 拍摄地地图 | 地图加载，标记北京坐标，弹出框显示地名 |
| 暗色模式 | 切换后刷新页面保持主题 |
| 语言切换 | 中英互切，URL 正确变化 |
| RSS | 访问 `/zh/rss.xml` 返回合法 XML |
| 搜索 | `/search` 页面能搜索到文章 |
| SEO | `<title>`、`<meta description>`、OG 标签均正确 |
| sitemap | `/sitemap-index.xml` 存在且包含文章 URL |
