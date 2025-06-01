import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, LogOut, CheckCircle, LayoutDashboard, Package, User2Icon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { CartSidebar } from './CartSidebar';
import { initializeUserAndCart } from '@/module/slice/CartSlice';
import { useDispatch } from 'react-redux';
import { AppDispatch } from '@/module/store';
import { ThemeSwitcher } from '../ui/theme-switcher';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { resetCart } = useCart();
  const dispatch = useDispatch<AppDispatch>();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    const roles = JSON.parse(localStorage.getItem('roles') || null);
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    setUserRole(isAdmin ? 'ROLE_ADMIN' : null);

    // Check authentication status
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
    

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    localStorage.removeItem('roles');
    setIsAuthenticated(false);
    setUserRole(null);
    setShowSuccessDialog(true);
    resetCart();
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    { name: 'How to Use', path: '/how-to-use' },
    { name: 'Articles', path: '/articles' },
    { name: 'Contact', path: '/contact' },
    // { name: 'Profile', path: '/profile' },

    // { name: 'My Orders', path: '/orders' }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const navigateToAdmin = () => {
    navigate('/admin');
    closeMenu();
  };

  return (
    <header
      className={cn(
        "fixed top-0 left-0 w-full z-50",
        isOpen ? "bg-background dark:bg-gray-900 shadow-sm transition-none" :
          scrolled
            ? "bg-background/80 backdrop-blur-md shadow-sm dark:bg-black/80 transition-all duration-300"
            : "bg-transparent transition-all duration-300"
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="inline-block">
          <span className="text-2xl font-extrabold tracking-tight">
            kitty<span className="text-primary">p</span>
          </span>
        </Link>

        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-8">
          <ul className="flex space-x-8">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={cn(
                    "text-sm font-medium hover:text-primary transition-colors",
                    isActive(link.path)
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  {link.name}
                </Link>
              </li>
            ))}

            {userRole === 'ROLE_ADMIN' && (
              <li>
                <button
                  onClick={navigateToAdmin}
                  className={cn(
                    "text-md font-small hover:text-primary transition-colors flex items-center",
                    isActive('/admin')
                      ? "text-primary"
                      : "text-foreground"
                  )}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  Admin
                </button>
              </li>
            )}
          </ul>

          <div className="flex items-center space-x-4">
            <ThemeSwitcher />
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  aria-label="Login"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  aria-label="Sign up"
                >
                  <UserPlus size={18} />
                  <span>Sign up</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex items-center space-x-4 md:hidden">
          <ThemeSwitcher />
          <button
            onClick={toggleMenu}
            className="text-foreground hover:text-primary transition-colors"
            aria-label={isOpen ? "Close menu" : "Open menu"}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={cn(
            "absolute top-full left-0 w-full bg-background/80 backdrop-blur-md md:hidden transition-all duration-300 ease-in-out border-t border-border",
            isOpen ? "opacity-100 visible" : "opacity-0 invisible"
          )}
        >
          <div className="container mx-auto px-4 py-4">
            <ul className="space-y-4">
              {navLinks.map((link) => (
                <li key={link.path}>
                  <Link
                    to={link.path}
                    className={cn(
                      "block text-sm font-medium hover:text-primary transition-colors",
                      isActive(link.path)
                        ? "text-primary"
                        : "text-foreground"
                    )}
                    onClick={closeMenu}
                  >
                    {link.name}
                  </Link>
                </li>
              ))}

              {userRole === 'ROLE_ADMIN' && (
                <li>
                  <button
                    onClick={navigateToAdmin}
                    className={cn(
                      "w-full text-left text-sm font-medium hover:text-primary transition-colors flex items-center",
                      isActive('/admin')
                        ? "text-primary"
                        : "text-foreground"
                    )}
                  >
                    <LayoutDashboard size={16} className="mr-2" />
                    Admin Dashboard
                  </button>
                </li>
              )}

              {isAuthenticated ? (
                <li>
                  <button
                    onClick={() => {
                      handleLogout();
                      closeMenu();
                    }}
                    className="w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                  >
                    <LogOut size={18} className="mr-2" />
                    Logout
                  </button>
                </li>
              ) : (
                <>
                  <li>
                    <Link
                      to="/login"
                      className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                      onClick={closeMenu}
                    >
                      <LogIn size={18} className="mr-2" />
                      Login
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/signup"
                      className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                      onClick={closeMenu}
                    >
                      <UserPlus size={18} className="mr-2" />
                      Sign up
                    </Link>
                  </li>
                </>
              )}
            </ul>
          </div>
        </div>
      </nav>

      {/* Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Logged Out Successfully</DialogTitle>
            <DialogDescription>
              You have been logged out of your account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-center items-center">
            <CheckCircle className="h-12 w-12 text-green-500" />
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}