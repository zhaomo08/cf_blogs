#!/usr/bin/env node
// 自动为没有日期的文章添加当前日期

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogRoot = path.join(__dirname, '../src/content/blog');

function collectMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];

  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];

  entries.forEach((entry) => {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectMarkdownFiles(fullPath));
      return;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      files.push(fullPath);
    }
  });

  return files;
}

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

collectMarkdownFiles(blogRoot).forEach((filePath) => addDateIfMissing(filePath));

console.log('✅ 完成！');
