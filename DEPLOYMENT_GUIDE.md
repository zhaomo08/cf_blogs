# 🚀 部署指南

代码已推送到 GitHub：https://github.com/zhaomo08/cf_blogs

## 📋 部署步骤

### 第一步：创建 GitHub OAuth App

1. 访问：https://github.com/settings/developers
2. 点击 **"New OAuth App"**
3. 填写信息：
   - **Application name**: `CF Blogs Admin`
   - **Homepage URL**: `https://yourdomain.com`（暂时可以填 `http://localhost:4321`）
   - **Authorization callback URL**: `https://yourdomain.com/admin/oauth`（暂时可以填 `http://localhost:4321/admin/oauth`）
4. 点击 **"Register application"**
5. 记录 **Client ID** 和生成 **Client Secret**

### 第二步：部署 OAuth Worker 到 Cloudflare

#### 方法 A：使用提供的 Worker 代码

```bash
cd workers

# 登录 Cloudflare
npx wrangler login

# 部署 Worker
npx wrangler deploy oauth-provider.js --name cf-blogs-oauth

# 添加环境变量
npx wrangler secret put OAUTH_CLIENT_ID --name cf-blogs-oauth
# 输入你的 GitHub OAuth Client ID

npx wrangler secret put OAUTH_CLIENT_SECRET --name cf-blogs-oauth
# 输入你的 GitHub OAuth Client Secret
```

记录 Worker URL（例如：`https://cf-blogs-oauth.your-username.workers.dev`）

#### 方法 B：使用现成的服务

使用 https://github.com/vencax/decap-cms-github-oauth-provider

```bash
git clone https://github.com/vencax/decap-cms-github-oauth-provider
cd decap-cms-github-oauth-provider
npm install
npx wrangler secret put OAUTH_CLIENT_ID
npx wrangler secret put OAUTH_CLIENT_SECRET
npx wrangler deploy
```

### 第三步：更新 OAuth 配置

编辑 `public/admin/config.yml`，添加 OAuth Worker URL：

```yaml
backend:
  name: github
  repo: zhaomo08/cf_blogs
  branch: master
  base_url: https://cf-blogs-oauth.your-username.workers.dev  # 你的 Worker URL
  auth_endpoint: auth
```

提交更改：

```bash
git add public/admin/config.yml
git commit -m "chore: add OAuth worker URL"
git push
```

### 第四步：创建 Cloudflare R2 存储桶

```bash
# 创建 R2 存储桶用于图片
npx wrangler r2 bucket create cf-blogs-images

# 查看存储桶列表
npx wrangler r2 bucket list
```

### 第五步：配置 Cloudflare Pages

#### 选项 A：通过 Dashboard（推荐）

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 进入 **Workers & Pages** → **Create application** → **Pages** → **Connect to Git**
3. 选择 GitHub 仓库：`zhaomo08/cf_blogs`
4. 配置构建设置：
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Root directory**: `/`
   - **Environment variables**: 无需添加
5. 点击 **Save and Deploy**

#### 选项 B：通过 GitHub Actions（已配置）

GitHub Actions 已经配置好了，但需要添加 Secrets：

1. 访问：https://github.com/zhaomo08/cf_blogs/settings/secrets/actions
2. 添加以下 Secrets：
   - `CLOUDFLARE_API_TOKEN`: 
     - 访问 https://dash.cloudflare.com/profile/api-tokens
     - 创建 Token，选择 "Edit Cloudflare Workers" 模板
     - 复制 Token
   - `CLOUDFLARE_ACCOUNT_ID`:
     - 在 Cloudflare Dashboard 右侧找到 Account ID
     - 复制 Account ID

配置完成后，每次 `git push` 都会自动部署。

### 第六步：绑定自定义域名

#### 为 Pages 绑定域名

1. Cloudflare Dashboard → Pages → 你的项目 → Custom domains
2. 点击 **Set up a custom domain**
3. 输入你的域名（如 `blog.yourdomain.com`）
4. DNS 记录会自动配置

#### 为 R2 绑定图片域名

1. Cloudflare Dashboard → R2 → `cf-blogs-images` → Settings → Custom Domains
2. 点击 **Connect Domain**
3. 输入子域名（如 `images.yourdomain.com`）
4. DNS 记录会自动配置

### 第七步：更新站点配置

编辑 `astro.config.mjs`：

```javascript
export default defineConfig({
  site: 'https://blog.yourdomain.com',  // 改为你的域名
  output: 'static',
  integrations: [sitemap()],
});
```

提交并推送：

```bash
git add astro.config.mjs
git commit -m "chore: update site URL"
git push
```

## 🎯 使用管理后台

### 访问管理后台

部署完成后，访问：`https://blog.yourdomain.com/admin/`

### 登录

1. 点击 **"Login with GitHub"**
2. 授权 GitHub OAuth App
3. 登录成功后进入管理界面

### 创建文章

1. 选择 **"博客文章（中文）"** 或 **"Blog Posts (English)"**
2. 点击 **"New 文章"**
3. 填写文章信息
4. 在正文中直接粘贴 Markdown 内容
5. 图片使用两种方式：
   - **方式 1**：上传到 Cloudflare R2，然后使用 R2 URL
   - **方式 2**：直接在 Markdown 中使用图片 URL：`![描述](https://images.yourdomain.com/image.jpg)`
6. 点击 **"Publish"** 发布

### 图片上传到 R2

```bash
# 上传单个图片
npx wrangler r2 object put cf-blogs-images/my-image.jpg --file ./my-image.jpg

# 上传整个目录
npx wrangler r2 object put cf-blogs-images/2024/ --file ./images/ --recursive
```

然后在文章中使用：
```markdown
![图片描述](https://images.yourdomain.com/my-image.jpg)
```

## 🔄 工作流程

```
写文章 → 管理后台发布 → Git 提交 → GitHub Actions → Cloudflare Pages 自动部署
```

1. 在管理后台写文章
2. 点击 "Publish" 发布
3. Decap CMS 自动提交到 GitHub
4. GitHub Actions 自动触发构建
5. 自动部署到 Cloudflare Pages
6. 网站自动更新

## 📸 图片管理最佳实践

### 方式 1：使用 R2（推荐）

**优点**：
- 完全免费（10GB 存储）
- 自动 CDN 加速
- 完全控制

**步骤**：
1. 上传图片到 R2：
   ```bash
   npx wrangler r2 object put cf-blogs-images/posts/2024/image.jpg --file ./image.jpg
   ```
2. 在文章中使用：
   ```markdown
   ![描述](https://images.yourdomain.com/posts/2024/image.jpg)
   ```

### 方式 2：使用 Unsplash

**优点**：
- 无需上传
- 高质量图片
- 免费使用

**步骤**：
1. 访问 https://unsplash.com
2. 找到图片，复制 URL
3. 在文章中使用：
   ```markdown
   ![描述](https://images.unsplash.com/photo-xxx?w=800)
   ```

### 方式 3：使用其他图床

任何 HTTPS 图片 URL 都可以直接使用：
```markdown
![描述](https://example.com/image.jpg)
```

## 🔐 安全配置

### 限制管理后台访问

只有 GitHub 仓库的协作者才能登录管理后台。

添加协作者：
1. 访问：https://github.com/zhaomo08/cf_blogs/settings/access
2. 点击 **"Add people"**
3. 输入 GitHub 用户名

### 启用分支保护

1. 访问：https://github.com/zhaomo08/cf_blogs/settings/branches
2. 添加规则保护 `master` 分支
3. 启用 "Require pull request reviews before merging"

## 📊 监控和日志

### 查看部署状态

- **GitHub Actions**: https://github.com/zhaomo08/cf_blogs/actions
- **Cloudflare Pages**: Cloudflare Dashboard → Pages → 你的项目 → Deployments

### 查看访问日志

Cloudflare Dashboard → Analytics → Web Analytics

## 🐛 故障排除

### 管理后台无法登录

1. 检查 GitHub OAuth App 配置
2. 检查 OAuth Worker 是否运行
3. 检查 `config.yml` 中的配置

### 图片不显示

1. 确保图片 URL 是 HTTPS
2. 检查 R2 自定义域名是否配置正确
3. 检查图片是否已上传到 R2

### 部署失败

1. 查看 GitHub Actions 日志
2. 检查 Cloudflare API Token 是否有效
3. 确保 `npm run build` 在本地可以成功运行

## 📚 相关链接

- **GitHub 仓库**: https://github.com/zhaomo08/cf_blogs
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Decap CMS 文档**: https://decapcms.org/docs/
- **Astro 文档**: https://docs.astro.build/

## ✅ 检查清单

部署前确保：

- [ ] GitHub OAuth App 已创建
- [ ] OAuth Worker 已部署
- [ ] `config.yml` 已更新 OAuth URL
- [ ] Cloudflare Pages 已配置
- [ ] R2 存储桶已创建
- [ ] 自定义域名已绑定
- [ ] GitHub Secrets 已添加（如使用 Actions）
- [ ] 可以访问 `/admin/` 并登录
- [ ] 可以创建和发布文章

---

🎉 **部署完成！** 现在你可以通过管理后台轻松发布博客了！
