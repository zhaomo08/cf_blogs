# i18n 移除 + admin 移动端 + 前端性能优化 实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 彻底移除 i18n、让 admin 在小屏默认 Markdown 模式、并完成 6 项前端展示与性能优化，全部兼容现有 Cloudflare Pages 部署。

**Architecture:**
- 模块 A（i18n 移除）：删 `src/i18n/`、清空所有 `lang` prop / `t()` 调用，将 `src/content/blog/zh/*.md` 提到 `src/content/blog/`，加 `_redirects` 兜底。
- 模块 B（admin 移动端）：仅改 `public/admin/index.html`，小屏 + 首次进入时模拟点击 Decap 模式切换按钮切到 raw。
- 模块 C（前端 6 项）：preconnect / preload、Leaflet 自托管 + 延迟加载、PostCard/PostLayout 视觉、首页 tag 筛选、JSON-LD/manifest、`_headers` 缓存。

**Tech Stack:** Astro 6（Content Collections / Static SSG）、Cloudflare Pages、Decap CMS（外部脚本注入）、Leaflet 1.9.4、Pagefind 1.5。无 SSR、无测试框架。

**验证策略：** 项目无单元测试。每个 task 用 `npm run check`（Astro 类型检查）+ `npm run build`（构建）+ 手动浏览/DevTools 验证 替代单测。

**前置：** 当前在 `master` 分支，工作树干净（commit `c2b1674` 是 spec 文档）。每个 task 完成后立即 commit。

---

## 任务清单

| # | 任务 | 模块 |
|---|---|---|
| 1 | 删除 i18n 模块文件 + 改 BaseLayout | A |
| 2 | 清理 Header / Footer 的 i18n 调用 | A |
| 3 | 清理 PostLayout / PostCard 的 i18n 调用 | A |
| 4 | 清理 index / search / blog/[...slug] 页面的 i18n | A |
| 5 | 内容目录提升 + admin config + _redirects | A |
| 6 | A 模块整体验证 | A |
| 7 | admin 小屏强制 Markdown | B |
| 8 | C1 首屏 LCP（preconnect + priority 图） | C |
| 9 | C2-1 Leaflet 自托管资源 | C |
| 10 | C2-2 Leaflet 延迟加载脚本 | C |
| 11 | C3 列表/详情视觉升级 | C |
| 12 | C4 列表页 tag 筛选 + 空状态 | C |
| 13 | C5 JSON-LD + a11y + manifest | C |
| 14 | C6 _headers 缓存 + 基线测量 | C |

---

## Task 1: 删除 i18n 模块文件 + 改 BaseLayout

**Files:**
- Delete: `src/i18n/index.ts`
- Delete: `src/i18n/translations.ts`
- Delete: `src/components/LanguageSwitcher.astro`
- Modify: `src/layouts/BaseLayout.astro`

- [ ] **Step 1: 删除 i18n 三个文件**

```bash
rm src/i18n/index.ts src/i18n/translations.ts src/components/LanguageSwitcher.astro
rmdir src/i18n
```

- [ ] **Step 2: 重写 `src/layouts/BaseLayout.astro`**

完整新内容：

```astro
---
import '../styles/global.css';

interface Props {
  title: string;
  description: string;
  image?: string;
  schema?: Record<string, unknown>;
}

const { title, description, image, schema } = Astro.props;

const canonicalURL = Astro.url.href;
const siteName = 'My Blog';
---
<!DOCTYPE html>
<html lang="zh">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <link rel="preconnect" href="https://cf-blogs-r2.zhaomo0823.workers.dev" crossorigin />
    <link rel="dns-prefetch" href="https://cf-blogs-r2.zhaomo0823.workers.dev" />
    <link rel="manifest" href="/manifest.webmanifest" />
    <meta name="theme-color" content="#0066cc" media="(prefers-color-scheme: light)" />
    <meta name="theme-color" content="#5ba3ff" media="(prefers-color-scheme: dark)" />
    <title>{title} | {siteName}</title>
    <meta name="description" content={description} />
    <link rel="canonical" href={canonicalURL} />
    <meta property="og:title" content={title} />
    <meta property="og:description" content={description} />
    <meta property="og:url" content={canonicalURL} />
    <meta property="og:site_name" content={siteName} />
    <meta property="og:type" content="website" />
    <meta property="og:locale" content="zh_CN" />
    {image && <meta property="og:image" content={image} />}
    <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
    <meta name="twitter:title" content={title} />
    <meta name="twitter:description" content={description} />
    {image && <meta name="twitter:image" content={image} />}
    {schema && <script type="application/ld+json" set:html={JSON.stringify(schema)} />}
    <slot name="head" />
    <script is:inline>
      const saved = localStorage.getItem('theme');
      const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      document.documentElement.dataset.theme = saved ?? preferred;
    </script>
  </head>
  <body>
    <slot />
    <slot name="scripts" />
  </body>
</html>
```

注意：本步骤同时**预先**埋了 C1 的 preconnect、C5 的 manifest/theme-color/JSON-LD/og:locale 接口。后续 C 任务无需再回头改 BaseLayout。manifest 文件本身将在 Task 13 创建——在那之前 `<link rel="manifest">` 会指向不存在的资源，仅产生一次 404，不阻塞渲染。Task 13 之前如果跑 `preview` 想避免 404，可以先注释这两行；本 plan 不强制。

- [ ] **Step 3: 类型检查**

```bash
npm run check
```

预期：可能仍因为 Header/Footer/PostLayout/PostCard/pages 还在 import i18n 而报错——这是预期的，下面任务会修复。**本步不强求 0 错误**，只用作 baseline。

- [ ] **Step 4: 提交（暂不构建）**

```bash
git add -A
git commit -m "refactor(i18n): 删除 i18n 模块文件并改 BaseLayout 为单语言"
```

---

## Task 2: 清理 Header / Footer 的 i18n 调用

**Files:**
- Modify: `src/components/Header.astro`
- Modify: `src/components/Footer.astro`

- [ ] **Step 1: 重写 `src/components/Header.astro`**

完整新内容：

```astro
---
import ThemeToggle from './ThemeToggle.astro';
---
<header role="banner">
  <nav class="nav-inner" aria-label="主导航">
    <a href="/" class="logo">📷 Blog</a>
    <div class="nav-links">
      <a href="/">首页</a>
      <a href="/search">搜索</a>
      <a href="/rss.xml" title="RSS">订阅</a>
    </div>
    <div class="nav-actions">
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
  @media (max-width: 720px) {
    header { padding: 0.7rem 0.85rem; }
    .nav-inner { gap: 0.65rem; flex-wrap: wrap; }
    .logo { font-size: 1rem; }
    .nav-links {
      order: 3;
      width: 100%;
      gap: 0.85rem;
      overflow-x: auto;
      white-space: nowrap;
      padding-bottom: 0.1rem;
    }
    .nav-links a { font-size: 0.9rem; }
  }
</style>
```

注意：`role="banner"` + `aria-label` 也是 C5 的 a11y 部分，在此一次到位。

- [ ] **Step 2: 重写 `src/components/Footer.astro`**

完整新内容：

```astro
---
const year = new Date().getFullYear();
---
<footer>
  <div class="footer-inner">
    <p>© {year} 版权所有</p>
    <div class="footer-links">
      <a href="/rss.xml">RSS</a>
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
  @media (max-width: 720px) {
    footer { margin-top: 2.2rem; padding: 1.1rem 0.9rem; }
    .footer-inner { flex-direction: column; align-items: flex-start; gap: 0.55rem; }
    .footer-links { gap: 0.85rem; flex-wrap: wrap; }
  }
</style>
```

- [ ] **Step 3: 提交**

```bash
git add src/components/Header.astro src/components/Footer.astro
git commit -m "refactor(i18n): Header / Footer 移除 i18n 调用并加 a11y 标记"
```

---

## Task 3: 清理 PostLayout / PostCard 的 i18n 调用

**Files:**
- Modify: `src/layouts/PostLayout.astro`
- Modify: `src/components/PostCard.astro`

- [ ] **Step 1: 重写 `src/layouts/PostLayout.astro`**

完整新内容（移除 i18n、保留 leaflet 现状，C2 任务会再改 leaflet）：

```astro
---
import BaseLayout from './BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import type { CollectionEntry } from 'astro:content';
import { buildOptimizedImageUrl, buildOptimizedSrcSet } from '../utils/image';

interface Props {
  post: CollectionEntry<'blog'>;
  prevPost?: CollectionEntry<'blog'> | null;
  nextPost?: CollectionEntry<'blog'> | null;
}

const { post, prevPost, nextPost } = Astro.props;
const { title, description, date, cover, tags, location } = post.data;
const coverSrc = cover ? buildOptimizedImageUrl(cover, { width: 1280, fit: 'max' }) : '';
const coverSrcSet = cover ? buildOptimizedSrcSet(cover, [640, 960, 1280, 1600], 78) : '';

const dateStr = date
  ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  : '';

const prevHref = prevPost
  ? `/blog/${prevPost.id.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`
  : null;
const nextHref = nextPost
  ? `/blog/${nextPost.id.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`
  : null;

const schema = {
  '@context': 'https://schema.org',
  '@type': 'BlogPosting',
  headline: title,
  description: description ?? '',
  datePublished: date ? date.toISOString() : undefined,
  image: cover || undefined,
  author: { '@type': 'Person', name: 'Blog Author' },
  mainEntityOfPage: Astro.url.href,
};
---
<BaseLayout {title} description={description ?? ''} image={cover} {schema}>
  {location && <link slot="head" rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />}
  <Header />
  <main class="container">
    <article>
      <header class="post-header">
        {date && <time class="post-date" datetime={date.toISOString()}>{dateStr}</time>}
        <h1>{title}</h1>
        {description && <p class="post-desc">{description}</p>}
        {tags.length > 0 && (
          <div class="tags">
            {tags.map(tag => <span class="tag">{tag}</span>)}
          </div>
        )}
      </header>

      {cover && (
        <img
          src={coverSrc || cover}
          srcset={coverSrcSet || undefined}
          sizes="(max-width: 800px) 100vw, 760px"
          alt={title}
          class="cover"
          loading="eager"
          fetchpriority="high"
          decoding="async"
        />
      )}

      <div class="prose" data-pagefind-body>
        <slot />
      </div>

      {location && (
        <section class="post-location">
          <h2 class="location-title">{location.name}</h2>
          <div
            class="location-map"
            data-lat={String(location.lat)}
            data-lng={String(location.lng)}
            data-name={location.name}
            role="img"
            aria-label={`拍摄地: ${location.name}`}
          ></div>
        </section>
      )}
    </article>

    <nav class="post-nav" aria-label="文章导航">
      {prevHref && prevPost && (
        <a href={prevHref} class="nav-prev">
          ← 上一篇：{prevPost.data.title}
        </a>
      )}
      {nextHref && nextPost && (
        <a href={nextHref} class="nav-next">
          下一篇：{nextPost.data.title} →
        </a>
      )}
    </nav>
  </main>
  <Footer />
</BaseLayout>

<script is:inline>
  window.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.prose img').forEach((img) => {
      if (!(img instanceof HTMLImageElement)) return;
      if (!img.hasAttribute('loading')) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
    });
  });
</script>

{location && (
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" is:inline></script>
  <script is:inline define:vars={{ mapLat: location.lat, mapLng: location.lng, mapName: location.name }}>
    window.addEventListener('load', function() {
      var el = document.querySelector('.location-map');
      if (!el) return;
      var icon = L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
        iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
      });
      var map = L.map(el).setView([mapLat, mapLng], 12);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);
      L.marker([mapLat, mapLng], { icon: icon }).addTo(map).bindPopup(mapName).openPopup();
    });
  </script>
)}

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
  .cover {
    width: 100%;
    border-radius: 10px;
    margin: 1.5rem 0;
    max-height: 500px;
    aspect-ratio: 16 / 9;
    object-fit: cover;
  }
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
  @media (max-width: 720px) {
    .container { padding: 1.2rem 0.9rem; }
    h1 { font-size: 1.65rem; }
    .post-nav {
      flex-direction: column;
      align-items: stretch;
      gap: 0.75rem;
    }
    .nav-prev, .nav-next {
      max-width: 100%;
      text-align: left;
      margin-left: 0;
      padding: 0.65rem 0.8rem;
      border: 1px solid var(--color-border);
      border-radius: 10px;
      background: var(--color-bg-secondary);
    }
    .location-map { height: 220px; }
  }
</style>
```

变化要点：移除 `lang` prop / `t()` / `Lang` import；文案直接中文；日期固定 `zh-CN`；新增 `schema` 传给 BaseLayout 用于 BlogPosting JSON-LD（C5）；location 区域加 `role="img"` 与中文 aria-label。Leaflet 仍用 unpkg + SSR 直接渲染（保持本任务零行为变化），Task 10 才改为本地 + 延迟加载。

- [ ] **Step 2: 重写 `src/components/PostCard.astro`**

完整新内容（保留视觉现状，C3 任务再升级；这里只清理 i18n + 新增 priority prop 用于 C1）：

```astro
---
import type { CollectionEntry } from 'astro:content';
import { buildOptimizedImageUrl, buildOptimizedSrcSet } from '../utils/image';

interface Props {
  post: CollectionEntry<'blog'>;
  priority?: boolean;
}
const { post, priority = false } = Astro.props;
const { title, description, date, cover, tags } = post.data;

const href = `/blog/${post.id.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`;
const coverSrc = cover ? buildOptimizedImageUrl(cover, { width: 720, fit: 'crop' }) : '';
const coverSrcSet = cover ? buildOptimizedSrcSet(cover, [360, 540, 720, 960], 75) : '';
const dateStr = date
  ? date.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
  : '';
const tagsAttr = tags.join(',');
---
<article class="post-card" data-tags={tagsAttr}>
  {cover && (
    <a href={href} class="card-image-link">
      <img
        src={coverSrc || cover}
        srcset={coverSrcSet || undefined}
        sizes="(max-width: 600px) 100vw, (max-width: 1024px) 50vw, 360px"
        alt={title}
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        decoding="async"
      />
    </a>
  )}
  <div class="card-body">
    {date && <time class="post-date" datetime={date.toISOString()}>{dateStr}</time>}
    <h2><a href={href}>{title}</a></h2>
    {description && <p class="post-desc">{description}</p>}
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
    aspect-ratio: 16 / 10;
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

变化要点：移除 `lang` prop / `guessedLang` / `post.id.startsWith('en/')`；新增 `priority` prop（C1 用）；新增 `data-tags` 属性供 C4 客户端筛选；description 不存在时不渲染空 `<p>`。

- [ ] **Step 3: 提交**

```bash
git add src/layouts/PostLayout.astro src/components/PostCard.astro
git commit -m "refactor(i18n): PostLayout / PostCard 移除 i18n 并预留 priority/tags 钩子"
```

---

## Task 4: 清理 index / search / blog/[...slug] 页面的 i18n

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/pages/blog/[...slug].astro`
- Modify: `src/pages/search.astro`

- [ ] **Step 1: 重写 `src/pages/index.astro`**

完整新内容（清理 i18n + 给前 2 张卡片传 priority；C4 的 tag 筛选稍后任务再加）：

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import PostCard from '../components/PostCard.astro';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const sorted = [...posts].sort((a, b) => {
  const aTs = a.data.date ? a.data.date.valueOf() : 0;
  const bTs = b.data.date ? b.data.date.valueOf() : 0;
  return bTs - aTs;
});

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: '我的博客',
  description: '我的图文博客',
  url: Astro.url.href,
};
---
<BaseLayout title="首页" description="我的图文博客" {schema}>
  <Header />
  <main class="container">
    {sorted.length === 0
      ? <p class="empty">暂无文章</p>
      : <div class="grid">{sorted.map((post, idx) => <PostCard post={post} priority={idx < 2} />)}</div>
    }
  </main>
  <Footer />
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

- [ ] **Step 2: 重写 `src/pages/blog/[...slug].astro`**

```astro
---
import { getCollection, render, type CollectionEntry } from 'astro:content';
import PostLayout from '../../layouts/PostLayout.astro';

export async function getStaticPaths() {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = [...posts].sort((a, b) => {
    const aTs = a.data.date ? a.data.date.valueOf() : 0;
    const bTs = b.data.date ? b.data.date.valueOf() : 0;
    return bTs - aTs;
  });

  return sorted.map((post, index) => ({
    params: { slug: post.id },
    props: {
      post,
      prevPost: sorted[index + 1] ?? null,
      nextPost: sorted[index - 1] ?? null,
    },
  }));
}

interface Props {
  post: CollectionEntry<'blog'>;
  prevPost?: CollectionEntry<'blog'> | null;
  nextPost?: CollectionEntry<'blog'> | null;
}

const { post, prevPost, nextPost } = Astro.props as Props;
const { Content } = await render(post);
---
<PostLayout {post} {prevPost} {nextPost}>
  <Content />
</PostLayout>
```

- [ ] **Step 3: 修改 `src/pages/search.astro`**

仅改三处：
- 第 22 行 `const locale = post.id.startsWith('en/') ? 'en-US' : 'zh-CN';` → `const locale = 'zh-CN';`
- 第 64 行 `<BaseLayout title="搜索 / Search" description="搜索博客文章">` → `<BaseLayout title="搜索" description="搜索博客文章">`
- 第 69 行 `<h1>搜索 / Search</h1>` → `<h1>搜索</h1>`
- 第 73 行 `<h2>标签 / Tags</h2>` → `<h2>标签</h2>`
- 第 79 行 `<p class="empty">暂无标签 / No tags</p>` → `<p class="empty">暂无标签</p>`
- 第 101 行 `<p class="empty">该标签下暂无文章 / No posts under this tag</p>` → `<p class="empty">该标签下暂无文章</p>`

具体 Edit 调用：

```text
old: const locale = post.id.startsWith('en/') ? 'en-US' : 'zh-CN';
new: const locale = 'zh-CN';
```

```text
old: <BaseLayout title="搜索 / Search" description="搜索博客文章">
new: <BaseLayout title="搜索" description="搜索博客文章">
```

```text
old:     <h1>搜索 / Search</h1>
new:     <h1>搜索</h1>
```

```text
old:         <h2>标签 / Tags</h2>
new:         <h2>标签</h2>
```

```text
old:           <p class="empty">暂无标签 / No tags</p>
new:           <p class="empty">暂无标签</p>
```

```text
old:             <p class="empty">该标签下暂无文章 / No posts under this tag</p>
new:             <p class="empty">该标签下暂无文章</p>
```

- [ ] **Step 4: 类型检查**

```bash
npm run check
```

预期：0 错误。所有 i18n 引用已清干净。如果还有残留引用（例如 utils/image.ts 中），定位并删除。

- [ ] **Step 5: 提交**

```bash
git add src/pages/index.astro src/pages/blog/'[...slug].astro' src/pages/search.astro
git commit -m "refactor(i18n): 页面层移除 i18n 并中文化文案"
```

---

## Task 5: 内容目录提升 + admin config + _redirects

**Files:**
- Move: `src/content/blog/zh/*.md` → `src/content/blog/`
- Modify: `public/admin/config.yml`
- Modify: `public/admin/config-netlify.yml`（如存在 zh 路径）
- Create: `public/_redirects`

- [ ] **Step 1: git mv 5 篇文章到 blog 根**

```bash
git mv src/content/blog/zh/2026-05-01-191228.md src/content/blog/2026-05-01-191228.md
git mv src/content/blog/zh/2026-05-01-205831.md src/content/blog/2026-05-01-205831.md
git mv src/content/blog/zh/2026-05-01-211136.md src/content/blog/2026-05-01-211136.md
git mv src/content/blog/zh/2026-05-05-230605.md src/content/blog/2026-05-05-230605.md
git mv src/content/blog/zh/my-first-post.md src/content/blog/my-first-post.md
rmdir src/content/blog/zh
```

- [ ] **Step 2: 修改 `public/admin/config.yml`**

具体 Edit：

```text
old:     folder: "src/content/blog/zh"
new:     folder: "src/content/blog"
```

```text
old:     preview_path: "blog/zh/{{slug}}"
new:     preview_path: "blog/{{slug}}"
```

- [ ] **Step 3: 检查 `public/admin/config-netlify.yml`**

```bash
grep -n 'blog/zh' public/admin/config-netlify.yml || echo "无残留"
```

如有匹配，按 Step 2 同样规则替换。

- [ ] **Step 4: 创建 `public/_redirects`**

```text
# 旧 i18n URL 兼容（彻底移除 zh 子目录后）
/blog/zh/* /blog/:splat 301
```

- [ ] **Step 5: 检查 scripts/new-post.js 与 validate-content.js**

```bash
grep -n 'blog/zh\|content/blog/zh' scripts/new-post.js scripts/validate-content.js
```

如发现硬编码 `blog/zh`，改为 `blog`。无匹配则跳过。

- [ ] **Step 6: 提交**

```bash
git add -A
git commit -m "refactor(content): 文章从 blog/zh/ 提到 blog/，admin 同步并加 301 兜底"
```

---

## Task 6: A 模块整体验证

**Files:** 无文件改动。

- [ ] **Step 1: Astro 类型检查**

```bash
npm run check
```

预期：0 错误。

- [ ] **Step 2: 构建**

```bash
npm run build
```

预期：构建成功，输出 `dist/`。

- [ ] **Step 3: 检查产出目录结构**

```bash
ls dist/blog/
test ! -d dist/blog/zh && echo "OK: 无 dist/blog/zh 目录" || echo "FAIL: dist/blog/zh 仍存在"
ls dist/blog/2026-05-05-230605/index.html | head -1
```

预期：`dist/blog/` 直接含 5 个文章子目录，无 `zh/` 中间层。

- [ ] **Step 4: 启动 preview 并人工浏览**

```bash
npm run preview
```

打开 `http://localhost:4321/`：
- 首页 OK，列表展示
- 进入任意文章，URL 形如 `/blog/2026-05-05-230605/`
- 访问 `http://localhost:4321/blog/zh/2026-05-05-230605/`：因 `_redirects` 仅在 CF 生效，本地 preview 会 404，**这是预期**。CF Pages 上线后才生效。
- 搜索页 OK，无英文残留
- RSS `/rss.xml` 中 link 指向新路径

确认无问题后 `Ctrl+C` 停止。

- [ ] **Step 5: A 模块完成（无需额外 commit）**

---

## Task 7: admin 小屏强制 Markdown 模式

**Files:**
- Modify: `public/admin/index.html`

- [ ] **Step 1: 在现有 IIFE 内新增 `setupMobileEditorMode` 函数**

定位 `public/admin/index.html` 中 `setupMobileToolVisibility() {` 函数定义（约第 454 行）。**在该函数定义之后、`CMS.registerEventListener` 调用之前**插入以下函数：

```javascript
      function setupMobileEditorMode() {
        if (!window.matchMedia('(max-width: 720px)').matches) return;
        const FLAG_KEY = 'cf_blogs_mobile_md_applied_v1';
        try {
          if (localStorage.getItem(FLAG_KEY)) return;
        } catch (_) {}

        function findRichTextSwitchButton() {
          const buttons = Array.from(document.querySelectorAll('button, [role="button"]'));
          return buttons.find((btn) => {
            const text = (btn.textContent || '').trim().toLowerCase();
            return text === 'markdown' || text === '原文' || text === 'raw' || text === '源代码';
          });
        }

        function isOnEntryPage() {
          const hash = window.location.hash || '';
          return /#\/collections\/blog\/(new|entries\/)/.test(hash);
        }

        let attempts = 0;
        const maxAttempts = 30;
        const observer = new MutationObserver(() => {
          if (!isOnEntryPage()) return;
          attempts += 1;
          if (attempts > maxAttempts) {
            observer.disconnect();
            return;
          }
          const btn = findRichTextSwitchButton();
          if (!btn) return;
          btn.click();
          try { localStorage.setItem(FLAG_KEY, '1'); } catch (_) {}
          observer.disconnect();
        });

        observer.observe(document.body, { childList: true, subtree: true });
      }
```

- [ ] **Step 2: 在 IIFE 末尾调用 `setupMobileEditorMode`**

定位现有调用块（约第 517-520 行）：

```javascript
      setupAutoLocation();
      setupMobileToolVisibility();
      document.getElementById("btn-r2-upload").addEventListener("click", handleR2Upload);
      setInterval(simplifyChrome, 800);
```

改为：

```javascript
      setupAutoLocation();
      setupMobileToolVisibility();
      setupMobileEditorMode();
      document.getElementById("btn-r2-upload").addEventListener("click", handleR2Upload);
      setInterval(simplifyChrome, 800);
```

- [ ] **Step 3: 在现有 `<style>` 块内追加移动端富文本工具条防御性 CSS**

定位 `public/admin/index.html` 现有 `<style>` 块内（约第 31-37 行）的 `@media (max-width: 900px)` 块**之后**追加：

```css
    @media (max-width: 720px) {
      .Toolbar__Toolbar___,
      [class*="Toolbar"] {
        flex-wrap: wrap !important;
      }
      [class*="Toolbar"] button {
        min-height: 36px;
        min-width: 36px;
      }
    }
```

注意选择器使用属性前缀匹配以适配 Decap 的混淆类名；如未来 Decap 版本变更，函数式自动切到 raw 仍可保底。

- [ ] **Step 4: 构建（admin 文件直接被 Astro 拷贝到 dist）**

```bash
npm run build
```

预期：构建成功，`dist/admin/index.html` 存在并含新增函数。

```bash
grep -c 'setupMobileEditorMode' dist/admin/index.html
```

预期：输出 `2`（一次定义、一次调用）。

- [ ] **Step 5: 手动验证（部署后）**

本地 preview 访问 `/admin/` 通常无法登录（OAuth 限定线上域名）。改为：
1. 提交并 push
2. CF Pages 部署完后，在桌面浏览器（>720px）打开 `https://cf-blogs-4j9.pages.dev/admin/` 新建文章 → 应仍为 rich_text
3. DevTools 切到 iPhone 14 视口（390×844）刷新 → 进入新建/编辑文章页应自动切到 Markdown
4. 桌面端切回 rich_text 后刷新，不应再次被强制（因 localStorage flag）

如果 selector 没匹配上（Decap 版本变化），加 `console.log` 调试。

- [ ] **Step 6: 提交**

```bash
git add public/admin/index.html
git commit -m "feat(admin): 小屏首次进入文章页强制切到 Markdown 模式"
```

---

## Task 8: C1 首屏 LCP（preconnect 已埋，本任务仅验证 priority）

**Files:** 无新改动。preconnect 已在 Task 1 BaseLayout 中加，priority prop 已在 Task 3 PostCard 中加，前 2 张卡片传 priority 已在 Task 4 index.astro 中处理。

- [ ] **Step 1: 构建并验证**

```bash
npm run build
grep -A2 'preconnect' dist/index.html | head -10
```

预期：dist/index.html `<head>` 含 preconnect + dns-prefetch。

- [ ] **Step 2: 验证前 2 张图带 fetchpriority**

```bash
grep -c 'fetchpriority="high"' dist/index.html
```

预期：≥ 2（首页前 2 张卡片 + 可能详情页 cover 影响其他页面）。

- [ ] **Step 3: Task 1 已合并提交，本任务无独立 commit**

跳过 commit。

---

## Task 9: C2-1 Leaflet 自托管资源

**Files:**
- Create: `scripts/copy-leaflet.js`
- Create: `public/vendor/leaflet/leaflet.css`（拷贝产物）
- Create: `public/vendor/leaflet/leaflet.js`（拷贝产物）
- Create: `public/vendor/leaflet/images/marker-icon.png`
- Create: `public/vendor/leaflet/images/marker-icon-2x.png`
- Create: `public/vendor/leaflet/images/marker-shadow.png`

- [ ] **Step 1: 创建 `scripts/copy-leaflet.js`**

```javascript
#!/usr/bin/env node
import { mkdirSync, copyFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
const src = join(root, 'node_modules', 'leaflet', 'dist');
const dst = join(root, 'public', 'vendor', 'leaflet');

const files = [
  'leaflet.css',
  'leaflet.js',
  'images/marker-icon.png',
  'images/marker-icon-2x.png',
  'images/marker-shadow.png',
];

mkdirSync(join(dst, 'images'), { recursive: true });
for (const f of files) {
  copyFileSync(join(src, f), join(dst, f));
  console.log(`copied ${f}`);
}
console.log('Leaflet vendor files copied to public/vendor/leaflet/');
```

- [ ] **Step 2: 运行脚本拷贝**

```bash
node scripts/copy-leaflet.js
```

预期：5 个 `copied ...` 日志 + `Leaflet vendor files copied ...`。

- [ ] **Step 3: 验证产物**

```bash
ls -la public/vendor/leaflet/ public/vendor/leaflet/images/
```

预期：`leaflet.css`、`leaflet.js`、`images/marker-icon.png` 等 5 个文件存在。

- [ ] **Step 4: 提交（vendor 资源纳入 git）**

```bash
git add scripts/copy-leaflet.js public/vendor/leaflet/
git commit -m "build: 自托管 Leaflet 1.9.4 静态资源到 public/vendor"
```

---

## Task 10: C2-2 Leaflet 延迟加载脚本

**Files:**
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: 替换 PostLayout 中的 leaflet `<link>` 与两段 `<script>`**

定位 PostLayout.astro 中：
- `{location && <link slot="head" rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />}`（Task 3 仍为 unpkg）
- `{location && (<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js" is:inline></script><script is:inline define:vars=...>...) }` 整段

**两处都删除**（含 link 与两段 script），换成下面的**单一延迟加载脚本**（仅在 location 存在时输出）。CSS 不再通过 SSR `<link>` 输出，改由下方 JS 动态注入：

```astro
{location && (
  <script is:inline define:vars={{ mapLat: location.lat, mapLng: location.lng, mapName: location.name }}>
    (function () {
      var el = document.querySelector('.location-map');
      if (!el) return;
      var loaded = false;

      function loadAsset(tag, attrs) {
        return new Promise(function (resolve, reject) {
          var node = document.createElement(tag);
          Object.keys(attrs).forEach(function (k) { node[k] = attrs[k]; });
          node.onload = resolve;
          node.onerror = reject;
          document.head.appendChild(node);
        });
      }

      function loadLeaflet() {
        return Promise.all([
          loadAsset('link', { rel: 'stylesheet', href: '/vendor/leaflet/leaflet.css' }),
          loadAsset('script', { src: '/vendor/leaflet/leaflet.js', async: false }),
        ]);
      }

      function initMap() {
        var icon = L.icon({
          iconUrl: '/vendor/leaflet/images/marker-icon.png',
          iconRetinaUrl: '/vendor/leaflet/images/marker-icon-2x.png',
          shadowUrl: '/vendor/leaflet/images/marker-shadow.png',
          iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
        });
        var map = L.map(el).setView([mapLat, mapLng], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
          maxZoom: 19
        }).addTo(map);
        L.marker([mapLat, mapLng], { icon: icon }).addTo(map).bindPopup(mapName).openPopup();
      }

      function trigger() {
        if (loaded) return;
        loaded = true;
        loadLeaflet().then(initMap).catch(function (err) {
          console.error('Leaflet load failed', err);
        });
      }

      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (entries) {
          if (entries.some(function (e) { return e.isIntersecting; })) {
            io.disconnect();
            trigger();
          }
        }, { rootMargin: '200px' });
        io.observe(el);
      } else {
        trigger();
      }
    })();
  </script>
)}
```

（CSS link 已在上一段说明中删除，无需重复操作。）

- [ ] **Step 2: 类型检查 + 构建**

```bash
npm run check
npm run build
```

- [ ] **Step 3: 验证 dist 不再含 unpkg.com 引用**

```bash
grep -rn 'unpkg.com' dist/blog/ | head -5 || echo "OK: 无 unpkg 引用"
```

预期：无匹配。

- [ ] **Step 4: 本地 preview 验证延迟加载**

```bash
npm run preview
```

打开任意带 location 的文章页（如 `/blog/2026-05-05-230605/`），DevTools Network 标签：
- 初始加载：不应有 `leaflet.js` 与 `leaflet.css` 请求
- 滚动到地图区域：应触发 leaflet 资源加载，地图正常渲染

`Ctrl+C` 停止。

- [ ] **Step 5: 提交**

```bash
git add src/layouts/PostLayout.astro
git commit -m "perf(map): Leaflet 改为视口触发延迟加载，使用本地资源"
```

---

## Task 11: C3 列表/详情视觉升级

**Files:**
- Modify: `src/components/PostCard.astro`
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/PostLayout.astro`

- [ ] **Step 1: 升级 PostCard `<style>` 块**

定位 PostCard.astro `<style>` 块整体替换为：

```css
  .post-card {
    border: 1px solid var(--color-border);
    border-radius: 12px;
    overflow: hidden;
    background: var(--color-bg);
    transition: box-shadow 0.2s, border-color 0.2s;
  }
  .post-card:hover {
    box-shadow: 0 8px 24px rgba(0,0,0,0.06);
    border-color: var(--color-accent);
  }
  .card-image-link { display: block; }
  img {
    width: 100%;
    height: 200px;
    aspect-ratio: 16 / 10;
    object-fit: cover;
    transition: opacity 0.2s;
  }
  .card-image-link:hover img { opacity: 0.92; }
  .card-body { padding: 1.25rem; }
  .post-date { font-size: 0.8rem; color: var(--color-text-muted); }
  h2 { margin: 0.4rem 0 0.6rem; font-size: 1.15rem; line-height: 1.5; font-weight: 600; }
  h2 a { color: var(--color-text); }
  h2 a:hover { color: var(--color-accent); text-decoration: none; }
  .post-desc { color: var(--color-text-muted); font-size: 0.9rem; margin: 0 0 0.75rem; line-height: 1.6; }
  .tags { display: flex; gap: 0.4rem; flex-wrap: wrap; }
  .tag {
    background: color-mix(in srgb, var(--color-accent) 12%, transparent);
    color: var(--color-accent);
    border-radius: 999px;
    padding: 2px 10px;
    font-size: 0.75rem;
    font-weight: 500;
  }
```

变化要点：圆角 12px、移除 transform、改 border-color hover、hover 阴影更柔、标题字重 600 行高 1.5、tag 改胶囊。

- [ ] **Step 2: index.astro grid 大屏升 3 列**

定位 index.astro `<style>` 块，将 `@media (min-width: 600px)` 块整体替换为：

```css
  @media (min-width: 600px) {
    .grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (min-width: 1024px) {
    .grid { grid-template-columns: repeat(3, 1fr); }
  }
```

- [ ] **Step 3: PostLayout prose 视觉升级**

定位 PostLayout.astro `<style>` 块，按下列替换：

```text
old:   .prose { line-height: 1.8; }
new:   .prose { line-height: 1.85; font-size: 1.0625rem; }
```

```text
old:   .prose h2 { font-size: 1.4rem; margin: 2rem 0 0.75rem; }
new:   .prose h2 { font-size: 1.4rem; margin: 2.2rem 0 0.9rem; padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-border); }
```

```text
old:   .prose img { border-radius: 8px; margin: 1.25rem 0; }
new:   .prose img { border-radius: 12px; margin: 1.25rem 0; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
```

```text
old:   .prose blockquote {
    border-left: 3px solid var(--color-accent);
    padding-left: 1rem;
    color: var(--color-text-muted);
    margin: 1rem 0;
  }
new:   .prose blockquote {
    border-left: 3px solid var(--color-accent);
    background: var(--color-bg-secondary);
    padding: 0.75rem 1rem;
    border-radius: 0 8px 8px 0;
    color: var(--color-text-muted);
    margin: 1rem 0;
  }
```

另在 PostLayout `<style>` 块**末尾**追加 `pre/code` 微调（位置在 `@media (max-width: 720px)` 块**之前**）：

```css
  .prose pre { border-radius: 8px; font-size: 0.875rem; }
  .prose :not(pre) > code { font-size: 0.92em; }
```

- [ ] **Step 4: 构建并人工浏览**

```bash
npm run build && npm run preview
```

打开首页：>1024px 应见 3 列；hover 卡片应见柔阴影 + 边框变色，无位移。
打开任意文章：h2 有底边线、引用块有浅灰底、图片有圆角。

`Ctrl+C`。

- [ ] **Step 5: 提交**

```bash
git add src/components/PostCard.astro src/pages/index.astro src/layouts/PostLayout.astro
git commit -m "feat(ui): 列表与详情页视觉升级（卡片、tag 胶囊、prose 排版）"
```

---

## Task 12: C4 列表页 tag 筛选 + 空状态

**Files:**
- Modify: `src/pages/index.astro`

- [ ] **Step 1: 重写 `src/pages/index.astro`**

完整新内容：

```astro
---
import { getCollection } from 'astro:content';
import BaseLayout from '../layouts/BaseLayout.astro';
import Header from '../components/Header.astro';
import Footer from '../components/Footer.astro';
import PostCard from '../components/PostCard.astro';

const posts = await getCollection('blog', ({ data }) => !data.draft);
const sorted = [...posts].sort((a, b) => {
  const aTs = a.data.date ? a.data.date.valueOf() : 0;
  const bTs = b.data.date ? b.data.date.valueOf() : 0;
  return bTs - aTs;
});

const allTags = [...new Set(sorted.flatMap((p) => p.data.tags ?? []))].sort();

const schema = {
  '@context': 'https://schema.org',
  '@type': 'Blog',
  name: '我的博客',
  description: '我的图文博客',
  url: Astro.url.href,
};
---
<BaseLayout title="首页" description="我的图文博客" {schema}>
  <Header />
  <main class="container">
    {sorted.length === 0 ? (
      <div class="empty-state">
        <div class="empty-icon" aria-hidden="true">📷</div>
        <h2>暂无文章</h2>
        <p>稍候或前往后台发布第一篇文章。</p>
      </div>
    ) : (
      <>
        {allTags.length > 0 && (
          <nav class="tag-filter" aria-label="标签筛选">
            <button type="button" class="chip chip-all active" data-tag="">全部</button>
            {allTags.map((tag) => (
              <button type="button" class="chip" data-tag={tag}>#{tag}</button>
            ))}
          </nav>
        )}
        <div class="grid" id="post-grid">
          {sorted.map((post, idx) => <PostCard post={post} priority={idx < 2} />)}
        </div>
        <div class="empty-filtered" hidden>
          <p>该标签下暂无文章。</p>
          <button type="button" class="link-btn" id="clear-filter">清除筛选</button>
        </div>
      </>
    )}
  </main>
  <Footer />
</BaseLayout>

<script is:inline>
  (function () {
    var chips = Array.from(document.querySelectorAll('.tag-filter .chip'));
    var cards = Array.from(document.querySelectorAll('.post-card'));
    var emptyFiltered = document.querySelector('.empty-filtered');
    var clearBtn = document.getElementById('clear-filter');
    if (!chips.length) return;

    function applyTag(tag) {
      var visibleCount = 0;
      cards.forEach(function (card) {
        var tagsAttr = card.getAttribute('data-tags') || '';
        var tags = tagsAttr.split(',').filter(Boolean);
        var visible = !tag || tags.indexOf(tag) >= 0;
        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });
      chips.forEach(function (c) { c.classList.toggle('active', (c.getAttribute('data-tag') || '') === tag); });
      if (emptyFiltered) emptyFiltered.hidden = visibleCount > 0 || !tag;

      var url = new URL(window.location.href);
      if (tag) url.searchParams.set('tag', tag);
      else url.searchParams.delete('tag');
      window.history.replaceState({}, '', url);
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () { applyTag(c.getAttribute('data-tag') || ''); });
    });
    if (clearBtn) clearBtn.addEventListener('click', function () { applyTag(''); });

    var initial = new URLSearchParams(window.location.search).get('tag') || '';
    if (initial && chips.some(function (c) { return c.getAttribute('data-tag') === initial; })) {
      applyTag(initial);
    }
  })();
</script>

<style>
  .container { max-width: var(--max-width); margin: 0 auto; padding: 2rem 1rem; }
  .grid { display: grid; gap: 1.5rem; }
  @media (min-width: 600px) { .grid { grid-template-columns: repeat(2, 1fr); } }
  @media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }

  .tag-filter {
    display: flex;
    flex-wrap: wrap;
    gap: 0.45rem;
    margin: 0 0 1.6rem;
  }
  .chip {
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text-muted);
    border-radius: 999px;
    padding: 0.32rem 0.85rem;
    font-size: 0.85rem;
    cursor: pointer;
    transition: border-color 0.15s, color 0.15s, background 0.15s;
  }
  .chip:hover { border-color: var(--color-accent); color: var(--color-accent); }
  .chip.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
    background: color-mix(in srgb, var(--color-accent) 10%, transparent);
  }

  .empty-state {
    text-align: center;
    padding: 4rem 1rem;
    color: var(--color-text-muted);
  }
  .empty-icon { font-size: 3rem; margin-bottom: 0.6rem; }
  .empty-state h2 { font-size: 1.2rem; margin-bottom: 0.4rem; color: var(--color-text); }
  .empty-state p { font-size: 0.9rem; }

  .empty-filtered {
    text-align: center;
    padding: 2.5rem 1rem;
    color: var(--color-text-muted);
  }
  .link-btn {
    margin-top: 0.6rem;
    border: 1px solid var(--color-border);
    background: var(--color-bg);
    color: var(--color-text-muted);
    border-radius: 999px;
    padding: 0.32rem 0.9rem;
    cursor: pointer;
    font-size: 0.85rem;
  }
  .link-btn:hover { border-color: var(--color-accent); color: var(--color-accent); }
</style>
```

- [ ] **Step 2: 构建 + preview 验证**

```bash
npm run build && npm run preview
```

打开 `http://localhost:4321/`：
- 列表上方应有 chip 行，含「全部」+ 所有 tag
- 点击某 tag：URL 变为 `?tag=xxx`，未含该 tag 的卡片隐藏
- 点击「全部」：恢复全部
- 直接访问 `/?tag=不存在的tag`：显示「该标签下暂无文章 · 清除筛选」
- 无文章时（不会发生在当前数据，仅理论）：显示带图标的空状态

`Ctrl+C`。

- [ ] **Step 3: 提交**

```bash
git add src/pages/index.astro
git commit -m "feat(home): 增加 tag 客户端筛选与空状态卡片"
```

---

## Task 13: C5 manifest + a11y 收尾（JSON-LD 已埋）

**Files:**
- Create: `public/manifest.webmanifest`

JSON-LD（Blog/BlogPosting）已在 Task 4/3 中通过 `schema` prop 埋入 BaseLayout，无需重复。
a11y `aria-label` / `role` 已在 Task 2/3 中加入，无需重复。
本任务仅补 manifest。

- [ ] **Step 1: 创建 `public/manifest.webmanifest`**

```json
{
  "name": "My Blog",
  "short_name": "Blog",
  "description": "我的图文博客",
  "start_url": "/",
  "display": "minimal-ui",
  "theme_color": "#0066cc",
  "background_color": "#ffffff",
  "icons": [
    {
      "src": "/favicon.svg",
      "sizes": "any",
      "type": "image/svg+xml",
      "purpose": "any"
    }
  ]
}
```

- [ ] **Step 2: 构建并验证**

```bash
npm run build
test -f dist/manifest.webmanifest && echo "OK"
grep 'application/ld+json' dist/index.html | head -1
grep 'application/ld+json' "$(ls dist/blog/*/index.html | head -1)" | head -1
```

预期：manifest 文件存在；首页含 `<script type="application/ld+json">`（Blog schema）；任一文章页同样含 JSON-LD（BlogPosting）。

- [ ] **Step 3: 提交**

```bash
git add public/manifest.webmanifest
git commit -m "feat(pwa): 添加最小 web manifest"
```

---

## Task 14: C6 _headers 缓存 hint + 基线测量

**Files:**
- Create: `public/_headers`

- [ ] **Step 1: 创建 `public/_headers`**

```text
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=31536000, immutable

/favicon.svg
  Cache-Control: public, max-age=86400

/favicon.ico
  Cache-Control: public, max-age=86400

/manifest.webmanifest
  Cache-Control: public, max-age=86400

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/
  Cache-Control: public, max-age=0, must-revalidate
```

- [ ] **Step 2: 构建并测量基线**

```bash
npm run build
du -sh dist/
find dist -name '*.js' -size +50k -printf '%s\t%p\n' | sort -nr | head -5
find dist -name '*.css' -size +20k -printf '%s\t%p\n' | sort -nr | head -5
```

记下输出（dist 总大小、最大 JS、最大 CSS），写入 commit message 末尾作为基线。

- [ ] **Step 3: 验证 _headers 被复制到 dist**

```bash
test -f dist/_headers && cat dist/_headers | head -3
```

预期：文件存在，前 3 行可见。

- [ ] **Step 4: 提交**

```bash
git add public/_headers
git commit -m "$(cat <<'EOF'
perf(cache): 配置 _headers，长缓存 _astro/* 与 /vendor/*

构建基线（部署前）：
- dist 总大小：<填入 du 输出>
- 最大 JS：<填入>
- 最大 CSS：<填入>
EOF
)"
```

`<填入>` 处替换为 Step 2 的实际输出。

---

## Task 15: 推送并验证 CF Pages 部署

**Files:** 无文件改动。

- [ ] **Step 1: 检查所有 commit**

```bash
git log --oneline c2b1674..HEAD
```

预期：约 10 个 commit，覆盖所有 task。

- [ ] **Step 2: 推送到 origin/master**

```bash
git push origin master
```

- [ ] **Step 3: 等待 CF Pages 部署完成**

人工任务：打开 CF Dashboard → Pages → `cf-blogs` 项目，等待最新 deployment 状态变为 Success（通常 1-2 分钟）。

- [ ] **Step 4: 线上烟囱测试**

打开 `https://cf-blogs-4j9.pages.dev/`：
- 首页正常加载，含 tag chip
- DevTools → Network → 选 `_astro/*` 文件 → 响应头含 `Cache-Control: public, max-age=31536000, immutable`
- 进入文章页，滚到底部地图加载正常
- 访问旧 URL `https://cf-blogs-4j9.pages.dev/blog/zh/2026-05-05-230605/` 应 301 到 `/blog/2026-05-05-230605/`
- 在桌面浏览器 admin 进入 → rich_text 默认
- DevTools 模拟 iPhone 14 → 进入 admin 新建文章 → 自动 Markdown

- [ ] **Step 5: 跑 Lighthouse Mobile（可选）**

DevTools → Lighthouse → Mobile / Performance → Generate report。记下 Performance / Accessibility / SEO / Best Practices / PWA 分数。

- [ ] **Step 6: 任务完成（无需 commit）**

---

## 风险与回退

每个 task 一个独立 commit，回退用 `git revert <hash>` 即可。

| 风险 | 触发场景 | 回退路径 |
|---|---|---|
| Decap 选择器失效，admin 移动端 markdown 切换无效 | Decap 未来版本类名变化 | revert Task 7；用户仍可手动切换 |
| `_redirects` 在本地 preview 不生效 | preview 默认行为 | 仅线上验证，记录为已知现象 |
| Leaflet IntersectionObserver 在极旧浏览器不支持 | iOS <12.2 | 已写 `else trigger()` 兜底立即加载 |
| `_headers` 写错导致页面被永久缓存 | 误配 / | 仅 `_astro/*`/`vendor/*`（带 hash 资源）immutable，HTML 显式 must-revalidate |
| manifest 路径下不存在 icon 导致控制台 warn | favicon.svg 缺失 | 当前 favicon.svg 已存在，无风险 |

## 验收清单

- [ ] `src/i18n/`、`LanguageSwitcher.astro` 已删除
- [ ] 所有 `.astro` 不再 import i18n / 不再使用 `t()` 与 `lang` prop
- [ ] `src/content/blog/` 直接含 md 文件，无 `zh/` 子目录
- [ ] `public/_redirects` 含 `/blog/zh/* → /blog/:splat 301`
- [ ] admin 在 ≤720px 屏幕、首次进入条目页时自动切到 Markdown
- [ ] 文章详情页地图仅在滚到视口时加载（Network 验证）
- [ ] `dist/_astro/*` 响应头含 `Cache-Control: ..., immutable`
- [ ] 首页支持 `?tag=xxx` 客户端筛选 + 空状态
- [ ] 详情页 `<head>` 含 BlogPosting JSON-LD，首页含 Blog JSON-LD
- [ ] `public/manifest.webmanifest` 存在并被引用
- [ ] 构建产物大小已记录在 Task 14 的 commit message
