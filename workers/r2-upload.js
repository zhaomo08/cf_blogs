// Cloudflare Worker for R2 image uploads
// 处理 Decap CMS 的图片上传到 R2（带鉴权与上传限制）

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'image/avif',
]);

const ALLOWED_EXTENSIONS = new Set(['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg', 'avif']);
const authCache = new Map();

function parseCsv(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

function getAllowedOrigin(request, env) {
  const requestOrigin = request.headers.get('Origin');
  const allowedOrigins = parseCsv(env.ALLOWED_ORIGINS);
  if (!requestOrigin) return allowedOrigins[0] || '*';
  if (allowedOrigins.length === 0) return requestOrigin;
  return allowedOrigins.includes(requestOrigin) ? requestOrigin : '';
}

function buildCorsHeaders(request, env) {
  const origin = getAllowedOrigin(request, env);
  const headers = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (origin) headers['Access-Control-Allow-Origin'] = origin;
  return headers;
}

function jsonResponse(body, status, corsHeaders) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      'Content-Type': 'application/json',
    },
  });
}

function sanitizeFileName(name) {
  return String(name || '')
    .replace(/[^\w.-]/g, '_')
    .slice(0, 80);
}

async function requireUploadAuth(request, env) {
  const allowedLogins = parseCsv(env.ALLOWED_GITHUB_LOGINS).map((value) => value.toLowerCase());
  if (allowedLogins.length === 0) {
    throw new Error('Worker misconfigured: ALLOWED_GITHUB_LOGINS is empty');
  }

  const authHeader = request.headers.get('Authorization') || '';
  if (!authHeader.startsWith('Bearer ')) {
    return { ok: false, status: 401, error: 'Missing Bearer token' };
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) {
    return { ok: false, status: 401, error: 'Empty token' };
  }

  const cacheEntry = authCache.get(token);
  const now = Date.now();
  if (cacheEntry && cacheEntry.exp > now) {
    return cacheEntry.result;
  }

  const ghResp = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'cf-blogs-r2-upload',
    },
  });

  if (!ghResp.ok) {
    const result = { ok: false, status: 401, error: 'Invalid GitHub token' };
    authCache.set(token, { exp: now + 10_000, result });
    return result;
  }

  const profile = await ghResp.json();
  const login = String(profile?.login || '').toLowerCase();
  if (!login || !allowedLogins.includes(login)) {
    const result = { ok: false, status: 403, error: 'GitHub account is not allowed' };
    authCache.set(token, { exp: now + 10_000, result });
    return result;
  }

  const result = { ok: true, status: 200, login };
  authCache.set(token, { exp: now + 5 * 60_000, result });
  return result;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    const corsHeaders = buildCorsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    if (request.method === 'GET' && path === '/') {
      return jsonResponse(
        {
          ok: true,
          service: 'cf-blogs-r2',
          upload: `${url.origin}/upload`,
          maxUploadBytes: Number(env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024),
        },
        200,
        corsHeaders,
      );
    }

    // GET 请求 - 获取图片（公开读）
    if (request.method === 'GET' && path.startsWith('/images/')) {
      const key = path.slice(1);
      try {
        const object = await env.R2_BUCKET.get(key);
        if (!object) {
          return new Response('Image not found', { status: 404, headers: corsHeaders });
        }

        const headers = new Headers(corsHeaders);
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Cache-Control', 'public, max-age=31536000');
        return new Response(object.body, { headers });
      } catch (error) {
        return new Response('Error fetching image: ' + String(error?.message || error), {
          status: 500,
          headers: corsHeaders,
        });
      }
    }

    // POST 请求 - 上传图片（鉴权 + 限制）
    if (request.method === 'POST' && (path === '/upload' || path === '/upload/')) {
      try {
        const auth = await requireUploadAuth(request, env);
        if (!auth.ok) {
          return jsonResponse({ error: auth.error }, auth.status, corsHeaders);
        }

        const formData = await request.formData();
        const file = formData.get('file');
        if (!file || typeof file.stream !== 'function') {
          return jsonResponse({ error: 'No valid file provided' }, 400, corsHeaders);
        }

        const maxUploadBytes = Number(env.MAX_UPLOAD_BYTES || 10 * 1024 * 1024);
        if (!Number.isFinite(maxUploadBytes) || maxUploadBytes <= 0) {
          return jsonResponse({ error: 'Worker misconfigured: MAX_UPLOAD_BYTES invalid' }, 500, corsHeaders);
        }
        if (typeof file.size === 'number' && file.size > maxUploadBytes) {
          return jsonResponse({ error: `File too large (> ${maxUploadBytes} bytes)` }, 413, corsHeaders);
        }

        const fileType = String(file.type || '').toLowerCase();
        if (!ALLOWED_MIME_TYPES.has(fileType)) {
          return jsonResponse({ error: `Unsupported mime type: ${fileType || 'unknown'}` }, 415, corsHeaders);
        }

        const safeName = sanitizeFileName(file.name || 'upload.bin');
        const ext = safeName.includes('.') ? safeName.split('.').pop().toLowerCase() : '';
        if (!ALLOWED_EXTENSIONS.has(ext)) {
          return jsonResponse({ error: `Unsupported extension: ${ext || 'unknown'}` }, 415, corsHeaders);
        }

        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).slice(2, 8);
        const filename = `${timestamp}-${randomStr}.${ext}`;
        const key = `images/uploads/${filename}`;

        await env.R2_BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: fileType,
          },
        });

        const imageUrl = `${url.origin}/${key}`;
        return jsonResponse({ url: imageUrl, by: auth.login }, 200, corsHeaders);
      } catch (error) {
        return jsonResponse({ error: 'Upload error: ' + String(error?.message || error) }, 500, corsHeaders);
      }
    }

    return new Response('Not found', { status: 404, headers: corsHeaders });
  },
};
