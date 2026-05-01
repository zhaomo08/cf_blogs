# Cloudflare 图文博客设计文档

**日期：** 2026-05-01  
**状态：** 已批准

---

## 概述

基于 Astro 5 + Cloudflare Pages 构建的图文博客，全站静态生成（SSG），部署在 Cloudflare 免费套餐上。图片资源托管于 Cloudflare R2，通过自定义域名提供 CDN 加速。支持中英双语、全文搜索、RSS 订阅、暗色模式、SEO 优化，以及在文章页展示拍摄地地图标记。

---

## 架构

### 部署架构

```
用户浏览器
    ↓ HTTPS
Cloudflare CDN（全球边缘节点）
    ├─→ Cloudflare Pages：静态 HTML/CSS/JS/Pagefind 索引
    └─→ Cloudflare R2：图片资源（images.域名.com）
         ↑ 构建触发
    GitHub 仓库（Markdown 源文件 + Astro 源码）
```

### 免费套餐资源清单

| 功能 | 使用的 CF 服务 | 免费额度 |
|------|--------------|---------|
| 静态托管 | Cloudflare Pages | 500次构建/月，100GB带宽 |
| 图片存储 | Cloudflare R2 | 10GB，1M写/10M读每月 |
| CDN + HTTPS | Cloudflare 全球网络 | 免费（含自定义域名） |
| 全文搜索 | Pagefind（浏览器本地） | 无限制 |
| 地图 | Leaflet.js + OpenStreetMap | 无限制，无需 API Key |

---

## 技术栈

| 层级 | 技术选型 | 说明 |
|------|---------|------|
| 框架 | Astro 5 | SSG，Content Collections，原生 i18n |
| 部署 | Cloudflare Pages | `@astrojs/cloudflare` adapter |
| 图片存储 | Cloudflare R2 | `images.域名.com` 自定义域 |
| 搜索 | Pagefind | 构建后生成静态索引 |
| 地图 | Leaflet.js + OpenStreetMap | 文章拍摄地展示 |
| RSS | @astrojs/rss | 每语言独立 Feed |
| SEO | @astrojs/sitemap + OpenGraph meta | 构建时生成 sitemap.xml |
| 暗色模式 | CSS 自定义属性 + localStorage | 内联 script 防 FOUC |
| 多语言 | Astro i18n routing | `/zh/` 默认，`/en/` 英文 |

---

## 目录结构

```
/
├── src/
│   ├── content/
│   │   ├── config.ts              # Content Collection schema（类型安全）
│   │   └── blog/
│   │       ├── zh/                # 中文文章 .md 文件
│   │       └── en/                # 英文文章 .md 文件
│   ├── layouts/
│   │   ├── BaseLayout.astro       # HTML 外壳：SEO meta、暗色模式、字体加载
│   │   └── PostLayout.astro       # 文章页布局：正文、地图、上下篇导航
│   ├── pages/
│   │   ├── index.astro            # 根路径 → 重定向到 /zh/
│   │   └── [lang]/
│   │       ├── index.astro        # 首页（文章卡片列表，分页）
│   │       ├── blog/
│   │       │   └── [slug].astro   # 文章详情页（含拍摄地地图）
│   │       └── rss.xml.ts         # RSS Feed（/zh/rss.xml, /en/rss.xml）
│   ├── components/
│   │   ├── Header.astro           # 顶部导航（含语言切换、搜索入口、主题切换）
│   │   ├── Footer.astro           # 页脚（RSS 链接、版权）
│   │   ├── PostCard.astro         # 首页文章卡片（封面图、标题、摘要、标签）
│   │   ├── LocationMap.astro      # 拍摄地地图组件（Leaflet，仅在有坐标时渲染）
│   │   ├── ThemeToggle.astro      # 暗色模式切换按钮
│   │   └── LanguageSwitcher.astro # 语言切换（当前页对应语言版本互跳）
│   └── styles/
│       └── global.css             # CSS 变量定义（light/dark token，字体，间距）
├── public/
│   └── favicon.svg
├── astro.config.mjs               # Astro 配置：adapter、i18n、sitemap、rss
├── wrangler.toml                  # Cloudflare 部署配置（R2 绑定）
└── package.json
```

---

## 内容模型

### 文章 Frontmatter Schema（`src/content/config.ts`）

```typescript
const blogSchema = z.object({
  title: z.string(),
  description: z.string(),
  date: z.coerce.date(),
  cover: z.string().optional(),        // R2 图片 URL，封面图
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
  location: z.object({                 // 拍摄地（可选）
    name: z.string(),                  // 显示名称，如 "京都府, 日本"
    lat: z.number(),
    lng: z.number(),
  }).optional(),
});
```

### 示例 Markdown 文章

```markdown
---
title: "京都的秋天"
description: "枫叶、岚山、寺庙——一个普通秋日的漫步记录"
date: 2026-10-15
cover: "https://images.yourdomain.com/kyoto/cover.jpg"
tags: ["旅行", "日本", "摄影"]
location:
  name: "京都府, 日本"
  lat: 35.0116
  lng: 135.7681
---

正文内容...

![岚山竹林](https://images.yourdomain.com/kyoto/arashiyama.jpg)
```

---

## 核心功能设计

### 1. 拍摄地地图组件（LocationMap）

- 仅当 frontmatter 包含 `location` 字段时渲染
- 使用 Leaflet.js + OpenStreetMap 瓦片（免费，无需 API Key）
- 地图显示单个标记点 + 弹出框（显示 `location.name`）
- 渲染为 Astro 客户端组件（`client:load`），地图交互需要 JS
- 在文章正文下方、上下篇导航上方展示

### 2. 多语言（i18n）

- Astro 内置 `i18n` 配置：`defaultLocale: 'zh'`，`locales: ['zh', 'en']`
- URL 结构：`/zh/blog/slug`（中文）、`/en/blog/slug`（英文）
- 根路径 `/` 重定向到 `/zh/`
- `LanguageSwitcher` 组件：跳转到当前文章/页面的另一语言版本（如有），否则跳首页
- UI 字符串（导航、按钮文案）存储在 `src/i18n/` 翻译文件中

### 3. 全文搜索（Pagefind）

- 构建命令：`astro build && npx pagefind --site dist`
- 生成 `dist/pagefind/` 静态索引，随 Pages 一起部署
- 搜索页 `/search` 加载 Pagefind UI 组件
- 无服务器，浏览器端本地搜索，支持中文分词

### 4. 暗色模式

- CSS 自定义属性（`--color-bg`、`--color-text` 等）分 `light` / `dark` 两套 token
- `BaseLayout` 的 `<head>` 内内联脚本：读取 `localStorage.theme`，在 DOM 渲染前设置 `data-theme` 属性，防止白闪（FOUC）
- `ThemeToggle` 组件切换并持久化偏好

### 5. 图片工作流（Cloudflare R2）

- R2 Bucket 绑定自定义域 `images.yourdomain.com`
- 上传方式：通过 Cloudflare Dashboard 或 `wrangler r2 object put` CLI
- Markdown 文章中直接使用完整 URL 引用图片
- R2 → Cloudflare CDN 出站流量免费（零费用）

### 6. RSS

- 每语言生成独立 Feed：`/zh/rss.xml`、`/en/rss.xml`
- 包含：标题、描述、发布日期、封面图、文章链接
- Footer 展示 RSS 订阅链接

### 7. SEO

- `@astrojs/sitemap` 自动生成 `sitemap.xml`（含多语言 hreflang）
- `BaseLayout` 注入 OpenGraph / Twitter Card meta 标签
- 每篇文章使用 frontmatter 的 `title` + `description` 作为 `<title>` 和 `<meta description>`
- 全站静态输出，对搜索引擎爬虫友好

---

## 构建与部署流程

```
git push → GitHub Actions / Cloudflare Pages CI
    ↓
npm run build        # astro build
    ↓
npx pagefind --site dist   # 生成搜索索引
    ↓
Cloudflare Pages 部署 dist/   # 自动发布到 CDN
```

- 自定义域名在 Cloudflare Pages 控制台绑定，自动签发 HTTPS 证书
- R2 Bucket 单独配置，与 Pages 共用同一 Cloudflare 账号

---

## 约束与边界

- 评论系统：**不包含**（可后期集成 Giscus/GitHub Discussions，免费）
- 足迹地图页（全站拍摄地汇总）：**不包含**，可作为后续迭代功能
- 图片 EXIF 自动提取：**不包含**，坐标手动填写在 frontmatter
- 后台管理界面：**不包含**，内容通过 Git + 编辑器管理
