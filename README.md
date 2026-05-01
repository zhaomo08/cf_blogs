# 我的图文博客

基于 Astro + Cloudflare Pages 的静态博客，支持暗色模式、全文搜索、RSS、地理位置地图，以及后台 Markdown 写作与 R2 图片上传。

## 技术栈
- Astro 6
- Cloudflare Pages
- Cloudflare R2（通过 Worker 上传接口）
- Pagefind（静态全文检索）
- Leaflet.js + OpenStreetMap（地图）

## 功能
- 暗色模式切换
- 全文搜索与标签筛选
- RSS 订阅（`/rss.xml`）
- 文章地理位置地图展示（有 `location` 时显示）
- 响应式布局
- Decap CMS 后台写作（Markdown/富文本切换 + 预览）

## 本地开发
```bash
npm install
npm run dev
```

常用命令：
- `npm run dev`：开发模式
- `npm run validate:content`：校验文章 frontmatter（标题/日期/location/tags）
- `npm run build`：生产构建（含 Pagefind 索引）
- `npm run preview`：本地预览构建产物
- `npm run check`：Astro 检查

## 内容与路由
- 博客内容目录：`src/content/blog/zh`
- 单篇文章路由：`/blog/zh/<slug>`
- 搜索页：`/search`
- RSS：`/rss.xml`
- 后台：`/admin/`

文章 frontmatter 示例：
```md
---
title: 文章标题
description: 摘要
date: 2026-05-02T12:00:00.000Z
tags:
  - 技术
  - 生活
draft: false
location:
  name: Shanghai, China
  lat: 31.2304
  lng: 121.4737
---

正文内容...
```

## 后台写作说明
- 直接粘贴图片 URL：可在预览中看到图片
- 本地图片上传：点击后台右下角“上传图片到 R2”，会自动插入 Markdown 图片语法
- 正文开头可写内联元信息（保存时自动提取）：

```md
[技术, 生活]
(这里是摘要)
```

## 部署
- 推荐：Cloudflare Pages 直接连接 GitHub 仓库自动部署
- 构建命令：`npm run build`
- 输出目录：`dist`

Worker 关键环境变量：
- `workers/wrangler.toml`（OAuth）
  - `ALLOWED_ORIGINS`: 允许调用 OAuth 的来源域名（逗号分隔）
  - `ALLOWED_REDIRECT_ORIGINS`: 回调后允许跳转的来源（逗号分隔）
  - `OAUTH_STATE_SECRET`（Secret）：OAuth state 签名密钥
- `workers/r2-wrangler.toml`（R2 上传）
  - `ALLOWED_ORIGINS`: 允许上传请求来源（逗号分隔）
  - `ALLOWED_GITHUB_LOGINS`: 允许上传的 GitHub 用户名（逗号分隔，小写）
  - `MAX_UPLOAD_BYTES`: 上传大小上限（字节）

## 许可证
MIT
