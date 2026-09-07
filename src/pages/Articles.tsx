import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import { Avatar } from '@/components/ui/avatar';
import { CalendarIcon, Clock, FileText, RefreshCw, Tag } from 'lucide-react';
import { formatDistance } from 'date-fns';
import { fetchArticles } from '@/services/articleService';
import { ArticleList } from './Interface/PagesInterface';

const Articles: React.FC = () => {
  const [searchParams] = useSearchParams();
  const authorIdParam = searchParams.get('authorId');
  const authorId = authorIdParam ? Number(authorIdParam) : null;
  const [articles, setArticles] = useState<ArticleList[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  const loadArticles = useCallback(async () => {
    if (!hasMore || isLoadingMore) return;
    setIsLoadingMore(true);
    setError(null);
    try {
      const response = await fetchArticles({
        page,
        size: 6,
        body: {
          name: null,
          isRandom: null,
          articleStatus: 'PUBLISHED',
          tags: null,
          authorId: authorId && !Number.isNaN(authorId) ? authorId : null,
        },
      });

      const newArticles = response.data.models;
      setArticles(prev => [...prev, ...newArticles]);
      setHasMore(!response.data.isLast);
    } catch (err) {
      console.error('Error loading articles:', err);
      setError('We could not load articles right now. Please try again.');
    } finally {
      setIsLoadingMore(false);
      setInitialLoading(false);
    }
  }, [page, hasMore, isLoadingMore, authorId]);

  // Reset when authorId changes.
  useEffect(() => {
    setArticles([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    setError(null);
  }, [authorId]);

  useEffect(() => {
    loadArticles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, authorId]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !isLoadingMore) {
        setPage(prev => prev + 1);
      }
    });

    if (loaderRef.current) observer.current.observe(loaderRef.current);
  }, [hasMore, isLoadingMore]);

  const retry = () => {
    setInitialLoading(true);
    setError(null);
    loadArticles();
  };

  const renderBody = () => {
    if (initialLoading) {
      return (
        <div className="space-y-10" aria-busy="true" aria-label="Loading articles">
          {[0, 1, 2].map(i => (
            <Card key={`skeleton-${i}`} className="overflow-hidden">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-60 md:h-auto bg-muted animate-pulse" />
                <div className="md:w-2/3 p-6 space-y-4">
                  <div className="h-4 w-24 bg-muted rounded-full animate-pulse" />
                  <div className="h-6 w-3/4 bg-muted rounded animate-pulse" />
                  <div className="h-4 w-full bg-muted rounded animate-pulse" />
                  <div className="h-4 w-5/6 bg-muted rounded animate-pulse" />
                  <div className="h-8 w-40 bg-muted rounded animate-pulse" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      );
    }

    if (error && articles.length === 0) {
      return (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">{error}</p>
          <button
            onClick={retry}
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/90"
          >
            <RefreshCw size={16} />
            Try again
          </button>
        </div>
      );
    }

    if (articles.length === 0) {
      return (
        <div className="text-center py-16">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">No articles yet</h2>
          <p className="text-muted-foreground">
            {authorId
              ? 'This veterinarian has not published any articles yet.'
              : 'Check back soon — new pet care and clinic guides are on the way.'}
          </p>
        </div>
      );
    }

    return (
      <>
        <div className="space-y-10">
          {articles.map((article, index) => (
            <Card key={`${article.slug}-${index}`} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
              <div className="flex flex-col md:flex-row">
                <div className="md:w-1/3 h-60 md:h-auto relative">
                  <Link to={`/article/${article.slug}`} className="hover:text-primary">
                    <img
                      src={article.coverImage}
                      alt={article.title}
                      className="w-full h-full object-cover"
                    />
                  </Link>
                </div>
                <div className="md:w-2/3 flex flex-col">
                  <CardHeader>
                    <div className="flex items-center mb-2 text-sm text-muted-foreground">
                      <span className="bg-accent px-3 py-1 rounded-full">{article.category}</span>
                    </div>
                    <CardTitle className="text-2xl">
                      <Link to={`/article/${article.slug}`} className="hover:text-primary transition-colors">
                        {article.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="line-clamp-2">
                      {article.excerpt}
                    </CardDescription>
                  </CardHeader>

                  <CardContent>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {article.tags.map(tag => (
                        <span key={`article.tag-${tag}`} className="flex items-center text-xs text-muted-foreground">
                          <Tag size={12} className="mr-1" />
                          {tag}
                        </span>
                      ))}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-2 mt-auto flex items-center justify-between">
                    <div className="flex items-center">
                      <Avatar className="h-8 w-8">
                        <img src={article.author.avatar} alt={article.author.name} />
                      </Avatar>
                      <div className="ml-2 text-sm">
                        <p className="font-medium">{article.author.name}</p>
                        <p className="text-muted-foreground text-xs">{article.author.role}</p>
                      </div>
                    </div>

                    <div className="flex items-center text-sm text-muted-foreground">
                      <CalendarIcon size={14} className="mr-1" />
                      <span className="mr-3">
                        {formatDistance(new Date(article.createdAt), new Date(), { addSuffix: true })}
                      </span>
                      <Clock size={14} className="mr-1" />
                      <span>{article.readTime} min read</span>
                    </div>
                  </CardFooter>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {isLoadingMore ? (
          <div className="text-center py-10 text-muted-foreground">Loading more articles...</div>
        ) : hasMore ? (
          <div ref={loaderRef} className="text-center py-10 text-muted-foreground">&nbsp;</div>
        ) : (
          <div className="text-center py-10 text-muted-foreground">
            You've reached the end.
          </div>
        )}
      </>
    );
  };

  return (
    <>
      <div className="pt-24 pb-16 container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <header className="mb-12">
            <h1 className="text-4xl font-bold tracking-tight mb-3 text-balance">
              {authorId ? 'Doctor Articles' : 'Our Blog'}
            </h1>
            <p className="text-lg text-muted-foreground">
              {authorId
                ? 'Published articles from this veterinarian.'
                : 'Insights and guides on pet care, veterinary practice, and clinic operations.'}
            </p>
          </header>

          {renderBody()}
        </div>
      </div>
    </>
  );
};

export default Articles;