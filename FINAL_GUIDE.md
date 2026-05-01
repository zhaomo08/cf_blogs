# 🎉 博客使用指南

## ✅ 已完成配置

- ✅ 博客网站已上线
- ✅ 管理后台已配置
- ✅ GitHub OAuth 登录已配置
- ✅ 图片上传功能已启用
- ✅ R2 存储桶已创建

## 🌐 你的网站

- **主站**: https://cf-blogs-4j9.pages.dev
- **管理后台**: https://cf-blogs-4j9.pages.dev/admin/
- **GitHub 仓库**: https://github.com/zhaomo08/cf_blogs

## 📝 如何写博客

### 步骤 1：访问管理后台

访问：https://cf-blogs-4j9.pages.dev/admin/

用 GitHub 登录

### 步骤 2：创建新文章

1. 点击"博客文章"
2. 点击"New 博客文章"
3. 填写信息：
   - **标题**：文章标题
   - **描述**：文章简介
   - **发布日期**：选择日期
   - **封面图**：
     - 方式 1：点击上传本地图片（自动上传到 Git）
     - 方式 2：粘贴图片 URL
   - **标签**：添加标签（可选）
   - **草稿**：是否为草稿
   - **正文**：使用 Markdown 编写

### 步骤 3：在正文中添加图片

**方式 1：直接拖拽上传**
- 在正文编辑器中直接拖拽图片
- 图片会自动上传到 `public/images/uploads/`

**方式 2：粘贴图片 URL**
```markdown
![图片描述](https://example.com/image.jpg)
```

**方式 3：使用 Unsplash**
```markdown
![图片描述](https://images.unsplash.com/photo-xxx?w=800)
```

### 步骤 4：发布

点击右上角的"发布"按钮

文章会自动提交到 GitHub

## 🔄 自动部署（需要配置）

目前每次发布后需要手动部署。要实现自动部署：

### 方法 1：通过 Cloudflare Dashboard（推荐）

1. 访问：https://dash.cloudflare.com/
2. Workers & Pages → cf-blogs → Settings
3. Builds & deployments → Connect to Git
4. 选择 GitHub → zhaomo08/cf_blogs
5. 配置：
   - Production branch: `master`
   - Build command: `npm run build`
   - Build output directory: `dist`
6. 保存

配置后，每次发布文章，Cloudflare 会自动构建和部署。

### 方法 2：手动部署

每次发布文章后，在本地运行：

```bash
git pull
npm run build
npx wrangler pages deploy dist --project-name=cf-blogs --branch=master --commit-dirty=true
```

## 📸 图片管理

### 上传到 R2（可选）

如果图片很大，可以上传到 R2：

```bash
# 上传图片
npx wrangler r2 object put cf-blogs-images/my-image.jpg --file ./my-image.jpg

# 查看已上传的图片
npx wrangler r2 object list cf-blogs-images
```

然后在文章中使用（需要先配置 R2 自定义域名）：
```markdown
![描述](https://images.yourdomain.com/my-image.jpg)
```

### 配置 R2 自定义域名

1. Cloudflare Dashboard → R2 → cf-blogs-images
2. Settings → Custom Domains → Connect Domain
3. 输入：`images.yourdomain.com`
4. 保存

## 🎯 工作流程

### 当前流程（手动部署）

```
写文章 → 管理后台发布 → 自动提交到 GitHub → 手动运行部署命令 → 网站更新
```

### 配置自动部署后

```
写文章 → 管理后台发布 → 自动提交到 GitHub → Cloudflare 自动部署 → 网站更新（1-2分钟）
```

## 💡 使用技巧

### 1. Markdown 语法

```markdown
# 一级标题
## 二级标题

**粗体** *斜体*

- 列表项 1
- 列表项 2

[链接文字](https://example.com)

![图片](https://example.com/image.jpg)

`代码`

​```javascript
代码块
​```
```

### 2. 草稿功能

- 勾选"草稿"可以保存未完成的文章
- 草稿不会在网站上显示
- 完成后取消勾选并发布

### 3. 标签管理

- 点击"标签"字段的"+"添加标签
- 标签用于文章分类
- 可以添加多个标签

## 🐛 常见问题

### Q: 发布后网站没有更新？

A: 需要配置自动部署或手动运行部署命令。

### Q: 图片上传失败？

A: 
- 检查图片大小（建议 < 5MB）
- 或者使用图片 URL 代替上传

### Q: 如何删除文章？

A: 
1. 在管理后台找到文章
2. 点击文章
3. 点击右上角的"删除"按钮

### Q: 如何编辑已发布的文章？

A:
1. 在管理后台找到文章
2. 点击文章标题
3. 编辑内容
4. 点击"发布"保存更改

## 📚 相关链接

- **管理后台**: https://cf-blogs-4j9.pages.dev/admin/
- **网站首页**: https://cf-blogs-4j9.pages.dev/zh/
- **GitHub 仓库**: https://github.com/zhaomo08/cf_blogs
- **Cloudflare Dashboard**: https://dash.cloudflare.com/
- **Markdown 语法**: https://www.markdownguide.org/

---

🎉 **开始写作吧！**
