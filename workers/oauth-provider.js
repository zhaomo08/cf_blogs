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

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getRequestOrigin(request) {
  const origin = request.headers.get('Origin');
  if (origin) return origin;
  const referer = request.headers.get('Referer');
  if (!referer) return '';
  try {
    return new URL(referer).origin;
  } catch (_) {
    return '';
  }
}

function isAllowedOrigin(origin, allowedOrigins) {
  if (!origin) return false;
  if (allowedOrigins.length === 0) return false;
  return allowedOrigins.includes(origin);
}

function buildCorsHeaders(request, env) {
  const allowedOrigins = parseCsv(env.ALLOWED_ORIGINS);
  const origin = getRequestOrigin(request);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
  if (isAllowedOrigin(origin, allowedOrigins)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function toBase64Url(input) {
  const bytes = typeof input === 'string' ? new TextEncoder().encode(input) : input;
  let binary = '';
  for (let i = 0; i < bytes.length; i += 1) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function fromBase64Url(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padding = normalized.length % 4 === 0 ? '' : '='.repeat(4 - (normalized.length % 4));
  const binary = atob(normalized + padding);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function signState(payload, secret) {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const payloadBytes = new TextEncoder().encode(payload);
  const sigBytes = await crypto.subtle.sign('HMAC', key, payloadBytes);
  return toBase64Url(new Uint8Array(sigBytes));
}

async function createSignedState(redirectUri, secret) {
  const payload = JSON.stringify({
    redirectUri,
    nonce: crypto.randomUUID(),
    iat: Date.now(),
  });
  const payloadBase64 = toBase64Url(payload);
  const sig = await signState(payloadBase64, secret);
  return `${payloadBase64}.${sig}`;
}

async function verifySignedState(rawState, secret, maxAgeMs) {
  if (!rawState || !rawState.includes('.')) return null;
  const [payloadBase64, signature] = rawState.split('.', 2);
  if (!payloadBase64 || !signature) return null;
  const expected = await signState(payloadBase64, secret);
  if (expected !== signature) return null;

  let payload = null;
  try {
    payload = JSON.parse(new TextDecoder().decode(fromBase64Url(payloadBase64)));
  } catch (_) {
    return null;
  }
  if (!payload || typeof payload !== 'object') return null;
  if (typeof payload.redirectUri !== 'string') return null;
  if (typeof payload.iat !== 'number') return null;
  if (Date.now() - payload.iat > maxAgeMs) return null;
  return payload;
}

function buildAllowedRedirect(redirectUri, env) {
  const allowOrigins = parseCsv(env.ALLOWED_REDIRECT_ORIGINS);
  if (!redirectUri) return null;
  try {
    const parsed = new URL(redirectUri);
    if (!['http:', 'https:'].includes(parsed.protocol)) return null;
    if (!allowOrigins.includes(parsed.origin)) return null;
    return parsed.toString();
  } catch (_) {
    return null;
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const corsHeaders = buildCorsHeaders(request, env);

    // 处理 OPTIONS 请求
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // OAuth 认证端点
    if (url.pathname === '/auth') {
      const clientId = env.OAUTH_CLIENT_ID;
      const stateSecret = env.OAUTH_STATE_SECRET;
      if (!clientId || !stateSecret) {
        return new Response('OAuth worker misconfigured', { status: 500, headers: corsHeaders });
      }

      // 使用 Worker 自己的回调 URL
      const callbackUrl = `${url.origin}/callback`;

      // 保存原始的 redirect_uri 用于后续重定向，并做来源白名单校验
      const requestedRedirect = url.searchParams.get('redirect_uri') || 'https://cf-blogs-4j9.pages.dev/admin/';
      const safeRedirect = buildAllowedRedirect(requestedRedirect, env);
      if (!safeRedirect) {
        return new Response('Invalid redirect_uri', { status: 400, headers: corsHeaders });
      }

      const signedState = await createSignedState(safeRedirect, stateSecret);

      // 重定向到 GitHub OAuth 授权页面
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(callbackUrl)}&scope=repo,user&state=${encodeURIComponent(signedState)}`;
      
      return Response.redirect(githubAuthUrl, 302);
    }

    // OAuth 回调端点
    if (url.pathname === '/callback') {
      const code = url.searchParams.get('code');
      const rawState = url.searchParams.get('state') || '';
      
      if (!code) {
        return new Response('Missing code parameter', { status: 400, headers: corsHeaders });
      }

      try {
        const stateSecret = env.OAUTH_STATE_SECRET;
        if (!stateSecret) {
          return new Response('OAuth worker misconfigured', { status: 500, headers: corsHeaders });
        }
        const payload = await verifySignedState(rawState, stateSecret, 10 * 60 * 1000);
        if (!payload) {
          return new Response('Invalid or expired oauth state', { status: 400, headers: corsHeaders });
        }
        const safeRedirect = buildAllowedRedirect(payload.redirectUri, env);
        if (!safeRedirect) {
          return new Response('Invalid state redirect target', { status: 400, headers: corsHeaders });
        }
        const redirectOrigin = new URL(safeRedirect).origin;

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
      var targetOrigin = ${JSON.stringify(redirectOrigin)};
      var payload = 'authorization:github:success:' + JSON.stringify({
        token: ${JSON.stringify(tokenData.access_token)},
        provider: "github"
      });
      if (window.opener) {
        window.opener.postMessage("authorizing:github", targetOrigin);
        window.opener.postMessage(payload, targetOrigin);
      }
      setTimeout(function() {
        window.location.href = ${JSON.stringify(safeRedirect)};
      }, 80);
    })();
  </script>
</body>
</html>
        `;

        return new Response(html, {
          headers: { ...corsHeaders, 'Content-Type': 'text/html' },
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: String(error?.message || error) }), {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }

    // 健康检查
    if (url.pathname === '/') {
      return new Response('Decap CMS OAuth Provider is running (hardened)', {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' },
      });
    }

    return new Response('Not Found', { status: 404, headers: corsHeaders });
  },
};
