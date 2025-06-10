import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
// import { Article, Author } from '@/types/article';
import { FileText, Save, Send } from 'lucide-react';
import RichTextEditor from '@/components/admin/RichTextEditor';
import { Article, Author } from './Interface/articles';

// Define the form schema
const articleFormSchema = z.object({
  title: z.string().min(5, { message: "Title must be at least 5 characters" }),
  slug: z.string().min(5, { message: "Slug must be at least 5 characters" }),
  excerpt: z.string().min(10, { message: "Excerpt must be at least 10 characters" }),
  content: z.string().min(50, { message: "Content must be at least 50 characters" }),
  coverImage: z.string().url({ message: "Cover image must be a valid URL" }),
  category: z.string().min(2, { message: "Category is required" }),
  tags: z.string().transform(val => val.split(',').map(tag => tag.trim())),
  readTime: z.coerce.number().min(1, { message: "Read time must be at least 1 minute" }),
  status: z.enum(["DRAFT", "PUBLISHED"])
});

type ArticleFormValues = z.infer<typeof articleFormSchema>;

const AdminArticleEditor = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    setUserRole(isAdmin ? 'ROLE_ADMIN' : null);
    setLoading(false);
  }, []);

  // Redirect non-admin users
  if (!loading && userRole !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  // Setup form with default values
  const form = useForm<ArticleFormValues>({
    resolver: zodResolver(articleFormSchema),
    defaultValues: {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      coverImage: "",
      category: "",
      tags: [],
      readTime: 5,
      status: "DRAFT"
    },
  });

  // Handle form submission
  const onSubmit = (values: ArticleFormValues) => {
    const newArticle: Partial<Article> = {
      ...values,
      id: `article-${Date.now()}`,
      publishedAt: values.status === "PUBLISHED" ? new Date().toISOString() : undefined,
      comments: []
    };
    
    console.log("Saving article:", newArticle);
    
    // Show success message
    toast.success(values.status === "PUBLISHED" ? "Article Published!" : "Draft Saved!", {
      description: `"${values.title}" has been ${values.status === "PUBLISHED" ? "published" : "saved as a draft"}.`
    });
    
    // Redirect to admin dashboard
    navigate('/admin');
  };

  // Generate slug from title
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
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
                onClick={() => {
                  form.setValue("status", "DRAFT");
                  form.handleSubmit(onSubmit)();
                }}
                variant="secondary"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Draft
              </Button>
              <Button 
                onClick={() => {
                  form.setValue("status", "PUBLISHED");
                  form.handleSubmit(onSubmit)();
                }}
              >
                <Send className="mr-2 h-4 w-4" />
                Publish
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
                          <FormLabel>Cover Image URL</FormLabel>
                          <FormControl>
                            <Input placeholder="https://example.com/image.jpg" {...field} />
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
                <CardHeader>
                  <CardTitle>Article Content</CardTitle>
                  <CardDescription>Write your article content in HTML format</CardDescription>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <RichTextEditor 
                            value={field.value} 
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