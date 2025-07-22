import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Search, Plus, Edit, Eye, FileText, Calendar, Clock } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { fetchArticles } from '@/services/articleService';
import { ArticleList, ArticleStatus } from './Interface/PagesInterface';

const AdminArticles = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [articles, setArticles] = useState<ArticleList[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PUBLISHED': return 'bg-green-100 text-green-800';
      case 'DRAFT': return 'bg-yellow-100 text-yellow-800';
      case 'ARCHIVED': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const loadArticles = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetchArticles({
        page: 1,
        size: 50, // Increased size to load more articles at once for admin view
        body: {
          name: null,
          isRandom: null,
          articleStatus: null
        },
      });
      setArticles(response.data.models);
    } catch (error) {
      console.error('Error loading articles:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadArticles();
  }, [loadArticles]);

  // Convert articles data to match admin format with status
  const adminArticles = articles.map(article => ({
    ...article,
    status: article.status as ArticleStatus, // Since these are all published articles
    authorName: article.author.name,
    tagsText: article.tags.join(', ')
  }));

  const filteredArticles = adminArticles.filter(article => {
    const matchesSearch = 
      article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      article.authorName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || article.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Article Management</h1>
              <p className="text-muted-foreground">
                Manage your blog content and publications
              </p>
            </div>
            <Button onClick={() => navigate('/admin/articles/new')}>
              <Plus className="h-4 w-4 mr-2" />
              New Article
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="h-5 w-5 mr-2" />
                Articles
              </CardTitle>
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search articles..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Tabs value={filterStatus} onValueChange={setFilterStatus}>
                  <TabsList>
                    <TabsTrigger value="all">All</TabsTrigger>
                    <TabsTrigger value="PUBLISHED">Published</TabsTrigger>
                    <TabsTrigger value="DRAFT">Draft</TabsTrigger>
                    <TabsTrigger value="ARCHIVED">Archived</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Article</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Published</TableHead>
                      <TableHead>Read Time</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          Loading articles...
                        </TableCell>
                      </TableRow>
                    ) : filteredArticles.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-10">
                          No articles found
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredArticles.map((article) => (
                        <TableRow key={article.slug}>
                          <TableCell>
                            <div className="flex items-start space-x-3">
                              <img 
                                src={article.coverImage} 
                                alt={article.title}
                                className="w-12 h-12 rounded-lg object-cover bg-gray-100"
                              />
                              <div>
                                <div className="font-medium line-clamp-1">{article.title}</div>
                                <div className="text-sm text-muted-foreground line-clamp-2">
                                  {article.excerpt}
                                </div>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {article.tags.slice(0, 2).map((tag) => (
                                    <Badge key={tag} variant="outline" className="text-xs">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {article.tags.length > 2 && (
                                    <Badge variant="outline" className="text-xs">
                                      +{article.tags.length - 2}
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <img 
                                src={article.author.avatar} 
                                alt={article.authorName}
                                className="w-6 h-6 rounded-full"
                              />
                              <div>
                                <div className="text-sm font-medium">{article.authorName}</div>
                                <div className="text-xs text-muted-foreground">{article.author.role}</div>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary">{article.category}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(article.status)}>
                              {article.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {new Date(article.createdAt).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {article.readTime} min
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/article/${article.slug}`)}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                View
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                onClick={() => navigate(`/admin/articles/edit/${article.slug}`)}
                              >
                                <Edit className="h-3 w-3 mr-1" />
                                Edit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminArticles;