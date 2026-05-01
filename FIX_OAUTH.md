# 🔧 修复 OAuth 登录问题

## 问题

GitHub OAuth 回调 URL 配置不匹配。

## 解决方案

### 步骤 1：更新 GitHub OAuth App

1. 访问：https://github.com/settings/developers
2. 找到你的 OAuth App（应该叫 `CF Blogs Admin`）
3. 点击应用名称进入编辑
4. 找到 **Authorization callback URL**
5. 将其改为：
   ```
   https://cf-blogs-oauth.zhaomo0823.workers.dev/callback
   ```
6. 点击 **Update application**

### 步骤 2：验证配置

访问：https://cf-blogs-4j9.pages.dev/admin/

点击 "Login with GitHub"，应该可以正常登录了。

## 如果还是不行

### 备选方案：使用 Netlify Identity

这是最简单的方案，无需配置 OAuth Worker。

#### 1. 在 Netlify 部署站点

1. 访问：https://app.netlify.com/
2. 点击 "Add new site" → "Import an existing project"
3. 选择 GitHub，授权并选择 `zhaomo08/cf_blogs`
4. 构建设置：
   - Build command: `npm run build`
   - Publish directory: `dist`
5. 点击 "Deploy site"

#### 2. 启用 Identity

1. 站点部署后，进入 Settings → Identity
2. 点击 "Enable Identity"
3. 在 Registration 中选择 "Invite only"
4. 在 Services 中启用 "Git Gateway"

#### 3. 邀请自己

1. Identity → Invite users
2. 输入你的邮箱
3. 查收邮件并设置密码

#### 4. 更新配置

编辑 `public/admin/config.yml`：

```yaml
backend:
  name: git-gateway
  branch: master

# 其他配置保持不变...
```

提交并推送：
```bash
git add public/admin/config.yml
git commit -m "chore: switch to Netlify Identity"
git push
```

等待 Netlify 重新部署，然后访问 `/admin/` 用邮箱登录。

## 推荐方案

**使用 Netlify Identity** 更简单可靠，无需配置 OAuth Worker。

---

## 当前配置信息

- **OAuth Worker**: https://cf-blogs-oauth.zhaomo0823.workers.dev
- **Pages URL**: https://cf-blogs-4j9.pages.dev
- **管理后台**: https://cf-blogs-4j9.pages.dev/admin/
- **GitHub 仓库**: https://github.com/zhaomo08/cf_blogs

---

## 需要帮助？

如果以上方案都不行，可以：

1. 删除当前的 GitHub OAuth App
2. 重新创建一个新的
3. 使用正确的回调 URL：`https://cf-blogs-oauth.zhaomo0823.workers.dev/callback`
