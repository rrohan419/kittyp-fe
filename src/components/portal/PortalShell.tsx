import { useState, useEffect } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Menu,
  ChevronLeft,
  Search,
  Bell,
  LogOut,
  LayoutDashboard,
  Globe,
  X,
  RefreshCw,
} from 'lucide-react';
import { useDispatch, useSelector } from 'react-redux';
import { selectCartItems } from '@/module/slice/CartSlice';
import { NavItem, PortalConfig } from '@/config/portal';
import { AppDispatch, RootState } from '@/module/store/store';
import { clearUser, setActiveRole } from '@/module/slice/AuthSlice';
import { AppRole } from '@/utils/roles';

interface PortalShellProps {
  config: PortalConfig;
}

function isActiveLink(currentPath: string, item: NavItem) {
  if (item.end) return currentPath === item.path;
  return currentPath === item.path || currentPath.startsWith(item.path + '/');
}

export function PortalShell({ config }: PortalShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const cartItems = useSelector(selectCartItems);
  const { user } = useSelector((s: RootState) => s.authReducer);
  const itemCount = cartItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const canSwitchRole = (user?.roles?.length ?? 0) > 1;

  // Auto-collapse on tablet
  useEffect(() => {
    const handler = () => {
      const w = window.innerWidth;
      if (w >= 1024 && w < 1280) setCollapsed(true);
    };
    handler();
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('role');
    localStorage.removeItem('activeClinicId');
    localStorage.removeItem('access_token');
    localStorage.removeItem('roles');
    dispatch(clearUser());
    navigate('/login');
  };

  const handleSwitchRole = () => {
    dispatch(setActiveRole(null));
    navigate('/select-role', {
      state: { roles: (user?.roles || []) as AppRole[] },
    });
  };

  const Brand = config.brandIcon;

  return (
    <div className="min-h-screen bg-background flex">
      {/* Desktop Sidebar */}
      <aside
        className={cn(
          'hidden lg:flex fixed left-0 top-0 z-40 h-screen bg-card border-r border-border flex-col transition-all duration-300',
          collapsed ? 'w-[68px]' : 'w-[250px]'
        )}
      >
        <SidebarInner config={config} collapsed={collapsed} setCollapsed={setCollapsed} onLogout={handleLogout} />
      </aside>

      {/* Mobile Drawer */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-[280px] bg-card">
          <SidebarInner config={config} collapsed={false} setCollapsed={() => {}} onLogout={handleLogout} mobile />
        </SheetContent>
      </Sheet>

      {/* Main column */}
      <div
        className={cn(
          'flex-1 flex flex-col min-w-0 transition-all duration-300',
          'lg:ml-[250px]',
          collapsed && 'lg:ml-[68px]'
        )}
      >
        {/* Topbar */}
        <header className="sticky top-0 z-30 h-16 bg-background/80 backdrop-blur-md border-b border-border flex items-center gap-3 px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open menu"
          >
            <Menu className="h-5 w-5" />
          </Button>

          {/* Mobile brand */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brand className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-foreground">{config.name}</span>
          </div>

          {/* Search */}
          <div className="hidden md:flex flex-1 max-w-md ml-2">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-9 h-9 bg-muted/50 border-0" />
            </div>
          </div>

          <div className="flex-1 md:hidden" />

          {/* Right cluster */}
          <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
            <Bell className="h-5 w-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-2 rounded-full hover:bg-muted px-1 py-1 transition-colors" aria-label="Profile menu">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-xs font-semibold text-primary">{config.user.initials}</span>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col">
                  <span className="text-sm">{config.user.name}</span>
                  <span className="text-[11px] text-muted-foreground font-normal">{config.user.subtitle}</span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to={config.basePath}>
                  <LayoutDashboard className="h-4 w-4 mr-2" />
                  {config.subtitle || 'Dashboard'}
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/">
                  <Globe className="h-4 w-4 mr-2" />
                  Public site
                </Link>
              </DropdownMenuItem>
              {canSwitchRole && (
                <DropdownMenuItem onClick={handleSwitchRole}>
                  <RefreshCw className="h-4 w-4 mr-2" />Switch role
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        {/* Content */}
        <main className="flex-1 pb-20 lg:pb-6">
          <Outlet />
        </main>

        {/* Mobile Bottom Tabs */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 h-16 bg-background/95 backdrop-blur-md border-t border-border flex items-center justify-around px-1"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        >
          {config.bottomTabs.map((item) => {
            const Icon = item.icon;
            const active = isActiveLink(location.pathname, item);
            const isCart = item.path === '/app/cart';
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full rounded-lg transition-colors min-w-0',
                  active ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <div className="relative">
                  <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
                  {isCart && itemCount > 0 && (
                    <span className="absolute -top-1.5 -right-2 min-w-4 h-4 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-semibold flex items-center justify-center">
                      {itemCount}
                    </span>
                  )}
                </div>
                <span className="text-[10px] font-medium truncate max-w-full px-1">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function SidebarInner({
  config,
  collapsed,
  setCollapsed,
  onLogout,
  mobile = false,
}: {
  config: PortalConfig;
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  onLogout: () => void;
  mobile?: boolean;
}) {
  const location = useLocation();
  const cartItems = useSelector(selectCartItems);
  const itemCount = cartItems.reduce((sum, it) => sum + (it.quantity || 0), 0);
  const Brand = config.brandIcon;

  return (
    <>
      {/* Logo */}
      <div className="flex items-center justify-between px-4 py-5 border-b border-border">
        {!collapsed && (
          <Link to={config.basePath} className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Brand className="h-4 w-4 text-primary-foreground" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-bold text-foreground leading-none truncate">{config.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{config.subtitle}</p>
            </div>
          </Link>
        )}
        {collapsed && (
          <Link
            to={config.basePath}
            className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto"
            aria-label="Portal home"
          >
            <Brand className="h-4 w-4 text-primary-foreground" />
          </Link>
        )}
        {!mobile && (
          <Button
            variant="ghost"
            size="icon"
            className={cn('h-7 w-7 shrink-0', collapsed && 'mx-auto mt-2')}
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {config.navItems.map((item) => {
          const Icon = item.icon;
          const active = isActiveLink(location.pathname, item);
          const isCart = item.path === '/app/cart';
          const badge = isCart ? (itemCount > 0 ? String(itemCount) : undefined) : item.badge;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors group relative min-h-[44px]',
                active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={cn('h-5 w-5 shrink-0', active && 'text-primary')} />
              {!collapsed && (
                <>
                  <span className="flex-1 truncate">{item.label}</span>
                  {badge && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-[10px] bg-primary/10 text-primary border-0">
                      {badge}
                    </Badge>
                  )}
                </>
              )}
              {collapsed && badge && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground text-[9px] flex items-center justify-center">
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Footer profile + logout */}
      <div className="p-3 border-t border-border">
        {!collapsed && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-xs font-semibold text-primary">{config.user.initials}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{config.user.name}</p>
              <p className="text-[11px] text-muted-foreground truncate">{config.user.subtitle}</p>
            </div>
          </div>
        )}
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors',
            collapsed && 'justify-center'
          )}
        >
          <LogOut className="h-5 w-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </>
  );
}
