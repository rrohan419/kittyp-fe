import { useState, useEffect, useRef } from 'react';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { FileText, Save, Send, Upload, FileInput } from 'lucide-react';
import BlogEditor from '@/components/BlogEditor';
import { createArticle, editArticle, fetchArticleBySlug } from '@/services/articleService';
import { uploadFiles } from '@/services/fileService';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
  } from "@/components/ui/dialog";

const articleFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  slug: z.string().min(5, { message: "Slug must be at least 5 characters" }),
  excerpt: z.string().min(10, { message: "Excerpt must be at least 10 characters" }),
  content: z.string().min(50, { message: "Content must be at least 50 characters" }),
  coverImage: z.string().url({ message: "Cover image must be a valid URL" }),
  category: z.string().min(2, { message: "Category is required" }),
  tags: z.string(),
  readTime: z.coerce.number().min(1, { message: "Read time must be at least 1 minute" }),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

const DEFAULT_AUTHOR = {
  id: 1,
  name: 'Admin',
  avatar: '',
  role: 'ADMIN',
};

const AdminArticleEditor = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingArticle, setFetchingArticle] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [htmlToImport, setHtmlToImport] = useState("");
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  console.log('--------------------------------->   ',slug)
  const coverImageFileRef = useRef<HTMLInputElement>(null);


  useEffect(() => {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    setUserRole(isAdmin ? 'ROLE_ADMIN' : null);
    setLoading(false);
  }, []);

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
      status: "DRAFT"
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
            coverImage: data.coverImage,
            category: data.category,
            tags: data.tags.join(','),
            readTime: data.readTime,
            status: 'DRAFT',
          });
        })
        .catch(() => setFetchError('Failed to load article'))
        .finally(() => setFetchingArticle(false));
    }
  }, [slug]);

  if (!loading && userRole !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const handleCoverImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
        try {
            const response = await uploadFiles(Array.from(files));
            const imageUrl = response.data[0];
            if (imageUrl) {
                form.setValue("coverImage", imageUrl, { shouldValidate: true });
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
      const payload = {
        title: values.title,
        slug: values.slug,
        excerpt: values.excerpt,
        content: values.content,
        coverImage: values.coverImage,
        category: values.category,
        tags: values.tags.split(',').map(tag => tag.trim()),
        readTime: values.readTime,
        author: DEFAULT_AUTHOR,
        status: values.status
      };
      if (slug) {
        await editArticle(slug, payload);
        toast.success('Article updated!');
      } else {
        await createArticle(payload);
        toast.success('Article created!');
      }
      navigate('/admin/articles');
    } catch (err) {
      toast.error('Failed to save article');
    } finally {
      setSubmitting(false);
    }
  };

  const generateSlug = () => {
    const title = form.getValues("title");
    if (title) {
      const slug = title
        .toLowerCase()
        .replace(/[^\w\s]/gi, '')
        .replace(/\s+/g, '-');
      form.setValue("slug", slug);
    }
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
    <div className="min-h-screen flex flex-col">      
      <main className="flex-1 pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Article Editor</h1>
              <p className="text-muted-foreground">Create and publish articles for your blog</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/admin')}
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
                {submitting ? 'Saving...' : 'Save Draft'}
              </Button>
              <Button 
                type="submit"
                disabled={submitting}
                onClick={() => {
                    form.setValue('status', 'PUBLISHED');
                    form.handleSubmit(onSubmit)();
                }}
              >
                {submitting ? 'Publishing...' : 'Publish'}
              </Button>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <Card>
                <CardHeader>
                  <CardTitle>Article Details</CardTitle>
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
                              <Input placeholder="article-url-slug" {...field} />
                            </FormControl>
                            <Button 
                              type="button" 
                              variant="outline" 
                              onClick={generateSlug}
                              className="whitespace-nowrap"
                            >
                              Generate
                            </Button>
                          </div>
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
                            className="resize-none" 
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
                            <div>
                                <Input
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
                                {field.value && (
                                    <div className="mt-4">
                                        <img src={field.value} alt="Cover preview" className="rounded-md object-cover h-48 w-full" />
                                    </div>
                                )}
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
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Pet Care">Pet Care</SelectItem>
                              <SelectItem value="Pet Health">Pet Health</SelectItem>
                              <SelectItem value="Sustainability">Sustainability</SelectItem>
                              <SelectItem value="Products">Products</SelectItem>
                              <SelectItem value="Tips & Tricks">Tips & Tricks</SelectItem>
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
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Article Content</CardTitle>
                        <CardDescription>Write your article using the rich text editor</CardDescription>
                    </div>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button type="button" variant="outline"><FileInput className="mr-2 h-4 w-4" /> Import HTML</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Import HTML</DialogTitle>
                                <DialogDescription>
                                    Paste your HTML content below. This will replace the current editor content.
                                </DialogDescription>
                            </DialogHeader>
                            <Textarea
                                placeholder="<p>Your HTML content here...</p>"
                                value={htmlToImport}
                                onChange={(e) => setHtmlToImport(e.target.value)}
                                className="min-h-[250px] font-mono"
                            />
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button type="button" variant="secondary">Cancel</Button>
                                </DialogClose>
                                <DialogClose asChild>
                                    <Button type="button" onClick={() => {
                                        form.setValue('content', htmlToImport, { shouldValidate: true });
                                        setHtmlToImport('');
                                        toast.success("HTML content imported successfully!");
                                    }}>
                                        Import
                                    </Button>
                                </DialogClose>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent>
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
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>
            </form>
          </Form>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminArticleEditor;