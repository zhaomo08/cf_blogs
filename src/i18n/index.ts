export const LANGUAGES = { zh: '中文', en: 'English' } as const;
export type Lang = keyof typeof LANGUAGES;
export const DEFAULT_LANG: Lang = 'zh';
export const SUPPORTED_LANGS = Object.keys(LANGUAGES) as Lang[];
