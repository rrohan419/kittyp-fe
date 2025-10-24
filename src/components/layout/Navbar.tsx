import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, LogOut, CheckCircle, LayoutDashboard, Package, User2Icon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogPortal,
  DialogOverlay
} from '@/components/ui/dialog';
import { Button } from '../ui/button';
import { CartSidebar } from './CartSidebar';
import { switchToGuestCart } from '@/module/slice/CartSlice';
import { clearUser } from '@/module/slice/AuthSlice';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { ThemeSwitcher } from '../ui/theme-switcher';
import { UserProfile } from '@/services/authService';

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  // Get auth state from AuthSlice
  const { user, isAuthenticated: authIsAuthenticated, loading: authLoading } = useSelector((state: RootState) => state.authReducer);
  const isAuthenticated = authIsAuthenticated && !isLoggingOut;
  const userRole = user?.roles?.includes('ROLE_ADMIN') ? 'ROLE_ADMIN' : null;
  // const isVet = user?.roles?.includes('VET') || false;

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    const handleScroll = () => {
      const shouldBeScrolled = window.scrollY > 20;
      if (scrolled !== shouldBeScrolled) {
        setScrolled(shouldBeScrolled);
      }
    };

    // console.log('isAuthenticated:', isAuthenticated);

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Initial check
    return () => window.removeEventListener('scroll', handleScroll);
  }, [scrolled]);

  // Close mobile menu when route changes
  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);
      closeMenu();

      // First, clear auth data from localStorage
      localStorage.removeItem('access_token');
      localStorage.removeItem('user');
      localStorage.removeItem('roles');

      // Then dispatch actions in sequence
      await dispatch(switchToGuestCart()).unwrap();
      dispatch(clearUser());

      // Show success dialog
      setShowSuccessDialog(true);

      // Navigate after a short delay
      setTimeout(() => {
        setShowSuccessDialog(false);
        navigate('/', { replace: true });
        // Reset logout state after navigation
        setTimeout(() => {
          setIsLoggingOut(false);
        }, 100);
      }, 1500);
    } catch (error) {
      console.error('Error during logout:', error);
      setIsLoggingOut(false);
      setShowSuccessDialog(false);
    }
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Products', path: '/products' },
    // { name: 'Vet Consultation', path: '/vet' },
    { name: 'AI Assistant', path: '/ai-assistant' },
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
    <>
      <header
        className={cn(
          "fixed top-0 left-0 w-full z-50 isolate",
          isOpen ? "bg-background dark:bg-gray-900 shadow-sm" :
            scrolled
              ? "bg-background/95 backdrop-blur-sm shadow-sm dark:bg-black/95"
              : "bg-background/80 dark:bg-black/80"
        )}
        style={{
          WebkitFontSmoothing: 'none',
          MozOsxFontSmoothing: 'grayscale',
          textShadow: 'none',
          textRendering: 'optimizeLegibility'
        }}
      >
        <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <Link to="/" className="inline-block relative z-[9999]">
            <span className="text-2xl font-extrabold tracking-tight text-foreground">
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
                      "text-sm font-medium transition-colors text-foreground",
                      isActive(link.path)
                        ? "text-primary"
                        : "hover:text-primary"
                    )}
                    style={{ textShadow: 'none' }}
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
                      "text-sm font-medium transition-colors flex items-center text-foreground",
                      isActive('/admin')
                        ? "text-primary"
                        : "hover:text-primary"
                    )}
                    style={{ textShadow: 'none' }}
                  >
                    <LayoutDashboard size={16} className="mr-2" />
                    Admin
                  </button>
                </li>
              )}
            </ul>

            <div className="flex items-center space-x-4">
              <div className="w-9">
                <ThemeSwitcher />
              </div>
              <CartSidebar />
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
                    style={{ textShadow: 'none' }}
                    aria-label="Profile"
                  >
                    <User2Icon size={18} />
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
                    style={{ textShadow: 'none' }}
                    aria-label="Logout"
                  >
                    <LogOut size={18} />
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-3">
                  <Link
                    to="/login"
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
                    style={{ textShadow: 'none' }}
                    aria-label="Login"
                  >
                    <LogIn size={18} />
                    <span>Login</span>
                  </Link>
                  <Link
                    to="/signup"
                    className="flex items-center space-x-1 text-sm font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
                    style={{ textShadow: 'none' }}
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
            <div className="w-9">
              <ThemeSwitcher />
            </div>
            <CartSidebar />
            <button
              onClick={toggleMenu}
              className="text-foreground hover:text-primary transition-colors"
              style={{ textShadow: 'none' }}
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
            style={{ textShadow: 'none' }}
          >
            <div className="container mx-auto px-4 py-4">
              <ul className="space-y-4">
                {navLinks.map((link) => (
                  <li key={link.path}>
                    <Link
                      to={link.path}
                      className={cn(
                        "block text-sm font-medium transition-colors text-foreground",
                        isActive(link.path)
                          ? "text-primary"
                          : "hover:text-primary"
                      )}
                      style={{ textShadow: 'none' }}
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
                        "w-full text-left text-sm font-medium transition-colors flex items-center text-foreground",
                        isActive('/admin')
                          ? "text-primary"
                          : "hover:text-primary"
                      )}
                      style={{ textShadow: 'none' }}
                    >
                      <LayoutDashboard size={16} className="mr-2" />
                      Admin Dashboard
                    </button>
                  </li>
                )}

                {isAuthenticated ? (
                  <>
                    <li>
                      <Link
                        to="/profile"
                        className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                        style={{ textShadow: 'none' }}
                        onClick={closeMenu}
                      >
                        <User2Icon size={18} className="mr-2" />
                        Profile
                      </Link>
                    </li>
                    {/* <li>
                      <Link
                        to="/bookings"
                        className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                        style={{ textShadow: 'none' }}
                        onClick={closeMenu}
                      >
                        <Package size={18} className="mr-2" />
                        My Bookings
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/orders"
                        className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                        style={{ textShadow: 'none' }}
                        onClick={closeMenu}
                      >
                        <Package size={18} className="mr-2" />
                        My Orders
                      </Link>
                    </li>
                    {isVet && (
                      <li>
                        <Link
                          to="/vet-dashboard"
                          className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                          style={{ textShadow: 'none' }}
                          onClick={closeMenu}
                        >
                          <LayoutDashboard size={18} className="mr-2" />
                          Vet Dashboard
                        </Link>
                      </li>
                    )}
                    {!isVet && (
                      <li>
                        <Link
                          to="/vet/onboarding"
                          className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                          style={{ textShadow: 'none' }}
                          onClick={closeMenu}
                        >
                          <User2Icon size={18} className="mr-2" />
                          Become a Vet
                        </Link>
                      </li>
                    )} */}
                    <li>
                      <button
                        onClick={() => {
                          handleLogout();
                          closeMenu();
                        }}
                        className="w-full text-left text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                        style={{ textShadow: 'none' }}
                      >
                        <LogOut size={18} className="mr-2" />
                        Logout
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li>
                      <Link
                        to="/login"
                        className="block text-sm font-medium text-foreground hover:text-primary transition-colors flex items-center"
                        style={{ textShadow: 'none' }}
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
                        style={{ textShadow: 'none' }}
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
      </header>

      {/* Success Dialog */}

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogPortal>
          <DialogOverlay className="z-[100]" />
          <DialogContent className="z-[100] fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%]">
            <DialogHeader>
              <DialogTitle>Logged Out Successfully</DialogTitle>
              <DialogDescription>
                You have been logged out of your account.
              </DialogDescription>
            </DialogHeader>

            <div className="flex justify-center items-center mt-4">
              <CheckCircle className="h-12 w-12 text-green-500" />
            </div>
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </>
  );
}