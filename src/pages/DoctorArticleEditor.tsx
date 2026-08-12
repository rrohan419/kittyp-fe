import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import BlogEditor from '@/components/BlogEditor';
import {
  createArticle,
  editArticle,
  ensureMyAuthor,
  fetchArticleBySlug,
} from '@/services/articleService';

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value: string): string | undefined {
  if (!value.trim()) return undefined;
  return value.length === 16 ? `${value}:00` : value;
}

/** Plain-text excerpt from HTML body when the author leaves it blank. */
function excerptFromContent(html: string, maxLen = 160): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1).trim()}…`;
}

function estimateReadTime(html: string): number {
  const words = html.replace(/<[^>]+>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';

export default function DoctorArticleEditor() {
  const { slug: editSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(editSlug);

  const [authorId, setAuthorId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [coverImage, setCoverImage] = useState('https://kittyp.in/og-image.jpg');
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [showSchedule, setShowSchedule] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const author = await ensureMyAuthor();
        setAuthorId(author.id);
        if (editSlug) {
          const res = await fetchArticleBySlug({ slug: editSlug });
          const article = res.data;
          setTitle(article.title);
          setSlug(article.slug);
          setContent(article.content);
          setCoverImage(article.coverImage || 'https://kittyp.in/og-image.jpg');
          setScheduledPublishAt(toDatetimeLocalValue(article.scheduledPublishAt));
          setShowSchedule(Boolean(article.scheduledPublishAt));
        }
      } catch {
        toast.error('Could not load article editor');
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [editSlug]);

  const save = async (status: ArticleStatus) => {
    const plain = content.replace(/<[^>]+>/g, '').trim();
    if (!title.trim()) {
      toast.error('Add a title');
      return;
    }
    if (plain.length < 20) {
      toast.error('Write a bit more content before saving');
      return;
    }
    if (status === 'SCHEDULED' && !scheduledPublishAt.trim()) {
      toast.error('Pick a publish date and time to schedule');
      setShowSchedule(true);
      return;
    }
    setSaving(true);
    try {
      const finalSlug = (slug || slugify(title)).trim();
      const excerpt = excerptFromContent(content) || title.trim();
      const scheduleIso = status === 'SCHEDULED' ? fromDatetimeLocalValue(scheduledPublishAt) : undefined;
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt,
        content,
        coverImage: coverImage.trim() || 'https://kittyp.in/og-image.jpg',
        category: 'Veterinary Care',
        tags: ['pet health'],
        readTime: estimateReadTime(content),
        authorId: authorId ?? undefined,
        status,
        scheduledPublishAt: scheduleIso,
      };
      if (isEdit && editSlug) {
        await editArticle(editSlug, {
          title: payload.title,
          excerpt: payload.excerpt,
          content: payload.content,
          coverImage: payload.coverImage,
          category: payload.category,
          tags: payload.tags,
          readTime: payload.readTime,
          status: payload.status,
          scheduledPublishAt: scheduleIso ?? null,
        });
        toast.success(
          status === 'PUBLISHED'
            ? 'Article published'
            : status === 'SCHEDULED'
              ? 'Article scheduled'
              : 'Draft saved'
        );
      } else {
        await createArticle(payload);
        toast.success(
          status === 'PUBLISHED'
            ? 'Article published'
            : status === 'SCHEDULED'
              ? 'Article scheduled'
              : 'Draft created'
        );
      }
      navigate('/doctor/blog');
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to save article';
      toast.error(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-sm text-muted-foreground">Loading editor…</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/doctor/blog">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Link>
        </Button>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled={saving} onClick={() => void save('DRAFT')}>
            <Save className="h-4 w-4 mr-1.5" />
            Save draft
          </Button>
          <Button
            variant="outline"
            disabled={saving}
            onClick={() => {
              setShowSchedule(true);
              void save('SCHEDULED');
            }}
          >
            <CalendarClock className="h-4 w-4 mr-1.5" />
            Schedule
          </Button>
          <Button disabled={saving} onClick={() => void save('PUBLISHED')}>
            <Send className="h-4 w-4 mr-1.5" />
            Publish
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-xl">{isEdit ? 'Edit article' : 'New article'}</CardTitle>
          <CardDescription>Title and body are required. Everything else is handled for you.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit) setSlug(slugify(e.target.value));
              }}
              placeholder="Clear, professional headline"
              className="text-lg h-12"
            />
          </div>

          <div className="space-y-2">
            <Label>Article</Label>
            <BlogEditor content={content} onChange={setContent} />
          </div>

          {(showSchedule || scheduledPublishAt) && (
            <div className="space-y-2 rounded-lg border border-border p-4 bg-muted/30">
              <Label htmlFor="scheduledPublishAt">Publish at</Label>
              <Input
                id="scheduledPublishAt"
                type="datetime-local"
                value={scheduledPublishAt}
                onChange={(e) => setScheduledPublishAt(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Required only when scheduling. The article stays private until then.
              </p>
            </div>
          )}

          <details className="rounded-lg border border-border px-4 py-3 text-sm">
            <summary className="cursor-pointer font-medium text-muted-foreground">Optional details</summary>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <Label htmlFor="coverImage">Cover image URL</Label>
                <Input
                  id="coverImage"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://"
                />
              </div>
              {!isEdit && (
                <div className="space-y-2">
                  <Label htmlFor="slug">URL slug</Label>
                  <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              )}
            </div>
          </details>
        </CardContent>
      </Card>
    </div>
  );
}
