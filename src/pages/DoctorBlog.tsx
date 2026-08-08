import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Plus, ExternalLink, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ensureMyAuthor, fetchArticles } from '@/services/articleService';
import type { ArticleList } from '@/pages/Interface/PagesInterface';

export default function DoctorBlog() {
  const [loading, setLoading] = useState(true);
  const [articles, setArticles] = useState<ArticleList[]>([]);
  const [authorId, setAuthorId] = useState<number | null>(null);
  const [authorName, setAuthorName] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const author = await ensureMyAuthor();
      setAuthorId(author.id);
      setAuthorName(author.name);
      const res = await fetchArticles({
        page: 1,
        size: 50,
        body: {
          name: null,
          isRandom: null,
          articleStatus: null,
          tags: null,
          authorId: author.id,
        },
      });
      setArticles(res.data?.models ?? []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load your articles';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Blog</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Publish independently as {authorName || 'your doctor brand'} — no clinic required.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild size="sm">
            <Link to={authorId ? `/articles?authorId=${authorId}` : '/articles'}>
              <ExternalLink className="h-4 w-4 mr-1.5" />
              Public profile
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link to="/doctor/blog/new">
              <Plus className="h-4 w-4 mr-1.5" />
              New article
            </Link>
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Loading your articles…</p>
      ) : articles.length === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4" /> No articles yet
            </CardTitle>
            <CardDescription>
              Write your first post to build trust with pet parents across clinics.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link to="/doctor/blog/new">Create article</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {articles.map((article) => (
            <Card key={article.slug} className="border-0 shadow-sm">
              <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="font-semibold truncate">{article.title}</h2>
                    <Badge variant="secondary">{article.status || 'DRAFT'}</Badge>
                    {article.status === 'SCHEDULED' && article.scheduledPublishAt ? (
                      <span className="text-xs text-muted-foreground">
                        {new Date(article.scheduledPublishAt).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{article.excerpt}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/articles/${article.slug}`}>View</Link>
                  </Button>
                  <Button size="sm" asChild>
                    <Link to={`/doctor/blog/edit/${article.slug}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1" />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
