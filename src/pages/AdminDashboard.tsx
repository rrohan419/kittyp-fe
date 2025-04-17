import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { 
  BarChart,
  Users,
  ShoppingCart,
  FileText,
  Settings,
  Package
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';



const stats = [
    { title: 'Total Users', value: '2,420', icon: Users, color: 'bg-blue-100 text-blue-700' },
    { title: 'Orders', value: '845', icon: ShoppingCart, color: 'bg-green-100 text-green-700' },
    { title: 'Products', value: '12', icon: Package, color: 'bg-purple-100 text-purple-700' },
    { title: 'Articles', value: '36', icon: FileText, color: 'bg-amber-100 text-amber-700' },
  ];

  const recentOrders = [
    { id: '#ORD-7895', customer: 'Sarah Johnson', date: '2023-04-15', status: 'Completed', amount: '$125.00' },
    { id: '#ORD-7896', customer: 'Michael Chen', date: '2023-04-15', status: 'Processing', amount: '$89.99' },
    { id: '#ORD-7897', customer: 'Emma Williams', date: '2023-04-14', status: 'Shipped', amount: '$245.50' },
    { id: '#ORD-7898', customer: 'James Brown', date: '2023-04-14', status: 'Completed', amount: '$65.25' },
    { id: '#ORD-7899', customer: 'Olivia Davis', date: '2023-04-13', status: 'Processing', amount: '$189.00' },
  ];

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'processing':
        return 'bg-blue-100 text-blue-800';
      case 'shipped':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };




const AdminDashboard = () => {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get roles from localStorage instead of user_role
    const roles = JSON.parse(localStorage.getItem('roles') || '[]');
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    setUserRole(isAdmin ? 'ROLE_ADMIN' : null);
    setLoading(false);
  }, []);

//   Redirect non-admin users
  if (!loading && userRole !== 'ROLE_ADMIN') {
    return <Navigate to="/" replace />;
  }

  // ... keep existing code (stats, recentOrders, and getStatusColor functions)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
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
                            <div className="text-sm font-medium leading-none">Write Article</div>
                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                              Create new content for your blog
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
              <Card key={index} className="overflow-hidden">
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
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>Latest customer purchases</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentOrders.map((order) => (
                    <div key={order.id} className="flex items-center justify-between">
                      <div className="space-y-1">
                        <p className="text-sm font-medium">{order.customer}</p>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <span>{order.id}</span>
                          <span className="mx-1">•</span>
                          <span>{order.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium">{order.amount}</span>
                        <span className={cn("px-2 py-1 text-xs rounded-full", getStatusColor(order.status))}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))}
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
