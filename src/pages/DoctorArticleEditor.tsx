import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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

/** Convert API LocalDateTime / ISO string to datetime-local value (local TZ). */
function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** datetime-local → ISO-like local datetime string for backend LocalDateTime. */
function fromDatetimeLocalValue(value: string): string | undefined {
  if (!value.trim()) return undefined;
  // Send as "yyyy-MM-dd'T'HH:mm:ss" without Z so Jackson binds to LocalDateTime.
  return value.length === 16 ? `${value}:00` : value;
}

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';

export default function DoctorArticleEditor() {
  const { slug: editSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(editSlug);

  const [authorId, setAuthorId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('<p></p>');
  const [coverImage, setCoverImage] = useState('https://kittyp.in/og-image.jpg');
  const [category, setCategory] = useState('Veterinary Care');
  const [tags, setTags] = useState('pet health');
  const [readTime, setReadTime] = useState(5);
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
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
          setExcerpt(article.excerpt);
          setContent(article.content);
          setCoverImage(article.coverImage || 'https://kittyp.in/og-image.jpg');
          setCategory(article.category || 'Veterinary Care');
          setTags((article.tags || []).join(', '));
          setReadTime(article.readTime || 5);
          setScheduledPublishAt(toDatetimeLocalValue(article.scheduledPublishAt));
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
    if (!title.trim() || !excerpt.trim() || content.replace(/<[^>]+>/g, '').trim().length < 20) {
      toast.error('Title, excerpt, and content are required');
      return;
    }
    if (status === 'SCHEDULED' && !scheduledPublishAt.trim()) {
      toast.error('Pick a publish date and time to schedule');
      return;
    }
    setSaving(true);
    try {
      const cleanedTags = tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const finalSlug = (slug || slugify(title)).trim();
      const scheduleIso = status === 'SCHEDULED' ? fromDatetimeLocalValue(scheduledPublishAt) : undefined;
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content,
        coverImage,
        category,
        tags: cleanedTags,
        readTime,
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
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
            onClick={() => void save('SCHEDULED')}
          >
            <CalendarClock className="h-4 w-4 mr-1.5" />
            Schedule
          </Button>
          <Button disabled={saving} onClick={() => void save('PUBLISHED')}>
            <Send className="h-4 w-4 mr-1.5" />
            Publish now
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle>{isEdit ? 'Edit article' : 'New article'}</CardTitle>
          <CardDescription>
            Independent doctor blog — publish now or schedule for a specific date.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!isEdit) setSlug(slugify(e.target.value));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Slug</Label>
            <Input id="slug" value={slug} onChange={(e) => setSlug(e.target.value)} disabled={isEdit} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea id="excerpt" rows={3} value={excerpt} onChange={(e) => setExcerpt(e.target.value)} />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input id="category" value={category} onChange={(e) => setCategory(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input id="tags" value={tags} onChange={(e) => setTags(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="readTime">Read time (min)</Label>
              <Input
                id="readTime"
                type="number"
                min={1}
                value={readTime}
                onChange={(e) => setReadTime(Number(e.target.value) || 1)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="coverImage">Cover image URL</Label>
            <Input id="coverImage" value={coverImage} onChange={(e) => setCoverImage(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="scheduledPublishAt">Schedule publish at</Label>
            <Input
              id="scheduledPublishAt"
              type="datetime-local"
              value={scheduledPublishAt}
              onChange={(e) => setScheduledPublishAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Set a date/time, then click Schedule. The article stays private until then.
            </p>
          </div>
          <div className="space-y-2">
            <Label>Content</Label>
            <BlogEditor content={content} onChange={setContent} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
