const ARTICLE_RETURN_PATHS = [
  '/admin/articles',
  '/clinic/blog',
  '/doctor/blog',
  '/app/articles',
  '/articles',
] as const;

export type ArticleLocationState = {
  from?: string;
};

export function resolveArticleBackPath(from: unknown): string {
  if (typeof from !== 'string') return '/articles';
  const path = from.split('?')[0];
  return (ARTICLE_RETURN_PATHS as readonly string[]).includes(path) ? path : '/articles';
}

export function articleBackLabel(path: string): string {
  if (path.startsWith('/admin')) return 'Back to Article Management';
  if (path.includes('/blog')) return 'Back to Blog';
  return 'Back to Articles';
}
