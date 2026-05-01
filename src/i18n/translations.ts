import type { Lang } from './index';
import { DEFAULT_LANG, SUPPORTED_LANGS } from './index';

const ui = {
  zh: {
    'nav.home': '首页',
    'nav.search': '搜索',
    'nav.rss': '订阅',
    'post.tags': '标签',
    'post.location': '拍摄地',
    'post.back': '← 返回',
    'post.prev': '上一篇',
    'post.next': '下一篇',
    'search.title': '搜索',
    'search.placeholder': '搜索文章...',
    'footer.rights': '版权所有',
  },
  en: {
    'nav.home': 'Home',
    'nav.search': 'Search',
    'nav.rss': 'RSS',
    'post.tags': 'Tags',
    'post.location': 'Location',
    'post.back': '← Back',
    'post.prev': 'Previous',
    'post.next': 'Next',
    'search.title': 'Search',
    'search.placeholder': 'Search posts...',
    'footer.rights': 'All rights reserved',
  },
} as const;

export type TranslationKey = keyof typeof ui['zh'];

export function t(lang: Lang, key: TranslationKey): string {
  return ui[lang][key] ?? ui[DEFAULT_LANG][key] ?? key;
}

export function getLangFromUrl(url: URL): Lang {
  const first = url.pathname.split('/').filter(Boolean)[0];
  return SUPPORTED_LANGS.includes(first as Lang) ? (first as Lang) : DEFAULT_LANG;
}

export function getAlternateUrl(url: URL, targetLang: Lang): string {
  const segments = url.pathname.split('/').filter(Boolean);
  if (SUPPORTED_LANGS.includes(segments[0] as Lang)) {
    segments[0] = targetLang;
  } else {
    segments.unshift(targetLang);
  }
  return '/' + segments.join('/');
}
