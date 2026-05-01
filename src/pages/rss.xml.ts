import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const posts = await getCollection('blog', ({ data }) => !data.draft);
  const sorted = [...posts].sort((a, b) => {
    const aTs = a.data.date ? a.data.date.valueOf() : 0;
    const bTs = b.data.date ? b.data.date.valueOf() : 0;
    return bTs - aTs;
  });

  return rss({
    title: '我的博客',
    description: '图文博客，记录生活与旅行',
    site: site!.toString(),
    items: sorted.map((post) => ({
      title: post.data.title,
      description: post.data.description ?? '',
      pubDate: post.data.date ?? new Date(0),
      link: `/blog/${post.id.split('/').map((segment) => encodeURIComponent(segment)).join('/')}`,
      ...(post.data.cover ? { enclosure: { url: post.data.cover, length: 0, type: 'image/jpeg' } } : {}),
    })),
    customData: '<language>zh-CN</language>',
  });
};
