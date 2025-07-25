import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import {
  BarChart,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Package,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter
} from '@/components/ui/card';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { initializeAdminDashboard } from '@/module/slice/AdminSlice';
import { initializeUser } from '@/services/authService';
import { fetchArticles, ArticleSearchRequest } from '@/services/articleService';
import { ArticleApiResponse, ArticleList } from '@/pages/Interface/PagesInterface';
import { fetchFilteredOrders, Order } from '@/services/orderService';
import { formatCurrency } from '@/services/cartService';
import { getStatusColor, getStatusDisplay } from './AdminOrders';

const AdminDashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(true);
  const [articles, setArticles] = useState<ArticleList[]>([]);
  const [isLoadingArticles, setIsLoadingArticles] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  
  // Get state from Redux store
  const { productCount, isDashboardLoading, totalOrderCount, totalArticleCount, totalUserCount } = useAppSelector((state) => state.adminReducer);
  const user = useAppSelector((state) => state.authReducer.user);

  // Fetch articles
  const loadArticles = async () => {
    setIsLoadingArticles(true);
    try {
      const searchRequest: ArticleSearchRequest = {
        name: null,
        isRandom: null,
        articleStatus: null
      };
      const response = await fetchArticles({
        page: 1,
        size: 10,
        body: searchRequest
      });
      setArticles(response.data.models || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setIsLoadingArticles(false);
    }
  };

  const loadRecentOrders = async () => {
    setIsLoadingOrders(true);
    try {
      const response = await fetchFilteredOrders(1, 6, {
        userUuid: null,
        orderNumber: null,
        orderStatus: 'SUCCESSFULL',
        searchText: null,
      });
      setOrders(response.data.models || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setIsLoadingOrders(false);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const accessToken = localStorage.getItem('access_token');
        if (!accessToken) {
          setIsCheckingRole(false);
          return;
        }

        if (!user) {
          await initializeUser();
        }

        await dispatch(initializeAdminDashboard());
        await loadArticles();
        await loadRecentOrders();

        const roles = user?.roles || [];
        const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
        setUserRole(isAdmin ? 'ROLE_ADMIN' : null);

        
      } catch (error) {
        console.error('Error initializing admin dashboard:', error);
      } finally {
        setIsCheckingRole(false);
      }
    };

    init();
  }, [dispatch, user]);

  // Show loading while checking role or loading dashboard
  if (isCheckingRole || isDashboardLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect non-admin users only after role check is complete
  if (!isCheckingRole && userRole !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  const stats = [
    { title: 'Total Users', value: totalUserCount, icon: Users, color: 'bg-blue-100 text-blue-700', route: '/admin/users' },
    { title: 'Orders', value: totalOrderCount, icon: ShoppingCart, color: 'bg-green-100 text-green-700', route: '/admin/orders' },
    { title: 'Products', value: productCount, icon: Package, color: 'bg-purple-100 text-purple-700', route: '/admin/products' },
    { title: 'Articles', value: totalArticleCount, icon: FileText, color: 'bg-amber-100 text-amber-700', route: '/admin/articles' },
  ];


  return (
    <div className="min-h-screen flex flex-col">
      <main className="flex-1 pt-24 pb-16 bg-gray-50 dark:bg-gray-900">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0 mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
              <p className="text-muted-foreground">
                Manage your store, monitor analytics, and handle content.
              </p>
            </div>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuTrigger className="bg-white dark:bg-gray-800">
                    <Settings className="mr-2 h-4 w-4" />
                    Quick Actions
                  </NavigationMenuTrigger>
                  <NavigationMenuContent>
                    <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2">
                      <li className="row-span-3">
                        <NavigationMenuLink asChild>
                          <a
                            className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-kitty-500 to-kitty-700 p-6 no-underline outline-none focus:shadow-md"
                            href="#"
                          >
                            <div className="mb-2 mt-4 text-lg font-medium text-white">
                              kitty<span className="text-white">p</span> Admin
                            </div>
                            <p className="text-sm leading-tight text-white/90">
                              Welcome to the admin dashboard for your eco-friendly cat litter business.
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="/admin/articles/new"
                          >
                            <div className="text-sm font-medium leading-none">Add Article</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Create a new article for your blog
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="#"
                          >
                            <div className="text-sm font-medium leading-none">Add Product</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Create a new product for your store
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                      <li>
                        <NavigationMenuLink asChild>
                          <a
                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground"
                            href="#"
                          >
                            <div className="text-sm font-medium leading-none">User Management</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Manage customer accounts and permissions
                            </p>
                          </a>
                        </NavigationMenuLink>
                      </li>
                    </ul>
                  </NavigationMenuContent>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>

          {/* Dashboard Stats */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Card 
                key={`admin-dash-stats-${index}`} 
                className="overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => navigate(stat.route)}
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                      <p className="text-3xl font-bold">{stat.value}</p>
                    </div>
                    <div className={cn("p-2 rounded-full", stat.color)}>
                      <stat.icon className="h-6 w-6" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid gap-6 mt-8 md:grid-cols-7">
            {/* Chart */}
            <Card className="md:col-span-4">
              <CardHeader>
                <CardTitle>Sales Overview</CardTitle>
                <CardDescription>Monthly sales performance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[240px] flex items-center justify-center border rounded-md p-4">
                  <BarChart className="h-16 w-16 text-muted-foreground/70" />
                  <p className="ml-4 text-muted-foreground">
                    Chart visualization would be shown here
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent Orders */}
            <Card className="md:col-span-3">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Recent Orders</CardTitle>
                  <CardDescription>Latest customer purchases</CardDescription>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {orders.map((order) => (
                    <div key={`admin-dash-order-id-${order.orderNumber}`} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.billingAddress.name}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{order.orderNumber}</span>
                          <span className="mx-1">•</span>
                          <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">{formatCurrency(order.totalAmount, order.currency)}</span>
                        <span className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(order.status))}>
                        {getStatusDisplay(order.status)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Articles Management */}
          <div className="mt-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div>
                  <CardTitle>Articles Management</CardTitle>
                  <CardDescription>Manage your blog content</CardDescription>
                </div>
                <Button onClick={() => navigate('/admin/articles/new')}>
                  <Plus className="h-4 w-4 mr-2" /> New Article
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoadingArticles ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                  ) : articles.length > 0 ? (
                    <div className="border rounded-md divide-y">
                      {articles.map((article) => (
                        <div key={`admin-dash-article-${article.slug}`} className="flex items-center justify-between p-4">
                          <div className="space-y-1">
                            <div className="font-medium">{article.title}</div>
                            <div className="flex items-center text-xs text-muted-foreground">
                              <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                              <span className="mx-1">•</span>
                              <span>{article.category}</span>
                              <span className="mx-1">•</span>
                              <span>{article.readTime} min read</span>
                            </div>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="outline" size="sm" onClick={() => navigate(`/article/${article.slug}`)}>
                              View
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/articles/edit/${article.slug}`)}>
                              Edit
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <FileText className="mx-auto h-12 w-12 opacity-30 mb-2" />
                      <h3 className="text-lg font-medium">No articles yet</h3>
                      <p className="mb-4">Start creating content for your blog</p>
                      <Button onClick={() => navigate('/admin/articles/new')}>
                        <Plus className="h-4 w-4 mr-2" /> Create your first article
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default AdminDashboard;
