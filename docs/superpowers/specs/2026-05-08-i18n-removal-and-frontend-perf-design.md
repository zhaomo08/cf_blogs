# 设计文档：移除 i18n + admin 移动端 + 前端展示与性能优化

- **日期**：2026-05-08
- **范围**：单语言化重构、admin 小屏体验、前端 6 项性能/展示优化
- **不在范围**：Cloudflare Pages 部署流程、Workers（OAuth、R2 上传）、Pagefind 索引结构、新增框架/SSR 模式、Service Worker

## 背景与目标

项目当前完成度约 85%。i18n 模块仅有占位（仅中文内容，英文路由已移除），属遗留死代码。Decap CMS 在移动端富文本编辑体验差。前端虽已做基础图片优化，仍有可观的 LCP / 资源加载 / 视觉层次 / 可发现性提升空间。

**目标**：
1. 彻底删除 i18n 死代码，简化代码路径
2. 让小屏发布文章不再依赖富文本编辑器
3. 在不动部署流程的前提下，进一步优化首屏性能、视觉与可发现性

**约束**：
- 兼容现有 CF Pages 部署（`astro build && pagefind --site dist` 不变）
- 不动 Workers
- 不引入新依赖框架（保持 Astro 6 + 原生 JS）

## 总体策略

三个互相独立的模块，每个独立 commit 便于回退：

| 模块 | 内容 | 风险 |
|---|---|---|
| A | 移除 i18n 与内容目录提升 | URL 变化（可加 301 兜底） |
| B | admin 移动端默认 Markdown | 仅改 admin/index.html |
| C | 前端 6 项性能 / 展示优化 | 各子项独立、可逐项回退 |

执行顺序：A → B → C1..C6。

---

## 模块 A · 移除 i18n

### 删除文件

- `src/i18n/index.ts`
- `src/i18n/translations.ts`
- `src/components/LanguageSwitcher.astro`

### 改造文件

| 文件 | 改动 |
|---|---|
| `src/layouts/BaseLayout.astro` | 移除 `lang` prop / `Lang` 类型导入，`<html lang>` 固定 `"zh"`，删除 og locale 相关 i18n 逻辑 |
| `src/layouts/PostLayout.astro` | 移除 `lang` prop 与 `t(lang, key)`，文案直接内联中文常量（如 `← 返回`、`上一篇`、`下一篇`、`拍摄地`） |
| `src/components/Header.astro` | 移除 `lang` prop 与 `t(...)`，导航文案中文常量 |
| `src/components/Footer.astro` | 同上 |
| `src/components/PostCard.astro` | 移除 `lang` prop / `guessedLang` / `post.id.startsWith('en/')` 判断；日期固定 `zh-CN` |
| `src/pages/index.astro` | 移除 `lang="zh"` 显式传递 |
| `src/pages/blog/[...slug].astro` | 移除 `lang` 计算与传递 |
| `src/pages/rss.xml.ts` | 移除 i18n 相关参数（如有） |
| `src/pages/search.astro` | 移除 i18n 相关参数（如有） |

### 内容迁移

- 用 `git mv src/content/blog/zh/<file>.md src/content/blog/<file>.md` 保留 history
- 检查 `src/content.config.ts` 中 collection schema 是否硬编码了 `zh/` 前缀，必要时调整

### admin 同步

- `public/admin/config.yml`：
  - `folder: src/content/blog/zh` → `src/content/blog`
  - `preview_path: blog/zh/{{slug}}` → `blog/{{slug}}`
  - 删除 `public/admin/config-netlify.yml` 中同样的 `zh/` 路径（若有）
- `scripts/new-post.js` 与 `scripts/validate-content.js`：检查路径常量

### URL 兼容

旧 URL `/blog/zh/<slug>` 失效。处理方式：
- 在 `public/_redirects` 增加：
  ```
  /blog/zh/* /blog/:splat 301
  ```
  CF Pages 原生支持 `_redirects` 文件，无需改部署
- RSS 订阅会随构建自动更新；外链通过 301 兜底

### 验证

- `npm run check`（Astro 类型检查）
- `npm run validate:content`
- `npm run build` 成功，dist 中不再有 `blog/zh/` 路径
- 手动访问 `/blog/zh/<旧 slug>/` 检查 301

---

## 模块 B · admin 移动端默认 Markdown

### 现状

- `public/admin/config.yml` body 字段：`widget: richtext`，`modes: ["rich_text", "raw"]`，无 `default_mode`，Decap 默认进 `rich_text`
- 富文本工具条在 720px 以下显著挤压、长按选择不灵敏

### 决策

**只在小屏强制切到 Markdown**，桌面端保持 rich_text 默认（用户已确认）。

### 实现（仅改 `public/admin/index.html`）

在现有 IIFE 内新增 `setupMobileEditorMode()`：

1. `if (!matchMedia('(max-width: 720px)').matches) return;`
2. localStorage flag `cf_blogs_mobile_md_applied_v1`：若存在则不再强制（用户可主动切回 rich_text 不被反复覆盖）
3. 监听 DOM：通过 `MutationObserver` 等待包含「Rich Text / Markdown」切换按钮的工具条出现
4. 找到当前显示 "Rich Text" 状态的切换按钮，模拟一次点击切到 Markdown，并写入 localStorage flag
5. 仅在新建/编辑文章页生效（通过 hash 路由 `#/collections/blog/new` 和 `#/collections/blog/entries/...`）

**额外 CSS**（防御性，富文本编辑器若仍出现在小屏）：
```css
@media (max-width: 720px) {
  /* Decap 富文本工具条 wrap，按钮加大点击区 */
  [class*="Toolbar"] { flex-wrap: wrap !important; }
  [class*="Toolbar"] button { min-height: 36px; min-width: 36px; }
}
```
（具体选择器需在实际 DOM 中验证，先以 `data-testid` 或类名前缀匹配）

### 验证

- 桌面浏览器（>720px）打开 admin，确认默认仍是 rich_text
- 在 DevTools 模拟 iPhone 14（390px），新建文章，确认自动进入 Markdown raw 模式
- 手动切回 rich_text 后刷新，不应被再次强制切回

---

## 模块 C · 前端展示与性能（6 项）

### C1 · 首屏 LCP

**改动 `src/layouts/BaseLayout.astro`**：在 `<head>` 顶部加：
```html
<link rel="preconnect" href="https://cf-blogs-r2.zhaomo0823.workers.dev" crossorigin />
<link rel="dns-prefetch" href="https://cf-blogs-r2.zhaomo0823.workers.dev" />
```

**改动 `src/pages/index.astro` + `src/components/PostCard.astro`**：
- PostCard 新增可选 prop `priority?: boolean`
- 当 `priority` 为 true 时：`<img>` 设 `loading="eager" fetchpriority="high"`（替换默认 `lazy / async`）
- index.astro 给前 2 张 PostCard 传 `priority`

字体当前为 `system-ui`，无加载阻塞，本项**不再处理字体子项**。

### C2 · Leaflet 自托管 + 延迟加载

**自托管**：
- 新增 `scripts/copy-leaflet.js`：从 `node_modules/leaflet/dist/` 拷贝 `leaflet.css`、`leaflet.js`、`images/marker-icon.png`、`images/marker-icon-2x.png`、`images/marker-shadow.png` 到 `public/vendor/leaflet/`
- 决策：把 `public/vendor/leaflet/` **纳入 git**，确保 CF Pages 构建产物可用，构建期不依赖 prebuild
- `scripts/copy-leaflet.js` 仅作为**更新 leaflet 版本时的开发辅助**，手动运行；不挂 `prebuild`，构建命令保持 `astro build && pagefind --site dist` 不变

**延迟加载**（改 `src/layouts/PostLayout.astro`）：
- 移除 SSR 输出的 leaflet `<link>` 和 `<script>`
- 改为：始终输出占位 `<div class="location-map">`，再输出一段控制脚本：
  ```js
  if ('IntersectionObserver' in window && el) {
    new IntersectionObserver((entries, obs) => {
      if (entries.some(e => e.isIntersecting)) {
        obs.disconnect();
        loadLeaflet().then(initMap);
      }
    }, { rootMargin: '200px' }).observe(el);
  } else { /* 旧浏览器立即加载 */ }
  ```
- `loadLeaflet()` 动态 `appendChild` `/vendor/leaflet/leaflet.css` 与 `leaflet.js`，返回 Promise
- 无 location 字段的文章：完全不输出 leaflet 相关脚本（已是现状，保持）

### C3 · 列表/详情视觉升级

**`src/components/PostCard.astro`**：
- 阴影：`box-shadow: 0 8px 24px rgba(0,0,0,0.06);`
- hover 行为：移除 `transform: translateY(-2px)`，改为 `border-color: var(--color-accent)`（移动端友好，避免 sticky hover）
- 标题字重 `600`，行高 `1.5`
- tag 样式：背景 `color-mix(in srgb, var(--color-accent) 12%, transparent)`，色 `var(--color-accent)`，去边框，圆角 `999px` 胶囊

**`src/pages/index.astro` grid**：
```css
@media (min-width: 1024px) { .grid { grid-template-columns: repeat(3, 1fr); } }
```

**`src/layouts/PostLayout.astro` prose**：
- 字号 `1.0625rem`、行高 `1.85`
- h2 加 `padding-bottom: 0.4rem; border-bottom: 1px solid var(--color-border);`
- 代码块：圆角 `8px`、字号 `0.875rem`
- 引用块：`background: var(--color-bg-secondary); padding: 0.75rem 1rem; border-radius: 8px;`
- 图片：圆角 `12px`、`box-shadow: 0 4px 12px rgba(0,0,0,0.05)`

### C4 · 列表页标签筛选 + 空状态

**SSR 部分（`src/pages/index.astro`）**：
- 收集所有 `posts.flatMap(p => p.data.tags)`，去重排序
- 渲染 `<nav class="tag-filter">` chip 列表 + 「全部」chip
- 给每张 PostCard 容器加 `data-tags="tag1,tag2,..."`
- 空状态卡片（带图标的居中布局）替换现有 `<p class="empty">`

**客户端 JS（`<script>` 内联）**：
1. 读 `URLSearchParams` 中 `tag`
2. 对所有 `.post-card`：`hidden = tag && !data-tags 包含 tag`
3. 高亮当前 chip
4. chip 点击：更新 URL（`history.replaceState`）+ 重新过滤
5. 筛选后无结果：显示 "该标签下暂无文章 · 清除筛选" 按钮

### C5 · A11y / SEO / PWA

**JSON-LD（`src/layouts/BaseLayout.astro`）**：
- 新增可选 prop `schema?: object`
- `<head>` 末尾若 schema 存在：`<script type="application/ld+json" set:html={JSON.stringify(schema)} />`
- `src/pages/index.astro` 传 `Blog` schema
- `src/layouts/PostLayout.astro` 传 `BlogPosting`（含 `headline`、`datePublished`、`image`、`author`、`description`）

**og:image fallback**：
- **决策**：本次不放占位图、不引用 fallback 路径，避免 404。`BaseLayout` 仅在 `image` 存在时输出 `og:image`（与现状一致）。后续用户提供 `og-default.png` 时再补一行 `?? '/og-default.png'`

**a11y**：
- `Header.astro` 加 `<nav aria-label="主导航">`
- 地图容器 `role="img"`（已有 `aria-label`）
- PostCard `<img>` 已有 alt（取自 title），保留
- 检查颜色对比：暗色模式下 `--color-text-muted: #999` 与 `#111` 背景对比约 6.7:1，OK

**PWA 轻量版**：
- 新增 `public/manifest.webmanifest`：`name`、`short_name`、`start_url: /`、`display: minimal-ui`、`theme_color`、`background_color`、`icons`（用现有 favicon.svg）
- BaseLayout `<head>` 加 `<link rel="manifest" href="/manifest.webmanifest" />`、`<meta name="theme-color">`
- **不做** Service Worker

### C6 · 资源缓存 hint

**新增 `public/_headers`**（CF Pages 原生支持，不影响部署）：

```
/_astro/*
  Cache-Control: public, max-age=31536000, immutable

/vendor/*
  Cache-Control: public, max-age=31536000, immutable

/*.html
  Cache-Control: public, max-age=0, must-revalidate

/manifest.webmanifest
  Cache-Control: public, max-age=86400
```

Astro 给 `_astro/*` 资源带内容 hash，`immutable` 安全。`/vendor/leaflet/` 同理（版本号在 path 中）。HTML 用 `must-revalidate` 保证发文章后用户能立即看到。

构建产物基线：本次落地后跑 `npm run build` 记录 `dist/` 总大小与最大单文件，写入 commit message。

---

## 测试策略

每个模块独立验证：

- **A**：`npm run check && npm run validate:content && npm run build`；浏览 `/blog/<slug>` OK；访问 `/blog/zh/<旧slug>` 返回 301
- **B**：DevTools 模拟 iPhone 14 (390px) 打开 admin，新建文章，确认默认 Markdown；桌面打开仍是 rich_text
- **C1-C6**：
  - `npm run preview` + Lighthouse Mobile 跑 before/after，对比 LCP / Performance 分数
  - 文章页滚动验证 leaflet 仅滚到地图时才请求
  - 首页传 `?tag=xx` 验证客户端筛选
  - DevTools Network 验证 `_astro/*` 响应头 `Cache-Control: max-age=31536000, immutable`

## 风险

| 风险 | 缓解 |
|---|---|
| 旧 RSS 订阅者收到 404 | `_redirects` 301 兜底 |
| Decap 工具条选择器变更使 admin 移动端脚本失效 | 加日志兜底；脚本失败不影响正常使用，仅退化为默认 rich_text |
| Leaflet 拷贝脚本在 CF Pages 构建环境失败 | `public/vendor/leaflet/` 纳入 git，构建期不依赖 prebuild |
| `_headers` 写错导致缓存太久 | 仅对带 hash 的资源 immutable，HTML 用 must-revalidate |
| og-default.png 缺失 | 先不引用，待用户后续提供 |

## 验收清单

- [ ] `src/i18n/` 已删除，所有 `.astro` 不再 import i18n
- [ ] `src/content/blog/` 直接含 md 文件，无 `zh/` 子目录
- [ ] `_redirects` 含 `/blog/zh/* → /blog/:splat 301`
- [ ] admin 在 ≤720px 屏幕下默认进入 Markdown 模式
- [ ] 文章详情页地图仅在滚到视口时加载（Network 面板验证）
- [ ] `/_astro/*` 响应头含 `immutable`
- [ ] 首页支持 `?tag=xxx` 客户端筛选
- [ ] Lighthouse Mobile Performance 较基线提升（具体数值待落地后回填）
