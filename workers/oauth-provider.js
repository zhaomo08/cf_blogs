/**
 * Cloudflare Worker for Decap CMS GitHub OAuth
 * 
 * 部署方法：
 * 1. 在 Cloudflare Dashboard 创建新 Worker
 * 2. 复制此代码到 Worker 编辑器
 * 3. 添加环境变量：
 *    - OAUTH_CLIENT_ID: GitHub OAuth App Client ID
 *    - OAUTH_CLIENT_SECRET: GitHub OAuth App Client Secret
 * 4. 部署
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // 处理 CORS
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // OAuth 认证端点
    if (url.pathname === '/auth') {
      const clientId = env.OAUTH_CLIENT_ID;
      // 使用 Worker 自己的回调 URL
      const callbackUrl = `${url.origin}/callback`;
      
      // 保存原始的 redirect_uri 用于后续重定向
      const originalRedirect = url.searchParams.get('redirect_uri') || 'https://cf-blogs-4j9.pages.dev/admin/';
      
      // 重定向到 GitHub OAuth 授权页面
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo,user&state=${encodeURIComponent(originalRedirect)}`;
      
      return Response.redirect(githubAuthUrl, 302);
    }

    // OAuth 回调端点
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state') || 'https://cf-blogs-4j9.pages.dev/admin/';
      
      if (!code) {
        return new Response('Missing code parameter', { status: 400 });
      }

      try {
        // 用授权码换取访问令牌
        const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          body: JSON.stringify({
            client_id: env.OAUTH_CLIENT_ID,
            client_secret: env.OAUTH_CLIENT_SECRET,
            code: code,
          }),
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          return new Response(JSON.stringify({ error: tokenData.error }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // 构建回调 HTML，将 token 传递给 Decap CMS
        const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Authorization Success</title>
</head>
<body>
  <p>Authorization successful! Redirecting...</p>
  <script>
    (function() {
      function receiveMessage(e) {
        console.log("receiveMessage %o", e);
        window.opener.postMessage(
          'authorization:github:success:' + JSON.stringify({
            token: "${tokenData.access_token}",
            provider: "github"
          }),
          e.origin
        );
      }
      window.addEventListener("message", receiveMessage, false);
      window.opener.postMessage("authorizing:github", "*");
    })();
  </script>
</body>
</html>
        `;

        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 健康检查
    if (url.pathname === '/') {
      return new Response('Decap CMS OAuth Provider is running', {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
