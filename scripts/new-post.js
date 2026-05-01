#!/usr/bin/env node

/**
 * 快速创建新博客文章的脚本
 * 
 * 使用方法：
 * node scripts/new-post.js
 * 
 * 或添加到 package.json scripts:
 * "new": "node scripts/new-post.js"
 * 然后运行: npm run new
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import readline from 'readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = join(__dirname, '..');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(prompt) {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

function getToday() {
  const now = new Date();
  return now.toISOString().split('T')[0];
}

async function main() {
  console.log('📝 创建新博客文章\n');

  // 1. 选择语言
  const lang = await question('语言 (zh/en) [zh]: ');
  const language = lang.trim() || 'zh';
  
  if (!['zh', 'en'].includes(language)) {
    console.error('❌ 语言必须是 zh 或 en');
    rl.close();
    return;
  }

  // 2. 输入标题
  const title = await question('文章标题: ');
  if (!title.trim()) {
    console.error('❌ 标题不能为空');
    rl.close();
    return;
  }

  // 3. 输入描述
  const description = await question('文章描述: ');
  if (!description.trim()) {
    console.error('❌ 描述不能为空');
    rl.close();
    return;
  }

  // 4. 输入标签（可选）
  const tagsInput = await question('标签 (用逗号分隔，可选): ');
  const tags = tagsInput.trim() 
    ? tagsInput.split(',').map(t => t.trim()).filter(Boolean)
    : [];

  // 5. 封面图（可选）
  const cover = await question('封面图 URL (可选): ');

  // 6. 拍摄地（可选）
  const hasLocation = await question('是否添加拍摄地? (y/n) [n]: ');
  let locationData = null;
  
  if (hasLocation.toLowerCase() === 'y') {
    const locationName = await question('地点名称: ');
    const lat = await question('纬度 (lat): ');
    const lng = await question('经度 (lng): ');
    
    if (locationName && lat && lng) {
      locationData = {
        name: locationName.trim(),
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      };
    }
  }

  rl.close();

  // 生成文件名
  const slug = slugify(title);
  const date = getToday();
  const filename = `${slug}.md`;
  const filepath = join(projectRoot, 'src', 'content', 'blog', language, filename);

  // 生成 frontmatter
  let frontmatter = `---
title: "${title.trim()}"
description: "${description.trim()}"
date: ${date}`;

  if (cover.trim()) {
    frontmatter += `\ncover: "${cover.trim()}"`;
  }

  if (tags.length > 0) {
    frontmatter += `\ntags: [${tags.map(t => `"${t}"`).join(', ')}]`;
  }

  frontmatter += `\ndraft: false`;

  if (locationData) {
    frontmatter += `\nlocation:
  name: "${locationData.name}"
  lat: ${locationData.lat}
  lng: ${locationData.lng}`;
  }

  frontmatter += `\n---\n\n`;

  // 生成文章内容模板
  const content = `${frontmatter}## 开始写作

在这里写下你的内容...

### 小标题

段落内容。

![图片描述](图片URL)

### 另一个小标题

更多内容...

---

> 提示：使用 Markdown 语法编写文章。查看 README.md 了解更多。
`;

  // 确保目录存在
  mkdirSync(dirname(filepath), { recursive: true });

  // 写入文件
  writeFileSync(filepath, content, 'utf-8');

  console.log('\n✅ 文章创建成功！');
  console.log(`📄 文件位置: ${filepath}`);
  console.log(`🔗 URL: /${language}/blog/${slug}`);
  console.log('\n💡 下一步:');
  console.log('1. 编辑文章内容');
  console.log('2. 运行 npm run dev 预览');
  console.log('3. 运行 git add . && git commit -m "feat: add new post" && git push 发布');
}

main().catch(console.error);
