#!/usr/bin/env node
// 自动为没有日期的文章添加当前日期

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const blogDir = path.join(__dirname, '../src/content/blog/zh');

// 获取所有 .md 文件
const files = fs.readdirSync(blogDir).filter(f => f.endsWith('.md'));

files.forEach(file => {
  const filePath = path.join(blogDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  
  // 检查是否有 frontmatter
  if (content.startsWith('---')) {
    const parts = content.split('---');
    if (parts.length >= 3) {
      const frontmatter = parts[1];
      
      // 检查是否已有 date 字段
      if (!frontmatter.includes('date:') || frontmatter.includes('date: "{{now}}"')) {
        // 获取当前日期
        const today = new Date().toISOString().split('T')[0];
        
        // 移除错误的 date 行
        let newFrontmatter = frontmatter
          .split('\n')
          .filter(line => !line.includes('date:'))
          .join('\n');
        
        // 添加正确的 date
        newFrontmatter = newFrontmatter.trim() + `\ndate: ${today}\n`;
        
        // 重新组合内容
        content = `---\n${newFrontmatter}---${parts.slice(2).join('---')}`;
        
        // 写回文件
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`✅ 已为 ${file} 添加日期: ${today}`);
      }
    }
  }
});

console.log('✅ 完成！');
