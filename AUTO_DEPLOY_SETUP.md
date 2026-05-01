# 🚀 配置自动部署

## 方法：通过 Cloudflare Dashboard 连接 GitHub

### 步骤 1：访问 Cloudflare Dashboard

1. 访问：https://dash.cloudflare.com/
2. 进入 **Workers & Pages**
3. 找到 **cf-blogs** 项目
4. 点击项目名称进入设置

### 步骤 2：连接 GitHub 仓库

1. 在项目页面，点击 **Settings** 标签
2. 找到 **Builds & deployments** 部分
3. 点击 **Connect to Git**
4. 选择 **GitHub**
5. 授权 Cloudflare 访问你的 GitHub（如果还没授权）
6. 选择仓库：`zhaomo08/cf_blogs`
7. 配置构建设置：
   - **Production branch**: `master`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
8. 点击 **Save**

### 步骤 3：测试自动部署

现在，每次你在管理后台发布文章：
1. Decap CMS 自动提交到 GitHub
2. Cloudflare Pages 检测到更新
3. 自动构建并部署
4. 1-2 分钟后，新文章上线！

---

## 工作流程

```
管理后台写文章 → 点击发布 → 自动提交到 GitHub → Cloudflare 自动部署 → 网站更新
```

---

## 验证自动部署

1. 在管理后台创建一篇测试文章
2. 点击"发布"
3. 访问 GitHub 仓库，应该看到新的提交
4. 访问 Cloudflare Dashboard → cf-blogs → Deployments
5. 应该看到新的部署正在进行
6. 等待 1-2 分钟，访问网站查看新文章

---

## 如果不想通过 Dashboard 配置

你也可以手动部署：

```bash
# 每次发布文章后，在本地运行：
git pull
npm run build
npx wrangler pages deploy dist --project-name=cf-blogs --branch=master --commit-dirty=true
```

但这样比较麻烦，推荐使用自动部署。
