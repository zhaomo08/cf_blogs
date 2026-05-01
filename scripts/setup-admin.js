#!/usr/bin/env node

/**
 * 管理后台快速设置脚本
 * 
 * 使用方法：
 * node scripts/setup-admin.js
 */

import { readFileSync, writeFileSync } from 'fs';
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

async function main() {
  console.log('🎛️  Decap CMS 管理后台设置向导\n');

  // 1. 选择配置方式
  console.log('请选择配置方式：');
  console.log('1. GitHub OAuth（推荐，功能完整）');
  console.log('2. Netlify Identity（最简单，但需要 Netlify 账号）');
  console.log('3. 本地开发模式（仅用于测试）\n');

  const choice = await question('请输入选项 (1/2/3) [1]: ');
  const mode = choice.trim() || '1';

  const configPath = join(projectRoot, 'public', 'admin', 'config.yml');
  let config = readFileSync(configPath, 'utf-8');

  if (mode === '1') {
    // GitHub OAuth 模式
    console.log('\n📝 GitHub OAuth 配置\n');
    
    const repo = await question('GitHub 仓库 (格式: username/repo): ');
    if (!repo.includes('/')) {
      console.error('❌ 仓库格式错误，应为 username/repo');
      rl.close();
      return;
    }

    const branch = await question('分支名称 [main]: ');
    const branchName = branch.trim() || 'main';

    const oauthUrl = await question('OAuth Worker URL (可选，稍后配置): ');

    // 更新配置
    config = config.replace(
      /repo: YOUR_GITHUB_USERNAME\/YOUR_REPO_NAME/,
      `repo: ${repo}`
    );
    config = config.replace(
      /branch: main/,
      `branch: ${branchName}`
    );

    if (oauthUrl.trim()) {
      config = config.replace(
        /# base_url: .*/,
        `base_url: ${oauthUrl.trim()}`
      );
      config = config.replace(
        /# auth_endpoint: .*/,
        `auth_endpoint: auth`
      );
    }

    writeFileSync(configPath, config, 'utf-8');

    console.log('\n✅ 配置已更新！');
    console.log('\n📋 下一步：');
    console.log('1. 创建 GitHub OAuth App：https://github.com/settings/developers');
    console.log('2. 部署 OAuth Worker（参考 README.md）');
    console.log('3. 访问 https://yourdomain.com/admin/ 登录');

  } else if (mode === '2') {
    // Netlify Identity 模式
    console.log('\n📝 Netlify Identity 配置\n');
    console.log('使用 Netlify Identity 需要：');
    console.log('1. 在 Netlify 上部署你的站点');
    console.log('2. 启用 Netlify Identity');
    console.log('3. 启用 Git Gateway\n');

    const confirm = await question('是否切换到 Netlify 配置? (y/n) [y]: ');
    if (confirm.toLowerCase() !== 'n') {
      const netlifyConfig = readFileSync(
        join(projectRoot, 'public', 'admin', 'config-netlify.yml'),
        'utf-8'
      );
      writeFileSync(configPath, netlifyConfig, 'utf-8');

      console.log('\n✅ 已切换到 Netlify Identity 配置！');
      console.log('\n📋 下一步：');
      console.log('1. 在 Netlify 上部署站点');
      console.log('2. 启用 Identity：Site settings → Identity → Enable Identity');
      console.log('3. 启用 Git Gateway：Identity → Services → Git Gateway');
      console.log('4. 邀请用户：Identity → Invite users');
      console.log('5. 访问 https://yourdomain.com/admin/ 登录');
    }

  } else if (mode === '3') {
    // 本地开发模式
    console.log('\n📝 本地开发模式\n');

    config = config.replace(
      /# local_backend: true/,
      'local_backend: true'
    );

    writeFileSync(configPath, config, 'utf-8');

    console.log('✅ 已启用本地开发模式！');
    console.log('\n📋 使用方法：');
    console.log('1. 运行: npx decap-server');
    console.log('2. 运行: npm run dev');
    console.log('3. 访问: http://localhost:4321/admin/');
    console.log('\n⚠️  注意：本地模式仅用于测试，不需要 GitHub 认证');
  }

  rl.close();
}

main().catch(console.error);
