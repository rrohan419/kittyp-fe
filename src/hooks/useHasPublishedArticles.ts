import { useEffect, useState } from 'react';
import { fetchArticles } from '@/services/articleService';

/**
 * Whether the public site has at least one published article (for nav visibility).
 */
export function useHasPublishedArticles(): boolean {
  const [hasPublished, setHasPublished] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetchArticles({
      page: 1,
      size: 1,
      body: {
        name: null,
        isRandom: null,
        articleStatus: 'PUBLISHED',
        tags: null,
        authorId: null,
      },
    })
      .then((response) => {
        if (cancelled) return;
        const models = response?.data?.models;
        setHasPublished(Array.isArray(models) && models.length > 0);
      })
      .catch(() => {
        if (!cancelled) setHasPublished(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return hasPublished;
}
