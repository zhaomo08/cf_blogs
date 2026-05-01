# 🚀 简单部署指南（推荐）

GitHub Actions 失败了？没关系！使用 Cloudflare Dashboard 部署更简单可靠。

## 方法一：通过 Cloudflare Dashboard 部署（最简单）⭐

### 步骤 1：连接 GitHub 仓库

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 点击左侧 **Workers & Pages**
3. 点击 **Create application**
4. 选择 **Pages** 标签
5. 点击 **Connect to Git**
6. 选择 **GitHub**
7. 授权 Cloudflare 访问你的 GitHub
8. 选择仓库：`zhaomo08/cf_blogs`

### 步骤 2：配置构建设置

在构建配置页面填写：

- **Project name**: `cf-blogs`（或任何你喜欢的名字）
- **Production branch**: `master`
- **Build command**: `npm run build`
- **Build output directory**: `dist`
- **Root directory**: `/`（留空）

**Environment variables**: 不需要添加任何环境变量

### 步骤 3：开始部署

点击 **Save and Deploy**

Cloudflare 会自动：
1. 克隆你的仓库
2. 安装依赖
3. 运行构建
4. 部署到全球 CDN

等待 2-3 分钟，部署完成！

### 步骤 4：获取网站 URL

部署完成后，你会看到：
- **Production URL**: `https://cf-blogs.pages.dev`（或类似的）

访问这个 URL 查看你的博客！

### 步骤 5：绑定自定义域名（可选）

1. 在 Pages 项目页面，点击 **Custom domains**
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `blog.yourdomain.com`）
4. Cloudflare 会自动配置 DNS

---

## 方法二：禁用 GitHub Actions

如果你想禁用 GitHub Actions（避免失败通知）：

### 选项 A：删除 workflow 文件

```bash
git rm .github/workflows/deploy.yml
git commit -m "chore: remove GitHub Actions, use Cloudflare auto-deploy"
git push
```

### 选项 B：禁用 workflow

在 `.github/workflows/deploy.yml` 开头添加：

```yaml
# 此 workflow 已禁用，使用 Cloudflare Pages 自动部署
on:
  workflow_dispatch:  # 只能手动触发
```

---

## 🎯 配置管理后台

### 步骤 1：创建 GitHub OAuth App

1. 访问：https://github.com/settings/developers
2. 点击 **"New OAuth App"**
3. 填写：
   - **Application name**: `CF Blogs Admin`
   - **Homepage URL**: `https://cf-blogs.pages.dev`（使用你的实际 URL）
   - **Authorization callback URL**: `https://cf-blogs.pages.dev/admin/oauth`
4. 记录 **Client ID** 和 **Client Secret**

### 步骤 2：部署 OAuth Worker

**最简单的方法 - 使用现成的服务：**

```bash
# 克隆 OAuth 提供者
git clone https://github.com/vencax/decap-cms-github-oauth-provider
cd decap-cms-github-oauth-provider

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 添加 GitHub OAuth 凭证
npx wrangler secret put OAUTH_CLIENT_ID
# 粘贴你的 Client ID

npx wrangler secret put OAUTH_CLIENT_SECRET
# 粘贴你的 Client Secret

# 部署
npx wrangler deploy
```

记录 Worker URL（如：`https://decap-cms-github-oauth-provider.your-name.workers.dev`）

### 步骤 3：更新配置

编辑 `public/admin/config.yml`：

```yaml
backend:
  name: github
  repo: zhaomo08/cf_blogs
  branch: master
  base_url: https://decap-cms-github-oauth-provider.your-name.workers.dev
  auth_endpoint: auth
```

提交并推送：

```bash
git add public/admin/config.yml
git commit -m "chore: add OAuth worker URL"
git push
```

Cloudflare Pages 会自动重新部署（约 1-2 分钟）。

### 步骤 4：访问管理后台

访问：`https://cf-blogs.pages.dev/admin/`

点击 **"Login with GitHub"** 登录！

---

## 📸 配置图片上传（Cloudflare R2）

### 创建 R2 存储桶

```bash
# 登录 Cloudflare
npx wrangler login

# 创建存储桶
npx wrangler r2 bucket create cf-blogs-images

# 验证
npx wrangler r2 bucket list
```

### 绑定自定义域名

1. Cloudflare Dashboard → R2 → `cf-blogs-images`
2. 点击 **Settings** → **Custom Domains**
3. 点击 **Connect Domain**
4. 输入子域名（如 `images.yourdomain.com`）
5. 点击 **Connect domain**

### 上传图片

```bash
# 上传单个图片
npx wrangler r2 object put cf-blogs-images/test.jpg --file ./test.jpg

# 验证
npx wrangler r2 object list cf-blogs-images
```

### 在文章中使用

```markdown
![图片描述](https://images.yourdomain.com/test.jpg)
```

---

## 🔄 自动部署流程

配置完成后，工作流程：

```
写文章 → 管理后台发布 → 自动提交到 GitHub → Cloudflare 自动部署
```

1. 访问 `https://cf-blogs.pages.dev/admin/`
2. 用 GitHub 登录
3. 创建新文章
4. 点击 "Publish"
5. Decap CMS 自动提交到 GitHub
6. Cloudflare Pages 检测到更新，自动重新部署
7. 1-2 分钟后，新文章上线！

---

## ✅ 快速检查清单

- [ ] Cloudflare Pages 已连接 GitHub 仓库
- [ ] 首次部署成功
- [ ] 可以访问网站（`https://cf-blogs.pages.dev`）
- [ ] GitHub OAuth App 已创建
- [ ] OAuth Worker 已部署
- [ ] `config.yml` 已更新 OAuth URL
- [ ] 可以访问 `/admin/` 并登录
- [ ] 可以创建和发布文章
- [ ] R2 存储桶已创建（可选）
- [ ] R2 自定义域名已绑定（可选）

---

## 🐛 常见问题

### Q: Cloudflare Pages 构建失败？

**A:** 检查构建日志：
1. Cloudflare Dashboard → Pages → 你的项目 → Deployments
2. 点击失败的部署查看日志
3. 常见问题：
   - Node.js 版本：确保使用 Node 20+
   - 依赖安装失败：检查 `package.json`
   - 构建命令错误：确保 `npm run build` 在本地可以运行

### Q: 管理后台无法登录？

**A:** 检查：
1. GitHub OAuth App 的回调 URL 是否正确
2. OAuth Worker 是否正常运行（访问 Worker URL 应该看到 "running"）
3. `config.yml` 中的 `base_url` 是否正确

### Q: 图片不显示？

**A:** 确保：
1. 图片 URL 是 HTTPS
2. R2 自定义域名已正确配置
3. 图片已上传到 R2

---

## 📚 相关资源

- **你的网站**: https://cf-blogs.pages.dev
- **管理后台**: https://cf-blogs.pages.dev/admin/
- **GitHub 仓库**: https://github.com/zhaomo08/cf_blogs
- **Cloudflare Dashboard**: https://dash.cloudflare.com/

---

🎉 **部署完成！** 现在你可以开始写博客了！
