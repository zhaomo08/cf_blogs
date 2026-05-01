import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { SUPPORTED_LANGS, type Lang } from '../../i18n/index';

export function getStaticPaths() {
  return SUPPORTED_LANGS.map(lang => ({ params: { lang } }));
}

export const GET: APIRoute = async ({ params, site }) => {
  const lang = params.lang as Lang;

  const posts = await getCollection('blog', ({ id, data }) =>
    id.startsWith(`${lang}/`) && !data.draft
  );

  const sorted = [...posts].sort((a, b) => b.data.date.valueOf() - a.data.date.valueOf());

  return rss({
    title: lang === 'zh' ? '我的博客' : 'My Blog',
    description: lang === 'zh' ? '图文博客，记录生活与旅行' : 'Photo blog documenting life and travel',
    site: site!.toString(),
    items: sorted.map(post => ({
      title: post.data.title,
      description: post.data.description,
      pubDate: post.data.date,
      link: `/${lang}/blog/${post.id.split('/').slice(1).join('/')}`,
      ...(post.data.cover ? { enclosure: { url: post.data.cover, length: 0, type: 'image/jpeg' } } : {}),
    })),
    customData: `<language>${lang === 'zh' ? 'zh-CN' : 'en-US'}</language>`,
  });
};
