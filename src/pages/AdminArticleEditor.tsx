import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { Upload, FileInput, CalendarClock, Save, Send, ImageIcon } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';
import RichContentViewer from '@/components/RichContentViewer';
import { createArticle, editArticle, ensureMyAuthor, fetchArticleBySlug } from '@/services/articleService';
import { uploadFiles } from '@/services/fileService';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { AuthorSelector } from '@/components/admin/AuthorSelector';
import { Author } from '@/pages/Interface/PagesInterface';
import { getAuthItem } from '@/utils/authStorage';

const CATEGORIES = [
  'Pet Care',
  'Pet Health',
  'Veterinary Care',
  'Sustainability',
  'Products',
  'Tips & Tricks',
] as const;

const articleFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  slug: z.string().min(5, { message: "Slug must be at least 5 characters" }),
  excerpt: z.string().min(10, { message: "Excerpt must be at least 10 characters" }),
  content: z.string().min(50, { message: "Content must be at least 50 characters" }),
  coverImage: z.string().min(1, { message: "Cover image is required" }),
  category: z.string().min(2, { message: "Category is required" }),
  tags: z.string(),
  readTime: z.coerce.number().min(1, { message: "Read time must be at least 1 minute" }),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED", "SCHEDULED"]),
  scheduledPublishAt: z.string().optional(),
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

function toDatetimeLocalValue(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromDatetimeLocalValue(value?: string): string | undefined {
  if (!value?.trim()) return undefined;
  return value.length === 16 ? `${value}:00` : value;
}

export type AdminArticleEditorProps = {
  basePath?: string;
  selfAuthor?: boolean;
};

const AdminArticleEditor = ({
  basePath = '/admin/articles',
  selfAuthor = false,
}: AdminArticleEditorProps) => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [htmlToImport, setHtmlToImport] = useState("");
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const coverImageFileRef = useRef<HTMLInputElement>(null);
  const [selectedAuthor, setSelectedAuthor] = useState<Author | null>(null);
  const [coverFailed, setCoverFailed] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        if (selfAuthor) {
          const author = await ensureMyAuthor();
          setSelectedAuthor({
            id: author.id.toString(),
            name: author.name,
            avatar: author.avatar,
            role: author.role,
          });
          setUserRole('SELF');
        } else {
          const roles = JSON.parse(getAuthItem('roles') || '[]');
          const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
          setUserRole(isAdmin ? 'ROLE_ADMIN' : null);
        }
      } catch {
        toast.error('Could not load article editor');
        setUserRole(null);
      } finally {
        setLoading(false);
      }
    };
    void init();
  }, [selfAuthor]);

  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "",
      tags: "",
      readTime: 5,
      status: "DRAFT",
      scheduledPublishAt: "",
    },
  });

  useEffect(() => {
    if (slug) {
      setFetchingArticle(true);
      fetchArticleBySlug({ slug })
        .then(res => {
          const data = res.data;
          form.reset({
            title: data.title,
            slug: data.slug,
            excerpt: data.excerpt,
            content: data.content,
            coverImage: data.coverImage || '',
            category: data.category || '',
            tags: (data.tags || []).join(', '),
            readTime: data.readTime || 5,
            status:
              data.status === 'PUBLISHED' ||
              data.status === 'DRAFT' ||
              data.status === 'SCHEDULED' ||
              data.status === 'ARCHIVED'
                ? data.status
                : 'PUBLISHED',
            scheduledPublishAt: toDatetimeLocalValue(data.scheduledPublishAt),
          });
          // Set the author from the fetched article
          if (data.author) {
            setSelectedAuthor({
              id: data.author.id.toString(),
              name: data.author.name,
              avatar: data.author.avatar,
              role: data.author.role
            });
          }
          setHasUnsavedChanges(false);
        })
        .catch(() => setFetchError('Failed to load article'))
        .finally(() => setFetchingArticle(false));
    }
  }, [slug]);

  // Track form changes for unsaved changes warning
  useEffect(() => {
    const subscription = form.watch((value, { name, type }) => {
      if (type === 'change' && name) {
        setHasUnsavedChanges(true);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const coverUrl = form.watch('coverImage');
  useEffect(() => {
    setCoverFailed(false);
  }, [coverUrl]);

  // Warn user before leaving with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (!loading && !selfAuthor && userRole !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      try {
        const response = await uploadFiles(Array.from(files));
        const imageUrl = response.data[0];
        if (imageUrl) {
          form.setValue("coverImage", imageUrl, { shouldValidate: true, shouldDirty: true });
          toast.success("Cover image uploaded!");
        }
      } catch (error) {
        toast.error("Error uploading cover image.");
        console.error('Error uploading file:', error);
      }
    }
  };

  const onSubmit = async (values: ArticleFormValues) => {
    setSubmitting(true);
    try {
      // Validate content length
      if (values.content.length < 50) {
        toast.error('Article content must be at least 50 characters long');
        setSubmitting(false);
        return;
      }

      // Validate author selection
      if (!selectedAuthor) {
        toast.error('Please select an author for the article');
        setSubmitting(false);
        return;
      }

      // Clean up tags
      const cleanedTags = values.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      // Use selected author
      const authorToUse = selectedAuthor;
      
      const scheduleIso =
        values.status === 'SCHEDULED' ? fromDatetimeLocalValue(values.scheduledPublishAt) : undefined;

      if (values.status === 'SCHEDULED' && !scheduleIso) {
        toast.error('Pick a publish date and time to schedule');
        setSubmitting(false);
        return;
      }

      const payload = {
        title: values.title.trim(),
        slug: values.slug.trim(),
        excerpt: values.excerpt.trim(),
        content: values.content,
        coverImage: values.coverImage,
        category: values.category,
        tags: cleanedTags,
        readTime: values.readTime,
        authorId: parseInt(authorToUse.id.toString()),
        status: values.status,
        scheduledPublishAt: scheduleIso,
      };

      if (slug) {
        await editArticle(slug, {
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
          values.status === 'PUBLISHED'
            ? 'Article published'
            : values.status === 'SCHEDULED'
              ? 'Article scheduled'
              : 'Draft saved'
        );
      } else {
        await createArticle(payload);
        toast.success(
          values.status === 'PUBLISHED'
            ? 'Article published'
            : values.status === 'SCHEDULED'
              ? 'Article scheduled'
              : 'Draft created'
        );
      }
      setHasUnsavedChanges(false);
      navigate(basePath);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save article';
      toast.error(errorMessage);
      console.error('Article save error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = () => {
    const title = form.getValues('title').trim();
    if (!title) {
      toast.error('Add a title first');
      return;
    }
    const nextSlug = title
      .toLowerCase()
      .replace(/[^\w\s-]/gi, '')
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 80);
    if (nextSlug.length < 5) {
      toast.error('Title is too short to make a URL slug');
      return;
    }
    form.setValue('slug', nextSlug, { shouldValidate: true, shouldDirty: true });
  };

  if (loading || fetchingArticle) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (fetchError) {
    return <div className="text-center text-red-500 mt-10">{fetchError}</div>;
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
        <div>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Article Editor</h1>
              <p className="text-muted-foreground">Create and publish articles for your blog</p>
              {hasUnsavedChanges && (
                <p className="text-sm text-amber-600 dark:text-amber-400 mt-1">
                  ⚠️ You have unsaved changes
                </p>
              )}
            </div>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (hasUnsavedChanges) {
                    if (window.confirm('You have unsaved changes. Are you sure you want to leave?')) {
                      navigate(basePath);
                    }
                  } else {
                    navigate(basePath);
                  }
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="secondary"
                disabled={submitting}
                onClick={() => {
                  form.setValue("status", "DRAFT");
                  form.handleSubmit(onSubmit)();
                }}
              >
                <Save className="h-4 w-4 mr-1.5" />
                {submitting ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button
                type="button"
                variant="outline"
                disabled={submitting}
                onClick={() => {
                  form.setValue('status', 'SCHEDULED');
                  form.handleSubmit(onSubmit)();
                }}
              >
                <CalendarClock className="h-4 w-4 mr-1.5" />
                Schedule
              </Button>
              <Button
                type="button"
                disabled={submitting}
                onClick={() => {
                  form.setValue('status', 'PUBLISHED');
                  form.handleSubmit(onSubmit)();
                }}
              >
                <Send className="h-4 w-4 mr-1.5" />
                {submitting ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <CardTitle>Article Details</CardTitle>
                    {selfAuthor && selectedAuthor ? (
                      <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {selectedAuthor.name}
                        {selectedAuthor.role ? ` · ${selectedAuthor.role}` : ''}
                      </span>
                    ) : selectedAuthor && slug ? (
                      <span className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                        {selectedAuthor.name}
                        {selectedAuthor.role ? ` · ${selectedAuthor.role}` : ''}
                      </span>
                    ) : (
                      <div className="inline-flex items-center rounded-md border border-primary/40 bg-primary/10">
                        <AuthorSelector
                          compact
                          selectedAuthor={selectedAuthor}
                          onAuthorChange={setSelectedAuthor}
                        />
                      </div>
                    )}
                  </div>
                  <CardDescription>Basic information about your article</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Title</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter article title"
                              {...field}
                              onBlur={() => {
                                if (!form.getValues('slug')) {
                                  generateSlug();
                                }
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="slug"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Slug</FormLabel>
                          <div className="flex space-x-2">
                            <FormControl>
                              <Input
                                placeholder="article-url-slug"
                                {...field}
                                disabled={!!slug}
                              />
                            </FormControl>
                            {!slug && (
                              <Button
                                type="button"
                                variant="outline"
                                onClick={generateSlug}
                                className="whitespace-nowrap"
                              >
                                Generate
                              </Button>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {slug
                              ? 'URL path is fixed after publish so existing links keep working.'
                              : 'Fills the URL from the title, e.g. “Cat Food” → cat-food.'}
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <FormField
                    control={form.control}
                    name="excerpt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Excerpt</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Brief summary of the article"
                            rows={3}
                            className="min-h-[4.5rem] resize-y"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="coverImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cover Image</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Input
                                type="file"
                                ref={coverImageFileRef}
                                onChange={handleCoverImageUpload}
                                className="hidden"
                                accept="image/*"
                              />
                              <div className="relative h-48 overflow-hidden rounded-xl border bg-muted">
                                {field.value && !coverFailed ? (
                                  <img
                                    src={field.value}
                                    alt="Cover preview"
                                    className="h-full w-full object-cover"
                                    referrerPolicy="no-referrer"
                                    onError={() => setCoverFailed(true)}
                                  />
                                ) : (
                                  <div className="flex h-full w-full flex-col items-center justify-center gap-1 px-4 text-center text-muted-foreground">
                                    <ImageIcon className="h-8 w-8 opacity-60" />
                                    {field.value && coverFailed ? (
                                      <>
                                        <p className="text-sm font-medium text-foreground">
                                          Could not load image
                                        </p>
                                        <p className="text-xs break-all">{field.value}</p>
                                      </>
                                    ) : (
                                      <p className="text-sm">No cover yet</p>
                                    )}
                                  </div>
                                )}
                                <Button
                                  type="button"
                                  variant="secondary"
                                  size="sm"
                                  className="absolute bottom-3 left-3 shadow-sm"
                                  onClick={() => coverImageFileRef.current?.click()}
                                >
                                  <Upload className="mr-2 h-4 w-4" />
                                  Upload Image
                                </Button>
                              </div>
                              <Input
                                value={field.value}
                                onChange={field.onChange}
                                placeholder="https://… or uploaded file URL"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value || undefined}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {(CATEGORIES as readonly string[]).includes(field.value)
                                ? CATEGORIES.map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))
                                : [
                                    ...CATEGORIES,
                                    ...(field.value ? [field.value] : []),
                                  ].map((item) => (
                                    <SelectItem key={item} value={item}>
                                      {item}
                                    </SelectItem>
                                  ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="tags"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tags</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="eco-friendly, cats, sustainability"
                              {...field}
                            />
                          </FormControl>
                          <p className="text-xs text-muted-foreground">
                            Separate tags with commas
                          </p>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="readTime"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Read Time (minutes)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min="1"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="scheduledPublishAt"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Schedule publish at</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <p className="text-xs text-muted-foreground">
                          Optional. Set a date/time, then click Schedule. The article stays private until then.
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
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
                      <Button type="button" variant="outline"><FileInput className="mr-2 h-4 w-4" /> Import HTML</Button>
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
                        {htmlToImport && (
                          <div className="flex-shrink-0">
                            <Label className="text-sm font-medium">Content Length: {htmlToImport.length} characters</Label>
                          </div>
                        )}
                      </div>
                      <DialogFooter className="flex-shrink-0">
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
                              toast.error("Please enter HTML content to import");
                              return;
                            }

                            try {
                              form.setValue('content', htmlToImport, { shouldValidate: true });
                              setHtmlToImport('');
                              setImportDialogOpen(false);
                              toast.success("HTML content imported successfully!");
                            } catch (error) {
                              toast.error("Invalid HTML content. Please check your HTML syntax.");
                              console.error('HTML import error:', error);
                            }
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
                      <FormField
                        control={form.control}
                        name="content"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <BlogEditor
                                key={slug || 'new-article'}
                                content={field.value}
                                onChange={field.onChange}
                              />
                            </FormControl>
                            <div className="flex justify-between items-center mt-2 text-sm text-muted-foreground">
                              <FormMessage />
                              <span>
                                {field.value.length} characters
                                {field.value.length < 50 && (
                                  <span className="text-red-500 ml-2">
                                    (Minimum 50 characters required)
                                  </span>
                                )}
                              </span>
                            </div>
                          </FormItem>
                        )}
                      />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
                        <span className="text-xs text-muted-foreground">What readers will see</span>
                      </div>
                      <div className="border rounded p-4 bg-white dark:bg-gray-900">
                        <RichContentViewer html={form.watch('content') || ''} />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
    </div>
  );
};

export default AdminArticleEditor;
