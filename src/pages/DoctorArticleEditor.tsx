import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarClock, FileInput, Save, Send, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import BlogEditor from '@/components/BlogEditor';
import RichContentViewer from '@/components/RichContentViewer';
import {
  createArticle,
  editArticle,
  ensureMyAuthor,
  fetchArticleBySlug,
} from '@/services/articleService';
import { uploadFiles } from '@/services/fileService';

const CATEGORIES = [
  'Pet Care',
  'Pet Health',
  'Veterinary Care',
  'Sustainability',
  'Products',
  'Tips & Tricks',
] as const;

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s]/gi, '')
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

type ArticleStatus = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'SCHEDULED';

export default function DoctorArticleEditor() {
  const { slug: editSlug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const isEdit = Boolean(editSlug);
  const coverImageFileRef = useRef<HTMLInputElement>(null);

  const [authorId, setAuthorId] = useState<number | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [scheduledPublishAt, setScheduledPublishAt] = useState('');
  const [htmlToImport, setHtmlToImport] = useState('');
  const [importDialogOpen, setImportDialogOpen] = useState(false);
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
          setCoverImage(article.coverImage || '');
          setCategory(article.category || '');
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

  const generateSlug = () => {
    if (!title.trim()) {
      toast.error('Add a title first');
      return;
    }
    setSlug(slugify(title));
  };

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    try {
      const response = await uploadFiles(Array.from(files));
      const imageUrl = response.data[0];
      if (imageUrl) {
        setCoverImage(imageUrl);
        toast.success('Cover image uploaded!');
      }
    } catch {
      toast.error('Error uploading cover image.');
    }
  };

  const save = async (status: ArticleStatus) => {
    if (title.trim().length < 5) {
      toast.error('Title must be at least 5 characters');
      return;
    }
    const finalSlug = (slug || slugify(title)).trim();
    if (finalSlug.length < 5) {
      toast.error('Slug must be at least 5 characters');
      return;
    }
    if (excerpt.trim().length < 10) {
      toast.error('Excerpt must be at least 10 characters');
      return;
    }
    if (content.length < 50) {
      toast.error('Article content must be at least 50 characters long');
      return;
    }
    if (!coverImage.trim()) {
      toast.error('Upload a cover image');
      return;
    }
    if (!category.trim()) {
      toast.error('Select a category');
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
      const scheduleIso = status === 'SCHEDULED' ? fromDatetimeLocalValue(scheduledPublishAt) : undefined;
      const payload = {
        title: title.trim(),
        slug: finalSlug,
        excerpt: excerpt.trim(),
        content,
        coverImage: coverImage.trim(),
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
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/doctor/blog">
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back
            </Link>
          </Button>
          <h1 className="text-3xl font-bold tracking-tight mt-2">Article Editor</h1>
          <p className="text-muted-foreground">Create and publish articles for your blog</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" disabled={saving} onClick={() => navigate('/doctor/blog')}>
            Cancel
          </Button>
          <Button variant="secondary" disabled={saving} onClick={() => void save('DRAFT')}>
            <Save className="h-4 w-4 mr-1.5" />
            {saving ? 'Saving...' : 'Save Draft'}
          </Button>
          <Button variant="outline" disabled={saving} onClick={() => void save('SCHEDULED')}>
            <CalendarClock className="h-4 w-4 mr-1.5" />
            Schedule
          </Button>
          <Button disabled={saving} onClick={() => void save('PUBLISHED')}>
            <Send className="h-4 w-4 mr-1.5" />
            {saving ? 'Publishing...' : 'Publish'}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Article Details</CardTitle>
          <CardDescription>Basic information about your article</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter article title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => {
                  if (!slug) generateSlug();
                }}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">Slug</Label>
              <div className="flex space-x-2">
                <Input
                  id="slug"
                  placeholder="article-url-slug"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={isEdit}
                />
                {!isEdit && (
                  <Button type="button" variant="outline" onClick={generateSlug} className="whitespace-nowrap">
                    Generate
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excerpt">Excerpt</Label>
            <Textarea
              id="excerpt"
              placeholder="Brief summary of the article"
              className="resize-none"
              rows={3}
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label>Cover Image</Label>
              <input
                type="file"
                ref={coverImageFileRef}
                onChange={handleCoverImageUpload}
                className="hidden"
                accept="image/*"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => coverImageFileRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload Image
              </Button>
              {coverImage && (
                <div className="mt-4">
                  <img src={coverImage} alt="Cover preview" className="rounded-md object-cover h-48 w-full" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={category || undefined} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item}>
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <Input
                id="tags"
                placeholder="eco-friendly, cats, sustainability"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Separate tags with commas</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="readTime">Read Time (minutes)</Label>
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
            <Label htmlFor="scheduledPublishAt">Schedule publish at</Label>
            <Input
              id="scheduledPublishAt"
              type="datetime-local"
              value={scheduledPublishAt}
              onChange={(e) => setScheduledPublishAt(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Optional. Set a date/time, then click Schedule. The article stays private until then.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Article Content</CardTitle>
            <CardDescription>Write your article using the rich text editor</CardDescription>
          </div>
          <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
            <DialogTrigger asChild>
              <Button type="button" variant="outline">
                <FileInput className="mr-2 h-4 w-4" /> Import HTML
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-[95vw] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Import HTML Content</DialogTitle>
                <DialogDescription>
                  Paste your HTML content below. This will replace the current editor content.
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 min-h-0 flex flex-col space-y-4 overflow-y-auto">
                <div className="flex-1 min-h-0">
                  <Label htmlFor="html-content" className="text-sm font-medium">
                    HTML Content
                  </Label>
                  <Textarea
                    id="html-content"
                    placeholder="<p>Your HTML content here...</p>"
                    value={htmlToImport}
                    onChange={(e) => setHtmlToImport(e.target.value)}
                    className="min-h-[200px] max-h-[400px] font-mono text-xs sm:text-sm resize-none"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => {
                    setHtmlToImport('');
                    setImportDialogOpen(false);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    if (!htmlToImport.trim()) {
                      toast.error('Please enter HTML content to import');
                      return;
                    }
                    setContent(htmlToImport);
                    setHtmlToImport('');
                    setImportDialogOpen(false);
                    toast.success('HTML content imported successfully!');
                  }}
                >
                  Import Content
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <BlogEditor key={editSlug || 'new-article'} content={content} onChange={setContent} />
              <div className="flex justify-end mt-2 text-sm text-muted-foreground">
                <span>
                  {content.length} characters
                  {content.length < 50 && (
                    <span className="text-red-500 ml-2">(Minimum 50 characters required)</span>
                  )}
                </span>
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
                <span className="text-xs text-muted-foreground">What readers will see</span>
              </div>
              <div className="border rounded p-4 bg-white dark:bg-gray-900">
                <RichContentViewer html={content || ''} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
