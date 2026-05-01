import type { APIRoute } from 'astro';
import { SUPPORTED_LANGS } from '../../i18n/index';

export function getStaticPaths() {
  return SUPPORTED_LANGS.map((lang) => ({ params: { lang } }));
}

export const GET: APIRoute = async () =>
  new Response(null, {
    status: 301,
    headers: { Location: '/rss.xml' },
  });
