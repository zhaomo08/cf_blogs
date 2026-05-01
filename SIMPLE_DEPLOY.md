# 🚀 Cloudflare Pages 自动部署配置指南

## 第一步：删除旧项目（如果已创建）

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 找到 **cf-blogs** 项目（不是 cf-blogs-oauth）
4. 点击项目 → **Settings** → 拉到最下面 → **Delete project**

## 第二步：创建新的 Pages 项目

### 1. 点击 "Create application"

在 Workers & Pages 页面，点击右上角的 **Create application** 按钮

### 2. 选择 "Pages" 标签

- 不要选择 "Workers"
- 选择 **Pages** 标签
- 点击 **Connect to Git**

### 3. 连接 GitHub

- 选择 **GitHub**
- 如果需要，授权 Cloudflare 访问你的 GitHub
- 在仓库列表中找到 `zhaomo08/cf_blogs`
- 点击 **Begin setup**

### 4. 配置构建设置

这是最重要的一步！填写以下信息：

```
Project name: cf-blogs
Production branch: master
```

**Build settings:**
```
Framework preset: Astro
Build command: npm run build
Build output directory: dist
Root directory: /
```

**Environment variables (optional):**
暂时不需要添加

### 5. 点击 "Save and Deploy"

Cloudflare 会开始第一次构建和部署。

## 第三步：等待部署完成

- 第一次部署需要 2-3 分钟
- 你会看到构建日志
- 成功后会显示你的网站 URL（类似 `https://cf-blogs.pages.dev`）

## 第四步：更新配置文件

部署成功后，记下你的新 URL，然后更新以下文件：

### 1. 更新 `astro.config.mjs`

```javascript
export default defineConfig({
  site: 'https://你的新URL.pages.dev',  // 替换为实际 URL
  output: 'static',
  integrations: [sitemap()],
});
```

### 2. 更新 GitHub OAuth App

访问：https://github.com/settings/developers

找到你的 OAuth App，更新：
- **Homepage URL**: `https://你的新URL.pages.dev`
- **Authorization callback URL**: `https://cf-blogs-oauth.zhaomo0823.workers.dev/callback`

### 3. 提交更改

```bash
git add astro.config.mjs
git commit -m "Update site URL"
git push
```

Cloudflare Pages 会自动检测到更新并重新部署。

## 第五步：测试自动部署

1. 访问你的管理后台：`https://你的新URL.pages.dev/admin/`
2. 使用 GitHub 登录
3. 创建一篇测试文章
4. 点击 **Publish**
5. 等待 1-2 分钟
6. 刷新网站首页，应该能看到新文章

## 🎉 完成！

现在你的工作流程是：

```
管理后台写文章 → 点击发布 → GitHub 自动提交 → Cloudflare 自动构建 → 网站自动更新
```

---

## ❓ 常见问题

### Q: 我看不到 "Build output directory" 字段

**A:** 确保你选择的是 **Pages** 而不是 **Workers**。在创建时：
1. 点击 "Create application"
2. 选择 **Pages** 标签（不是 Workers）
3. 点击 "Connect to Git"

### Q: 构建失败了

**A:** 检查构建日志，常见原因：
- Node.js 版本不对（需要 >= 18）
- 依赖安装失败
- 构建命令错误

解决方法：在 Pages 项目设置中添加环境变量：
```
NODE_VERSION = 22.12.0
```

### Q: 发布文章后网站没更新

**A:** 检查：
1. GitHub 仓库是否有新的提交？
2. Cloudflare Pages → Deployments 是否有新的部署？
3. 等待 2-3 分钟，Cloudflare 需要时间构建

### Q: 管理后台登录失败

**A:** 确保：
1. GitHub OAuth App 的 Homepage URL 是正确的
2. OAuth Worker 的 Callback URL 配置正确
3. 清除浏览器缓存后重试

---

## 📝 当前配置信息

- **GitHub 仓库**: https://github.com/zhaomo08/cf_blogs
- **OAuth Worker**: https://cf-blogs-oauth.zhaomo0823.workers.dev
- **GitHub OAuth Client ID**: Ov23liVqqTQ5OpDzI85C
- **构建命令**: `npm run build`
- **输出目录**: `dist`
- **分支**: `master`
