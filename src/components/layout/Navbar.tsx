

import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn, UserPlus, LogOut, CheckCircle, LayoutDashboard, Package } from 'lucide-react';
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

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const { resetCart } = useCart();



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

    // Check user roles from localStorage
    // const roles = JSON.parse(localStorage.getItem('roles') || '[ADMIN_USER]');
    // const isAdmin = Array.isArray(roles) && roles.includes('ADMIN_USER');
    // setUserRole(isAdmin ? 'ADMIN_USER' : 'ADMIN_USER');

    // console.log('tttt', localStorage.getItem('roles'));
    const roles = JSON.parse(localStorage.getItem('roles') || null);
    const isAdmin = Array.isArray(roles) && roles.includes('ROLE_ADMIN');
    // console.log("isAdmin", isAdmin);
    // console.log("roles", roles);
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
        "fixed top-0 left-0 w-full z-50 transition-all duration-300",
        scrolled ?
          "bg-white/80 backdrop-blur-md shadow-sm dark:bg-black/80" :
          "bg-transparent"
      )}
    >
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center space-x-2 text-xl font-bold text-kitty-700"
          aria-label="kittyp home"
        >
          <span className="text-2xl font-extrabold tracking-tight">
            kitty<span className="text-kitty-600">p</span>
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
                    "text-sm font-medium hover:text-kitty-600 transition-colors",
                    isActive(link.path)
                      ? "text-kitty-600"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {link.name}
                </Link>
              </li>
            ))}

            {/* My Orders Link - Visible when user is logged in */}
            {isAuthenticated && (
              // <li>
                <button
                  onClick={() => navigate('/orders')}
                  className={cn(
                    "block text-md font-small hover:text-kitty-600 transition-colors flex items-center",
                    isActive('/orders')
                      ? "text-kitty-600"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <Package size={16} className="mr-2" />
                  My Orders
                </button>
              // </li>
            )}


            {/* Admin Dashboard Link - Only visible for ROLE_ADMIN */}
            {userRole === 'ROLE_ADMIN' && (
              <li>
                <button
                  onClick={navigateToAdmin}
                  className={cn(
                    "text-md font-small hover:text-kitty-600 transition-colors flex items-center",
                    isActive('/admin')
                      ? "text-kitty-600"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <LayoutDashboard size={16} className="mr-2" />
                  Admin
                </button>
              </li>
            )}
          </ul>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
                aria-label="Logout"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
                  aria-label="Login"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
                  aria-label="Sign Up"
                >
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            <CartSidebar />
          </div>
        </div>

        {/* Mobile Menu Button */}
        <div className="flex md:hidden items-center space-x-4">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Logout"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <Link
              to="/login"
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Login"
            >
              <LogIn size={20} />
            </Link>
          )}

          <CartSidebar />

          <button
            onClick={toggleMenu}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-expanded={isOpen}
            aria-label="Toggle menu"
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </nav>

      {/* Mobile Menu */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full md:hidden bg-white dark:bg-gray-900 transform transition-transform duration-300 ease-out-expo shadow-xl z-50",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="flex items-center justify-end p-4">
          <button
            onClick={closeMenu}
            className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        <nav className="px-4 py-6 space-y-8">
          <ul className="space-y-6">
            {navLinks.map((link) => (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={cn(
                    "block text-lg font-medium hover:text-kitty-600 transition-colors",
                    isActive(link.path)
                      ? "text-kitty-600"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  {link.name}
                </Link>
              </li>
            ))}

            {isAuthenticated && (
              <li>
                <button
                  onClick={() => navigate('/orders')}
                  className={cn(
                    "block text-md font-medium hover:text-kitty-600 transition-colors flex items-center",
                    isActive('/orders')
                      ? "text-kitty-600"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <Package size={20} className="mr-2" />
                  My Orders
                </button>
              </li>
            )}

            {/* Admin Dashboard Link - Only visible for ROLE_ADMIN */}
            {userRole === 'ROLE_ADMIN' && (
              <li>
                <button
                  onClick={navigateToAdmin}
                  className={cn(
                    "block text-md font-medium hover:text-kitty-600 transition-colors flex items-center",
                    isActive('/admin')
                      ? "text-kitty-600"
                      : "text-gray-700 dark:text-gray-300"
                  )}
                >
                  <LayoutDashboard size={20} className="mr-2" />
                  Admin Dashboard
                </button>
              </li>
            )}

            <li>
              {isAuthenticated ? (
                <button
                  onClick={handleLogout}
                  className="block text-lg font-medium hover:text-kitty-600 transition-colors"
                >
                  Logout
                </button>
              ) : (
                <>
                  <Link
                    to="/login"
                    className="block text-lg font-medium hover:text-kitty-600 transition-colors"
                  >
                    Login
                  </Link>
                  <Link
                    to="/signup"
                    className="block text-lg font-medium hover:text-kitty-600 transition-colors mt-4"
                  >
                    Sign Up
                  </Link>
                </>
              )}
            </li>
            <li>
              <Link
                to="/cart"
                className="block text-lg font-medium hover:text-kitty-600 transition-colors"
              >
                Cart
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Logout Success Dialog */}
      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircle size={20} />
              Logged Out Successfully
            </DialogTitle>
            <DialogDescription>
              You've been logged out. See you soon!
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end">
            <Button
              onClick={() => setShowSuccessDialog(false)}
              variant="outline"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}