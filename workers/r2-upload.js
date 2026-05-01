// Cloudflare Worker for R2 image uploads
// 处理 Decap CMS 的图片上传到 R2

export default {
  async fetch(request, env) {
    // CORS 预检请求
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    // GET 请求 - 获取图片
    if (request.method === 'GET' && path.startsWith('/images/')) {
      const key = path.slice(1); // 移除开头的 /
      
      try {
        const object = await env.R2_BUCKET.get(key);
        
        if (!object) {
          return new Response('Image not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('Access-Control-Allow-Origin', '*');
        headers.set('Cache-Control', 'public, max-age=31536000'); // 缓存 1 年

        return new Response(object.body, { headers });
      } catch (error) {
        return new Response('Error fetching image: ' + error.message, { status: 500 });
      }
    }

    // POST 请求 - 上传图片
    if (request.method === 'POST' && path === '/upload') {
      try {
        const formData = await request.formData();
        const file = formData.get('file');
        
        if (!file) {
          return new Response('No file provided', { status: 400 });
        }

        // 生成唯一文件名
        const timestamp = Date.now();
        const randomStr = Math.random().toString(36).substring(2, 8);
        const ext = file.name.split('.').pop();
        const filename = `${timestamp}-${randomStr}.${ext}`;
        const key = `images/uploads/${filename}`;

        // 上传到 R2
        await env.R2_BUCKET.put(key, file.stream(), {
          httpMetadata: {
            contentType: file.type,
          },
        });

        // 返回图片 URL
        const imageUrl = `https://r2.zhaomo0823.workers.dev/${key}`;
        
        return new Response(JSON.stringify({ url: imageUrl }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        });
      } catch (error) {
        return new Response('Upload error: ' + error.message, { 
          status: 500,
          headers: {
            'Access-Control-Allow-Origin': '*',
          },
        });
      }
    }

    return new Response('Not found', { status: 404 });
  },
};
