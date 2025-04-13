// import { useState, useEffect } from 'react';
// import { Link, useLocation } from 'react-router-dom';
// import { Menu, X, ShoppingCart, LogIn, UserPlus } from 'lucide-react';
// import { useCart } from '@/context/CartContext';
// import { cn } from '@/lib/utils';

// export function Navbar() {
//   const [isOpen, setIsOpen] = useState(false);
//   const { itemCount } = useCart();
//   const location = useLocation();

//   const toggleMenu = () => setIsOpen(!isOpen);
//   const closeMenu = () => setIsOpen(false);

//   // Close mobile menu when route changes
//   useEffect(() => {
//     closeMenu();
//   }, [location.pathname]);

//   const navLinks = [
//     { name: 'Home', path: '/' },
//     { name: 'How to Use', path: '/how-to-use' },
//     { name: 'Blog', path: '/blogs' },
//     { name: 'Contact', path: '/contact' }
//   ];

//   const isActive = (path: string) => {
//     if (path === '/' && location.pathname === '/') return true;
//     if (path !== '/' && location.pathname.startsWith(path)) return true;
//     return false;
//   };

//   return (
//     <header 
//       className={cn(
//         "fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white dark:bg-black shadow-sm"
//       )}
//     >
//       <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
//         <Link 
//           to="/" 
//           className="flex items-center space-x-2 text-xl font-bold"
//           aria-label="kittyp home"
//         >
//           <span className="text-2xl font-extrabold tracking-tight">
//                 kitty<span className="text-kitty-600">p</span>
//           </span>
//         </Link>

//         {/* Desktop Menu */}
//         <div className="hidden md:flex items-center space-x-8">
//           <ul className="flex space-x-8">
//             {navLinks.map((link) => (
//               <li key={link.path}>
//                 <Link
//                   to={link.path}
//                   className={cn(
//                     "text-sm font-medium hover:text-kitty-600 transition-colors",
//                     isActive(link.path) 
//                       ? "text-kitty-600" 
//                       : "text-gray-700 dark:text-gray-300"
//                   )}
//                 >
//                   {link.name}
//                 </Link>
//               </li>
//             ))}
//           </ul>

//           {/* <Link 
//             to="/cart" 
//             className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//             aria-label="Shopping Cart"
//           >
//             <ShoppingCart size={20} />
//             {itemCount > 0 && (
//               <span className="absolute -top-1 -right-1 bg-kitty-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
//                 {itemCount}
//               </span>
//             )}
//           </Link> */}

//         <div className="flex items-center space-x-4">
//             {/* <Link
//               to="/login"
//               className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
//               aria-label="Login"
//             >
//               <LogIn size={18} />
//               <span>Login</span>
//             </Link> */}

// <div className="flex items-center space-x-3">
//               <Link
//                 to="/login"
//                 className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
//                 aria-label="Login"
//               >
//                 <LogIn size={18} />
//                 <span>Login</span>
//               </Link>
//               <Link
//                 to="/signup"
//                 className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
//                 aria-label="Sign Up"
//               >
//                 <UserPlus size={18} />
//                 <span>Sign Up</span>
//               </Link>
//             </div>

//             <Link 
//               to="/cart" 
//               className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//               aria-label="Shopping Cart"
//             >
//               <ShoppingCart size={20} />
//               {itemCount > 0 && (
//                 <span className="absolute -top-1 -right-1 bg-kitty-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
//                   {itemCount}
//                 </span>
//               )}
//             </Link>
//           </div>
//         </div>

//         {/* Mobile Menu Button */}
//         <div className="flex md:hidden items-center space-x-4">
//         <Link 
//             to="/login"
//             className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//             aria-label="Login"
//           >
//             <LogIn size={20} />
//           </Link>
//           <Link 
//             to="/cart" 
//             className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//             aria-label="Shopping Cart"
//           >
//             <ShoppingCart size={20} />
//             {itemCount > 0 && (
//               <span className="absolute -top-1 -right-1 bg-kitty-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
//                 {itemCount}
//               </span>
//             )}
//           </Link>

//           <button
//             onClick={toggleMenu}
//             className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//             aria-expanded={isOpen}
//             aria-label="Toggle menu"
//           >
//             {isOpen ? <X size={24} /> : <Menu size={24} />}
//           </button>
//         </div>
//       </nav>

//       {/* Mobile Menu */}
//       {isOpen && (
//         <div 
//           className="fixed inset-0 bg-white dark:bg-gray-900 opacity-100 z-40"
//           onClick={closeMenu} // Close when clicking outside the menu
//         />
//       )}

//       <div 
//         className={cn(
//           "fixed inset-y-0 right-0 w-full md:hidden bg-white dark:bg-gray-900 shadow-xl z-50",
//           isOpen 
//             ? "translate-x-0 opacity-100 visible" 
//             : "translate-x-full opacity-0 invisible"
//         )}
//       >
//         <div className="flex items-center justify-end p-4">
//           <button
//             onClick={closeMenu}
//             className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
//             aria-label="Close menu"
//           >
//             <X size={24} />
//           </button>
//         </div>
//         <nav className="px-4 py-6 space-y-8">
//           <ul className="space-y-6">
//             {navLinks.map((link) => (
//               <li key={link.path}>
//                 <Link
//                   to={link.path}
//                   className={cn(
//                     "block text-lg font-medium hover:text-kitty-600 transition-colors",
//                     isActive(link.path) 
//                       ? "text-kitty-600" 
//                       : "text-gray-700 dark:text-gray-300"
//                   )}
//                 >
//                   {link.name}
//                 </Link>
//               </li>
//             ))}
//             <li>
//               <Link
//                 to="/login"
//                 className="block text-lg font-medium hover:text-kitty-600 transition-colors"
//               >
//                 Login
//               </Link>
//             </li>
//             <li>
//               <Link
//                 to="/signup"
//                 className="block text-lg font-medium hover:text-kitty-600 transition-colors"
//               >
//                 Sign Up
//               </Link>
//             </li>
//           </ul>
//         </nav>
//       </div>
//     </header>
//   );
// }


import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, ShoppingCart, LogIn, UserPlus, LogOut, CheckCircleIcon } from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { motion } from "framer-motion";
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
  const { itemCount } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const toggleMenu = () => setIsOpen(!isOpen);
  const closeMenu = () => setIsOpen(false);

  useEffect(() => {
    closeMenu();
  }, [location.pathname]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    setIsAuthenticated(!!token);
  }, [location.pathname]); // react to route changes (login/logout)

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setShowSuccessDialog(true);
    setTimeout(() => {
      navigate('/');
    }, 1500);
  };

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'How to Use', path: '/how-to-use' },
    // { name: 'Blog', path: '/blogs' },
    { name: 'Articles', path: '/articles' },
    { name: 'Contact', path: '/contact' }
  ];

  const isActive = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <header className={cn("fixed top-0 left-0 w-full z-50 transition-all duration-300 bg-white dark:bg-black shadow-sm")}>
      <nav className="container mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2 text-xl font-bold" aria-label="kittyp home">
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
          </ul>

          <div className="flex items-center space-x-4">
            {isAuthenticated ? (
              <button
                onClick={handleLogout}
                className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            ) : (
              <div className="flex items-center space-x-3">
                <Link
                  to="/login"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
                >
                  <LogIn size={18} />
                  <span>Login</span>
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center space-x-1 text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-kitty-600 transition-colors"
                >
                  <UserPlus size={18} />
                  <span>Sign Up</span>
                </Link>
              </div>
            )}

            {/* <Link
              to="/cart"
              className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              aria-label="Shopping Cart"
            >
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-kitty-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
                  {itemCount}
                </span>
              )}
            </Link> */}
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
          {/* <Link
            to="/cart"
            className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Shopping Cart"
          >
            <ShoppingCart size={20} />
            {itemCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-kitty-600 text-white w-5 h-5 flex items-center justify-center rounded-full text-xs">
                {itemCount}
              </span>
            )}
          </Link> */}
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

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-white dark:bg-gray-900 opacity-100 z-40"
          onClick={closeMenu}
        />
      )}

      {/* Mobile Slide-in Menu */}
      <div
        className={cn(
          "fixed inset-y-0 right-0 w-full md:hidden bg-white dark:bg-gray-900 shadow-xl z-50",
          isOpen
            ? "translate-x-0 opacity-100 visible"
            : "translate-x-full opacity-0 invisible"
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
                    className="block text-lg font-medium hover:text-kitty-600 transition-colors"
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

      <Dialog open={showSuccessDialog} onOpenChange={setShowSuccessDialog}>
        <DialogContent className="sm:max-w-md">
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-green-600">
              <CheckCircleIcon size={20} />
              Logged Out Successfully
            </DialogTitle>
            <DialogDescription>
              You’ve been logged out. See you soon!
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
          </motion.div>
        </DialogContent>
      </Dialog>

    </header>


  );
}
