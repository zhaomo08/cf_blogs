# 📝 博客写作指南

## 快速开始

### 1. 创建新文章

在对应语言的目录下创建 `.md` 文件：

```bash
# 中文文章
src/content/blog/zh/文章名称.md

# 英文文章
src/content/blog/en/article-name.md
```

### 2. 文章模板

每篇文章包含两部分：**Frontmatter（元数据）** + **正文内容**

```markdown
---
title: "文章标题"
description: "文章简介，会显示在文章卡片和 SEO meta 中"
date: 2026-05-01
cover: "https://example.com/image.jpg"  # 可选：封面图
tags: ["标签1", "标签2"]                 # 可选：文章标签
draft: false                             # 可选：是否为草稿（true 不会发布）
location:                                # 可选：拍摄地信息
  name: "北京，中国"
  lat: 39.9042
  lng: 116.4074
---

## 这里开始写正文

使用 Markdown 语法写作...
```

## Frontmatter 字段说明

| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| `title` | 字符串 | ✅ | 文章标题 |
| `description` | 字符串 | ✅ | 文章简介（用于 SEO 和卡片展示） |
| `date` | 日期 | ✅ | 发布日期（格式：YYYY-MM-DD） |
| `cover` | URL | ❌ | 封面图片 URL |
| `tags` | 数组 | ❌ | 文章标签 |
| `draft` | 布尔值 | ❌ | 是否为草稿（默认 false） |
| `location` | 对象 | ❌ | 拍摄地信息（包含 name, lat, lng） |

## Markdown 语法示例

### 标题

```markdown
## 二级标题
### 三级标题
#### 四级标题
```

### 文本格式

```markdown
**粗体文字**
*斜体文字*
~~删除线~~
`行内代码`
```

### 列表

```markdown
- 无序列表项 1
- 无序列表项 2

1. 有序列表项 1
2. 有序列表项 2
```

### 链接和图片

```markdown
[链接文字](https://example.com)

![图片描述](https://example.com/image.jpg)
```

### 引用

```markdown
> 这是一段引用文字
```

### 代码块

````markdown
```javascript
function hello() {
  console.log("Hello, World!");
}
```
````

### 表格

```markdown
| 列1 | 列2 | 列3 |
|-----|-----|-----|
| 内容1 | 内容2 | 内容3 |
```

## 图片使用建议

### 1. 使用在线图片服务

推荐使用：
- **Unsplash**：https://unsplash.com （免费高质量图片）
- **Cloudflare R2**：上传到自己的 R2 存储桶
- **其他 CDN**：任何支持 HTTPS 的图片 URL

### 2. 图片 URL 格式

```markdown
# 封面图（在 frontmatter 中）
cover: "https://images.unsplash.com/photo-xxx?w=800"

# 正文图片
![图片描述](https://images.unsplash.com/photo-xxx?w=800)
```

### 3. 优化建议

- 使用 `?w=800` 参数控制图片宽度
- 封面图建议尺寸：1200x630 或 16:9 比例
- 正文图片建议宽度：800-1200px

## 拍摄地地图功能

如果文章包含拍摄地信息，会在文章底部显示地图：

```markdown
---
location:
  name: "东京塔，日本"
  lat: 35.6586
  lng: 139.7454
---
```

### 如何获取经纬度？

1. 打开 [Google Maps](https://www.google.com/maps)
2. 右键点击地图上的位置
3. 点击坐标数字即可复制（格式：纬度, 经度）

## 草稿功能

写作中的文章可以设置为草稿：

```markdown
---
title: "未完成的文章"
draft: true
---
```

草稿不会在网站上显示，但可以在本地预览。

## 发布流程

### 1. 本地预览

```bash
npm run dev
```

访问 http://localhost:4321 查看效果

### 2. 构建测试

```bash
npm run build
npm run preview
```

### 3. 提交发布

```bash
git add .
git commit -m "feat: add new blog post"
git push
```

推送到 GitHub 后，Cloudflare Pages 会自动构建和部署。

## 多语言文章

如果要发布双语文章：

1. 在 `src/content/blog/zh/` 创建中文版
2. 在 `src/content/blog/en/` 创建英文版
3. 使用相同的文件名（如 `my-post.md`）

系统会自动在文章页面显示语言切换按钮。

## 常见问题

### Q: 图片不显示？
A: 检查图片 URL 是否正确，必须是 HTTPS 协议。

### Q: 文章不显示？
A: 检查 `draft: false` 且 frontmatter 格式正确。

### Q: 日期格式错误？
A: 使用 `YYYY-MM-DD` 格式，如 `2026-05-01`。

### Q: 地图不显示？
A: 检查经纬度范围（纬度 -90~90，经度 -180~180）。

## 示例文章

查看 `src/content/blog/zh/my-first-post.md` 获取完整示例。

---

Happy blogging! 🎉
