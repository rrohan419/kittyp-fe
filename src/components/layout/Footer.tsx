
import { Link } from 'react-router-dom';
import { ArrowRight, Instagram, Twitter, Facebook, Linkedin } from 'lucide-react';

export function Footer() {
  const currentYear = new Date().getFullYear();
  
  return (
    <footer className="w-full bg-gray-50 dark:bg-gray-900 py-16">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-4 space-y-6">
            <Link to="/" className="inline-block">
              <span className="text-2xl font-extrabold tracking-tight">
                kitty<span className="text-kitty-600">p</span>
              </span>
            </Link>
            <p className="text-gray-600 dark:text-gray-400 max-w-md">
              Elegant, minimalist products designed with attention to detail and crafted for the modern lifestyle.
            </p>
            <div className="flex space-x-4">
              <a 
                href="https://instagram.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="text-gray-500 hover:text-kitty-600 transition-colors"
              >
                <Instagram size={20} />
              </a>
              <a 
                href="https://twitter.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Twitter"
                className="text-gray-500 hover:text-kitty-600 transition-colors"
              >
                <Twitter size={20} />
              </a>
              <a 
                href="https://facebook.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="Facebook"
                className="text-gray-500 hover:text-kitty-600 transition-colors"
              >
                <Facebook size={20} />
              </a>
              <a 
                href="https://linkedin.com" 
                target="_blank" 
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-500 hover:text-kitty-600 transition-colors"
              >
                <Linkedin size={20} />
              </a>
            </div>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Shop
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/products" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  All Products
                </Link>
              </li>
              <li>
                <Link to="/products?category=new" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  New Arrivals
                </Link>
              </li>
              <li>
                <Link to="/products?category=bestsellers" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  Best Sellers
                </Link>
              </li>
              <li>
                <Link to="/products?category=sale" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  Sale
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-2 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Company
            </h3>
            <ul className="space-y-2">
              <li>
                <Link to="/about" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/blogs" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link to="/how-to-use" className="text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                  How to Use
                </Link>
              </li>
            </ul>
          </div>
          
          <div className="md:col-span-4 space-y-4">
            <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-900 dark:text-gray-100">
              Subscribe
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Stay updated with our latest products and offers.
            </p>
            <form className="flex w-full max-w-md">
              <input
                type="email"
                placeholder="Your email"
                className="flex-grow min-w-0 px-4 py-2 rounded-l-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 dark:bg-gray-800"
                required
              />
              <button
                type="submit"
                className="inline-flex items-center justify-center px-4 py-2 bg-kitty-600 text-white rounded-r-md hover:bg-kitty-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 focus:ring-offset-2 transition-colors"
              >
                <span className="sr-only">Subscribe</span>
                <ArrowRight size={16} />
              </button>
            </form>
          </div>
        </div>
        
        <div className="border-t border-gray-200 dark:border-gray-800 mt-12 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © {currentYear} kittyp. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <Link to="/privacy" className="text-sm text-gray-500 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                Privacy Policy
              </Link>
              <Link to="/terms" className="text-sm text-gray-500 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                Terms of Service
              </Link>
              <Link to="/sitemap" className="text-sm text-gray-500 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors">
                Sitemap
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
