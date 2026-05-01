# 🎛️ 管理后台设置指南

## 概述

你的博客现在集成了 **Decap CMS**（原 Netlify CMS）管理后台，可以通过 Web 界面直接编写和发布博客文章。

## ✨ 功能特性

- ✍️ **可视化 Markdown 编辑器**：所见即所得的编辑体验
- 📸 **图片上传**：直接拖拽上传图片
- 👀 **实时预览**：编辑时实时查看效果
- 📱 **响应式界面**：支持手机和平板访问
- 🔐 **GitHub 认证**：安全的身份验证
- 📝 **草稿功能**：保存草稿，稍后发布
- 🗺️ **地图支持**：可视化添加拍摄地坐标

## 🚀 快速开始

### 步骤 1：创建 GitHub OAuth App

1. 访问 GitHub Settings：https://github.com/settings/developers
2. 点击 **"New OAuth App"**
3. 填写信息：
   - **Application name**: `My Blog Admin`
   - **Homepage URL**: `https://yourdomain.com`（你的博客域名）
   - **Authorization callback URL**: `https://yourdomain.com/admin/oauth`
4. 点击 **"Register application"**
5. 记录 **Client ID** 和 **Client Secret**（稍后需要）

### 步骤 2：配置 Cloudflare Workers OAuth

由于 Decap CMS 需要 OAuth 服务器，我们使用 Cloudflare Workers 来实现：

#### 方法 A：使用现成的 OAuth 服务（推荐）

使用开源项目 [decap-cms-github-oauth-provider](https://github.com/vencax/decap-cms-github-oauth-provider)

1. Fork 该仓库到你的 GitHub
2. 部署到 Cloudflare Workers：

```bash
# 克隆仓库
git clone https://github.com/YOUR_USERNAME/decap-cms-github-oauth-provider
cd decap-cms-github-oauth-provider

# 安装依赖
npm install

# 配置环境变量
npx wrangler secret put OAUTH_CLIENT_ID
# 输入你的 GitHub OAuth Client ID

npx wrangler secret put OAUTH_CLIENT_SECRET
# 输入你的 GitHub OAuth Client Secret

# 部署
npx wrangler deploy
```

3. 记录 Worker URL（例如：`https://oauth.your-worker.workers.dev`）

#### 方法 B：使用 Netlify（更简单）

如果你不想配置 Workers，可以使用 Netlify 的免费 OAuth 服务：

1. 在 Netlify 上创建一个新站点（可以是空站点）
2. 在站点设置中添加 GitHub OAuth：
   - Settings → Access control → OAuth
   - 添加 GitHub Provider
   - 输入 Client ID 和 Client Secret
3. 使用 Netlify 的 OAuth 端点

### 步骤 3：更新配置文件

编辑 `public/admin/config.yml`：

```yaml
backend:
  name: github
  repo: YOUR_GITHUB_USERNAME/YOUR_REPO_NAME  # 改为你的仓库
  branch: main  # 或 master
  base_url: https://oauth.your-worker.workers.dev  # 你的 OAuth Worker URL
  auth_endpoint: auth
```

### 步骤 4：部署并访问

1. 提交更改：
```bash
git add .
git commit -m "feat: add admin panel"
git push
```

2. 等待 Cloudflare Pages 部署完成

3. 访问管理后台：
```
https://yourdomain.com/admin/
```

4. 点击 **"Login with GitHub"** 登录

## 📝 使用管理后台

### 创建新文章

1. 登录后台：`https://yourdomain.com/admin/`
2. 选择 **"博客文章（中文）"** 或 **"Blog Posts (English)"**
3. 点击 **"New 文章"** 或 **"New Post"**
4. 填写文章信息：
   - **标题**：文章标题
   - **描述**：文章简介
   - **发布日期**：选择日期
   - **封面图**：上传图片或输入 URL
   - **标签**：添加标签（可选）
   - **草稿**：是否为草稿
   - **拍摄地**：添加地理位置（可选）
   - **正文**：使用 Markdown 编写
5. 点击 **"Publish"** 发布，或 **"Save"** 保存草稿

### 编辑现有文章

1. 在后台列表中找到文章
2. 点击文章标题
3. 编辑内容
4. 点击 **"Publish"** 保存更改

### 上传图片

**方法 1：直接上传**
- 在编辑器中点击图片按钮
- 选择本地图片上传
- 图片会保存到 `public/images/uploads/`

**方法 2：使用 Unsplash**
- 访问 https://unsplash.com
- 找到喜欢的图片
- 复制图片 URL（添加 `?w=800` 参数优化大小）
- 粘贴到封面图或正文中

### 添加拍摄地

1. 打开 [Google Maps](https://www.google.com/maps)
2. 右键点击地图上的位置
3. 点击坐标数字复制（格式：纬度, 经度）
4. 在后台的 **"拍摄地"** 部分：
   - **地点名称**：输入地点名称（如"北京，中国"）
   - **纬度**：粘贴纬度值
   - **经度**：粘贴经度值

## 🔧 本地开发

如果想在本地测试管理后台：

### 方法 1：使用 Decap Server（推荐）

```bash
# 安装 decap-server
npm install -g decap-server

# 在项目根目录运行
npx decap-server
```

然后编辑 `public/admin/config.yml`，取消注释：

```yaml
local_backend: true
```

访问 `http://localhost:4321/admin/` 即可在本地使用后台（无需 GitHub 认证）。

### 方法 2：使用 GitHub OAuth

直接使用线上的 OAuth 配置，在本地开发服务器上也能登录。

## 🎨 自定义

### 修改编辑器样式

编辑 `public/admin/preview.css` 来自定义预览界面的样式。

### 添加更多字段

编辑 `public/admin/config.yml`，在 `fields` 数组中添加新字段：

```yaml
- { label: "作者", name: "author", widget: "string", required: false }
```

### 启用工作流模式

在 `config.yml` 中取消注释：

```yaml
publish_mode: editorial_workflow
```

这会启用 **草稿 → 审核 → 发布** 的工作流。

## 🔐 安全建议

1. **限制访问**：只有 GitHub 仓库的协作者才能登录后台
2. **保护分支**：在 GitHub 设置中启用分支保护规则
3. **审核提交**：启用 `editorial_workflow` 模式进行内容审核
4. **定期备份**：GitHub 本身就是备份，但可以定期导出内容

## 🐛 常见问题

### Q: 无法登录后台？
A: 检查：
1. GitHub OAuth App 的回调 URL 是否正确
2. OAuth Worker 是否正常运行
3. `config.yml` 中的仓库名是否正确

### Q: 图片上传失败？
A: 确保：
1. `public/images/uploads/` 目录存在
2. 图片大小不超过 10MB
3. 或者使用外部图片 URL（如 Unsplash）

### Q: 文章不显示？
A: 检查：
1. 文章的 `draft` 字段是否为 `false`
2. 文章是否已提交到 GitHub
3. Cloudflare Pages 是否已重新部署

### Q: 本地预览不工作？
A: 运行 `npx decap-server` 并在 `config.yml` 中启用 `local_backend: true`

## 📚 更多资源

- [Decap CMS 官方文档](https://decapcms.org/docs/)
- [Markdown 语法指南](https://www.markdownguide.org/)
- [Unsplash 免费图片](https://unsplash.com/)
- [Google Maps](https://www.google.com/maps)

## 🎉 开始写作

现在你可以：

1. 访问 `https://yourdomain.com/admin/`
2. 用 GitHub 账号登录
3. 开始写作和发布文章！

---

Happy blogging! ✍️
