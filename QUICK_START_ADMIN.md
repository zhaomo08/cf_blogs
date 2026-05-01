# 🚀 管理后台 5 分钟快速开始

## 最简单的方式：本地测试模式

如果你只是想快速体验管理后台，使用本地模式最简单：

### 步骤 1：启动本地服务器

```bash
# 终端 1：启动 Decap Server
npx decap-server

# 终端 2：启动开发服务器
npm run dev
```

### 步骤 2：启用本地模式

编辑 `public/admin/config.yml`，取消注释这一行：

```yaml
local_backend: true
```

### 步骤 3：访问管理后台

打开浏览器访问：http://localhost:4321/admin/

**无需登录**，直接开始写作！

---

## 生产环境：GitHub OAuth 方式

### 快速配置（3 步）

#### 1️⃣ 创建 GitHub OAuth App

访问：https://github.com/settings/developers

点击 **"New OAuth App"**，填写：
- **Application name**: `My Blog Admin`
- **Homepage URL**: `https://yourdomain.com`
- **Authorization callback URL**: `https://yourdomain.com/admin/oauth`

记录 **Client ID** 和 **Client Secret**

#### 2️⃣ 部署 OAuth Worker

**选项 A：使用 Cloudflare Workers（推荐）**

```bash
# 1. 创建 Worker
cd workers
npx wrangler deploy oauth-provider.js

# 2. 添加环境变量
npx wrangler secret put OAUTH_CLIENT_ID
# 输入你的 GitHub Client ID

npx wrangler secret put OAUTH_CLIENT_SECRET
# 输入你的 GitHub Client Secret
```

记录 Worker URL（如：`https://oauth.your-name.workers.dev`）

**选项 B：使用现成的服务**

使用 [decap-cms-github-oauth-provider](https://github.com/vencax/decap-cms-github-oauth-provider)：

```bash
git clone https://github.com/vencax/decap-cms-github-oauth-provider
cd decap-cms-github-oauth-provider
npm install
npx wrangler secret put OAUTH_CLIENT_ID
npx wrangler secret put OAUTH_CLIENT_SECRET
npx wrangler deploy
```

#### 3️⃣ 更新配置

编辑 `public/admin/config.yml`：

```yaml
backend:
  name: github
  repo: YOUR_USERNAME/YOUR_REPO  # 改成你的仓库
  branch: main
  base_url: https://oauth.your-name.workers.dev  # 你的 Worker URL
  auth_endpoint: auth
```

提交并部署：

```bash
git add .
git commit -m "feat: configure admin panel"
git push
```

### ✅ 完成！

访问 `https://yourdomain.com/admin/` 并用 GitHub 登录！

---

## 更简单的方式：使用 Netlify

如果你的站点部署在 Netlify 上：

### 步骤 1：启用 Identity

1. Netlify Dashboard → 你的站点 → Settings → Identity
2. 点击 **"Enable Identity"**

### 步骤 2：启用 Git Gateway

1. Identity → Services → Git Gateway
2. 点击 **"Enable Git Gateway"**

### 步骤 3：邀请用户

1. Identity → Invite users
2. 输入你的邮箱
3. 查收邮件并设置密码

### 步骤 4：更新配置

将 `public/admin/config-netlify.yml` 重命名为 `config.yml`：

```bash
mv public/admin/config-netlify.yml public/admin/config.yml
```

或者直接编辑 `config.yml`：

```yaml
backend:
  name: git-gateway
  branch: main
```

### ✅ 完成！

访问 `https://yourdomain.com/admin/` 并用邮箱登录！

---

## 🎯 使用管理后台

### 创建新文章

1. 登录后台
2. 选择 **"博客文章（中文）"** 或 **"Blog Posts (English)"**
3. 点击 **"New 文章"**
4. 填写信息：
   - 标题
   - 描述
   - 日期
   - 封面图（可选）
   - 标签（可选）
   - 拍摄地（可选）
   - 正文（Markdown）
5. 点击 **"Publish"** 发布

### 上传图片

**方法 1：直接上传**
- 点击图片按钮
- 选择本地图片
- 自动上传到 `public/images/uploads/`

**方法 2：使用 Unsplash**
- 访问 https://unsplash.com
- 复制图片 URL
- 粘贴到编辑器

### 添加拍摄地

1. 打开 [Google Maps](https://www.google.com/maps)
2. 右键点击位置
3. 复制坐标
4. 在后台填入：
   - 地点名称：`北京，中国`
   - 纬度：`39.9042`
   - 经度：`116.4074`

---

## 🐛 常见问题

### Q: 无法访问 /admin/ ？
A: 确保 `public/admin/index.html` 和 `config.yml` 存在

### Q: 登录失败？
A: 检查：
- GitHub OAuth App 配置是否正确
- OAuth Worker 是否运行
- config.yml 中的仓库名是否正确

### Q: 图片上传失败？
A: 使用外部图片 URL（如 Unsplash）更可靠

### Q: 本地模式不工作？
A: 确保运行了 `npx decap-server` 并启用了 `local_backend: true`

---

## 📚 更多帮助

- 详细文档：[ADMIN_SETUP.md](./ADMIN_SETUP.md)
- 配置测试：访问 `/admin/test.html`
- 官方文档：https://decapcms.org/docs/

---

Happy blogging! ✍️
