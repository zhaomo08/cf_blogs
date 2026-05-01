# ✍️ 纯 Markdown 编辑指南

## 方案 1：直接在 GitHub 上编辑（最简单）

### 步骤：

1. **访问你的 GitHub 仓库**
   https://github.com/zhaomo08/cf_blogs

2. **进入文章目录**
   点击：`src/content/blog/zh/`

3. **创建新文章**
   - 点击 **Add file** → **Create new file**
   - 文件名：`2026-05-02-my-article.md`
   - 直接写 Markdown：

```markdown
---
title: "我的文章标题"
description: "文章描述"
date: 2026-05-02
tags: [科技, AI, 编程]
cover: "https://图床链接/image.jpg"
draft: false
---

# 这是标题

这是正文内容...

![图片](https://图床链接/image.jpg)

## 二级标题

更多内容...
```

4. **提交**
   - 点击 **Commit changes**
   - Cloudflare Pages 自动部署
   - 1-2 分钟后网站更新

---

## 方案 2：使用 GitHub.dev（在线 VS Code）

### 步骤：

1. **访问仓库**
   https://github.com/zhaomo08/cf_blogs

2. **按键盘 `.` 键**
   - 自动打开 GitHub.dev（在线 VS Code）
   - 或者访问：https://github.dev/zhaomo08/cf_blogs

3. **创建/编辑文章**
   - 左侧文件树：`src/content/blog/zh/`
   - 右键 → New File
   - 直接写 Markdown，有语法高亮和预览

4. **提交**
   - 左侧 Source Control 图标
   - 输入提交信息
   - 点击 ✓ 提交
   - 自动触发部署

---

## 方案 3：本地 VS Code 编辑（最强大）

### 步骤：

1. **克隆仓库**
```bash
git clone https://github.com/zhaomo08/cf_blogs.git
cd cf_blogs
```

2. **用 VS Code 打开**
```bash
code .
```

3. **创建文章**
   - 在 `src/content/blog/zh/` 创建新文件
   - 直接写 Markdown

4. **提交并推送**
```bash
git add .
git commit -m "新文章：标题"
git push
```

5. **自动部署**
   - Cloudflare Pages 检测到更新
   - 自动构建和部署

---

## 方案 4：使用脚本快速创建（推荐）

我已经为你创建了一个脚本：`scripts/new-post.js`

### 使用方法：

```bash
npm run new
```

然后按提示输入：
- 标题
- 描述
- 标签（用逗号分隔，如：科技,AI,编程）

脚本会自动创建文件，你只需要编辑正文内容。

---

## Markdown 文章模板

```markdown
---
title: "文章标题"
description: "文章简短描述"
date: 2026-05-02
tags: [科技, AI, 编程]
cover: "https://图床链接/封面图.jpg"
draft: false
---

# 主标题

文章正文内容...

## 二级标题

更多内容...

### 三级标题

- 列表项 1
- 列表项 2

**粗体文字**

*斜体文字*

[链接文字](https://example.com)

![图片描述](https://图床链接/image.jpg)

\`\`\`javascript
// 代码块
console.log('Hello World');
\`\`\`

> 引用文字
```

---

## 标签使用示例

在 frontmatter 中：

```yaml
tags: [科技, AI, 编程, Web开发, Cloudflare]
```

或者：

```yaml
tags:
  - 科技
  - AI
  - 编程
```

---

## 图片使用

### 方式 1：使用图床（推荐）

```markdown
![图片描述](https://imgur.com/xxx.jpg)
```

### 方式 2：使用 R2

1. 上传图片到 R2：
```bash
npx wrangler r2 object put cf-blogs-images/images/my-photo.jpg --file ./my-photo.jpg
```

2. 在文章中使用：
```markdown
![图片描述](https://pub-你的ID.r2.dev/images/my-photo.jpg)
```

### 方式 3：使用本地图片（小图片）

```markdown
![图片描述](/images/uploads/photo.jpg)
```

然后把图片放到 `public/images/uploads/` 目录。

---

## 推荐工作流程

### 日常写作：

1. **GitHub.dev**（按 `.` 键）
   - 快速编辑
   - 在线预览
   - 直接提交

2. **本地 VS Code**（长文章）
   - 更强大的编辑功能
   - 离线工作
   - 更好的性能

### 快速发布：

1. **GitHub Web 编辑器**
   - 最快速
   - 无需本地环境
   - 适合小修改

---

## 当前 Decap CMS 配置

我已经简化了 Decap CMS，现在只有：
- 标题（必填）
- 日期（必填）
- 正文（Markdown 编辑器）

其他字段（tags, cover, description）可以直接在 Markdown 正文开头的 frontmatter 中添加。

但如果你想要**完全的 Markdown 体验**，建议使用上面的方案 1-3。
