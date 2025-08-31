import { useLocation, Link, useParams } from 'react-router-dom';
import { Home, ChevronRight } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { useAppSelector } from '@/module/store/hooks';

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    icon?: LucideIcon;
    dynamic?: boolean;
  };
}

const breadcrumbConfig: BreadcrumbConfig = {
  '/': { label: 'Home', icon: Home },
  '/products': { label: 'Products' },
  '/product': { label: 'Product Details', dynamic: true },
  '/how-to-use': { label: 'How to Use' },
  '/why-eco-litter': { label: 'Why Eco Litter' },
  '/about': { label: 'About Us' },
  '/contact': { label: 'Contact' },
  '/articles': { label: 'Articles' },
  '/article': { label: 'Article', dynamic: true },
  '/cart': { label: 'Shopping Cart' },
  '/checkout': { label: 'Checkout' },
  '/orders': { label: 'My Orders' },
  '/orders/': { label: 'Order Details', dynamic: true },
  '/profile': { label: 'Profile' },
  '/login': { label: 'Login' },
  '/signup': { label: 'Sign Up' },
  '/forgot-password': { label: 'Forgot Password' },
  '/verify-reset-code': { label: 'Verify Code' },
  '/reset-password': { label: 'Reset Password' },
  '/admin': { label: 'Admin Dashboard' },
  '/admin/users': { label: 'User Management' },
  '/admin/orders': { label: 'Order Management' },
  '/admin/products': { label: 'Product Management' },
  '/admin/articles': { label: 'Article Management' },
  '/admin/articles/new': { label: 'New Article' },
  '/admin/articles/edit': { label: 'Edit Article', dynamic: true },
  '/privacy': { label: 'Privacy Policy' },
  '/terms': { label: 'Terms of Service' },
  '/sitemap': { label: 'Sitemap' },
  '/sitemap.xml': { label: 'XML Sitemap' },
};

interface BreadcrumbItem {
  label: string;
  path: string;
  icon?: LucideIcon;
  isLast: boolean;
}

export function GlobalBreadcrumbs() {
  const location = useLocation();
  const params = useParams();
  const pathnames = location.pathname.split('/').filter((x) => x);
  const { currentProduct: product } = useAppSelector((state) => state.productReducer);

  // Don't show breadcrumbs on home page
  if (location.pathname === '/') {
    return null;
  }

  const generateBreadcrumbs = (): BreadcrumbItem[] => {
    const breadcrumbs = [
      {
        label: 'Home',
        path: '/',
        icon: Home,
        isLast: false,
      },
    ];

    let currentPath = '';
    let skipNext = false;

    pathnames.forEach((pathname, index) => {
      if (skipNext) {
        skipNext = false;
        return;
      }

      currentPath += `/${pathname}`;
      const isLast = index === pathnames.length - 1;

      // Special handling for article detail pages
      if (pathname === 'article' && index + 1 < pathnames.length) {
        // Add Articles as the parent
        breadcrumbs.push({
          label: 'Articles',
          path: '/articles',
          icon: undefined,
          isLast: false,
        });
        
        // Add the article title
        const articleTitle = decodeURIComponent(pathnames[index + 1]).replace(/-/g, ' ');
        currentPath += `/${pathnames[index + 1]}`;
        breadcrumbs.push({
          label: articleTitle,
          path: currentPath,
          icon: undefined,
          isLast: true,
        });
        
        skipNext = true;
        return;
      }

      // Special handling for product detail pages
      if (pathname === 'product' && index + 1 < pathnames.length) {
        // Add Products as the parent
        breadcrumbs.push({
          label: 'Products',
          path: '/products',
          icon: undefined,
          isLast: false,
        });
        
        // Add the product name
        const productName = product?.name || decodeURIComponent(pathnames[index + 1]);
        currentPath += `/${pathnames[index + 1]}`;
        breadcrumbs.push({
          label: productName,
          path: currentPath,
          icon: undefined,
          isLast: true,
        });
        
        skipNext = true;
        return;
      }

      // Normal breadcrumb handling
      const config = breadcrumbConfig[currentPath];
      breadcrumbs.push({
        label: config?.label || pathname.charAt(0).toUpperCase() + pathname.slice(1).replace(/-/g, ' '),
        path: currentPath,
        icon: config?.icon,
        isLast,
      });
    });

    return breadcrumbs;
  };

  const breadcrumbs = generateBreadcrumbs();

  return (
    <div className="w-full bg-background/95 border-b border-border/40 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-9 items-center">
          <Breadcrumb>
            <BreadcrumbList className="flex items-center gap-1.5">
              {breadcrumbs.map((breadcrumb, index) => (
                <BreadcrumbItem key={breadcrumb.path} className="flex items-center">
                  {!breadcrumb.isLast ? (
                    <>
                      <BreadcrumbLink asChild>
                        <Link 
                          to={breadcrumb.path}
                          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary transition-colors duration-200"
                        >
                          {breadcrumb.icon && (
                            <breadcrumb.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                          )}
                          <span className="line-clamp-1">{breadcrumb.label}</span>
                        </Link>
                      </BreadcrumbLink>
                      <BreadcrumbSeparator className="text-muted-foreground/50">
                        <ChevronRight className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      </BreadcrumbSeparator>
                    </>
                  ) : (
                    <BreadcrumbPage className="flex items-center gap-1.5 text-sm font-medium text-primary">
                      {breadcrumb.icon && (
                        <breadcrumb.icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                      )}
                      <span className="line-clamp-1">{breadcrumb.label}</span>
                    </BreadcrumbPage>
                  )}
                </BreadcrumbItem>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </div>
    </div>
  );
}