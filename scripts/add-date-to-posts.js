#!/usr/bin/env node
// 自动为没有日期的文章添加当前日期

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogRoot = path.join(__dirname, '../src/content/blog');
const langDirs = ['zh', 'en'].map((lang) => path.join(blogRoot, lang));

function addDateIfMissing(filePath) {
  let content = fs.readFileSync(filePath, 'utf-8');
  if (!content.startsWith('---')) return;

  const parts = content.split('---');
  if (parts.length < 3) return;

  const frontmatter = parts[1];
  if (frontmatter.includes('date:') && !frontmatter.includes('date: "{{now}}"')) return;

  const now = new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
  let newFrontmatter = frontmatter
    .split('\n')
    .filter((line) => !line.trim().startsWith('date:'))
    .join('\n');
  newFrontmatter = `${newFrontmatter.trim()}\ndate: ${now}\n`;
  content = `---\n${newFrontmatter}---${parts.slice(2).join('---')}`;

  fs.writeFileSync(filePath, content, 'utf-8');
  console.log(`✅ 已为 ${path.basename(filePath)} 添加日期: ${now}`);
}

langDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.md'));
  files.forEach((file) => addDateIfMissing(path.join(dir, file)));
});

console.log('✅ 完成！');
