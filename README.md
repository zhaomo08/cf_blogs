# 📷 我的图文博客

基于 Astro 5 + Cloudflare Pages 构建的现代化图文博客，支持中英双语、全文搜索、拍摄地地图、RSS 订阅和暗色模式。

## ✨ 功能特性

- 🌍 **中英双语**：完整的 i18n 支持
- 🌓 **暗色模式**：自动适配系统主题，支持手动切换
- 🔍 **全文搜索**：基于 Pagefind 的静态搜索
- 📍 **拍摄地地图**：使用 Leaflet.js 展示文章拍摄地
- � **RSS 订阅**：每种语言独立的 RSS Feed
- 🎨 **响应式设计**：完美适配各种设备
- ⚡ **极速加载**：全站静态生成，CDN 加速
- 🆓 **零成本运行**：完全在 Cloudflare 免费套餐内

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 本地开发

```bash
npm run dev
```

访问 http://localhost:4321 查看效果

### 构建部署

```bash
npm run build
npm run preview
```

## 📝 写博客

### 方法一：使用管理后台（推荐）⭐

访问 `https://yourdomain.com/admin/` 使用可视化编辑器写作：

- ✍️ 所见即所得的 Markdown 编辑器
- 📸 直接上传图片
- 👀 实时预览
- 🗺️ 可视化添加拍摄地

**首次使用需要配置 GitHub OAuth**，详见 [ADMIN_SETUP.md](./ADMIN_SETUP.md)

### 方法二：使用脚本创建

```bash
npm run new
```

按提示输入文章信息，脚本会自动创建文章文件。

### 方法三：手动创建

在对应语言目录下创建 `.md` 文件：

```
src/content/blog/zh/文章名.md    # 中文文章
src/content/blog/en/article.md  # 英文文章
```

### 文章格式

```markdown
---
title: "文章标题"
description: "文章简介"
date: 2026-05-01
cover: "https://example.com/image.jpg"  # 可选
tags: ["标签1", "标签2"]                 # 可选
draft: false                             # 可选
location:                                # 可选
  name: "北京，中国"
  lat: 39.9042
  lng: 116.4074
---

## 开始写作

在这里写下你的内容...
```

详细说明请查看 [BLOG_GUIDE.md](./BLOG_GUIDE.md)

## 📁 项目结构

```
/
├── src/
│   ├── content/
│   │   └── blog/
│   │       ├── zh/          # 中文文章
│   │       └── en/          # 英文文章
│   ├── layouts/             # 页面布局
│   ├── components/          # 组件
│   ├── pages/               # 路由页面
│   ├── i18n/                # 国际化
│   └── styles/              # 全局样式
├── public/                  # 静态资源
├── scripts/                 # 工具脚本
└── wrangler.toml           # Cloudflare 配置
```

## 🛠️ 命令说明

| 命令 | 说明 |
|------|------|
| `npm run dev` | 启动开发服务器 |
| `npm run build` | 构建生产版本（包含搜索索引） |
| `npm run preview` | 预览构建结果 |
| `npm run check` | 类型检查 |
| `npm run new` | 创建新文章（命令行） |
| `npm run setup-admin` | 配置管理后台 |

## 🌐 部署到 Cloudflare Pages

### 1. 更新域名配置

编辑 `astro.config.mjs`，将 `site` 改为你的域名：

```javascript
export default defineConfig({
  site: 'https://yourdomain.com',
  // ...
});
```

### 2. 登录 Cloudflare

```bash
npx wrangler login
```

### 3. 部署

```bash
npm run build
npx wrangler pages deploy dist --project-name my-blog
```

### 4. 创建 R2 存储桶（用于图片）

```bash
npx wrangler r2 bucket create blog-images
```

### 5. 连接 GitHub 自动部署

在 Cloudflare Dashboard 中：
1. Pages → 选择项目 → Settings → Build & Deploy
2. 连接 GitHub 仓库
3. 设置构建命令：`npm run build`
4. 设置输出目录：`dist`

之后每次 `git push` 都会自动部署。

## 📸 图片管理

### 使用 Unsplash（推荐）

免费高质量图片：https://unsplash.com

```markdown
![描述](https://images.unsplash.com/photo-xxx?w=800)
```

### 使用 Cloudflare R2

1. 上传图片到 R2：
```bash
npx wrangler r2 object put blog-images/my-image.jpg --file ./image.jpg
```

2. 在 R2 Dashboard 绑定自定义域名（如 `images.yourdomain.com`）

3. 在文章中使用：
```markdown
![描述](https://images.yourdomain.com/my-image.jpg)
```

## 🗺️ 获取地理坐标

1. 打开 [Google Maps](https://www.google.com/maps)
2. 右键点击地图上的位置
3. 点击坐标数字复制（格式：纬度, 经度）

## 📚 技术栈

- **框架**：Astro 5
- **部署**：Cloudflare Pages
- **存储**：Cloudflare R2
- **搜索**：Pagefind
- **地图**：Leaflet.js + OpenStreetMap
- **RSS**：@astrojs/rss
- **SEO**：@astrojs/sitemap

## 📄 许可证

MIT

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

---

Happy blogging! 🎉
