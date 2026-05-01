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
      const redirectUri = url.searchParams.get('redirect_uri') || url.origin + '/admin/oauth';
      
      // 重定向到 GitHub OAuth 授权页面
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=repo,user`;
      
      return Response.redirect(githubAuthUrl, 302);
    }

    // OAuth 回调端点
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      
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

        // 返回访问令牌
        return new Response(JSON.stringify({
          token: tokenData.access_token,
          provider: 'github',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
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
