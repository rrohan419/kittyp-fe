import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

interface BlogPost {
  id: string;
  title: string;
  excerpt: string;
  date: string;
  image: string;
  readTime: string;
  category: string;
}

const blogPosts: BlogPost[] = [
  {
    id: '1',
    title: 'Sustainable Cat Litter Solutions for Eco-Conscious Owners',
    excerpt: 'Discover how to choose environmentally friendly cat litter without compromising on quality...',
    date: 'Mar 15, 2024',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80',
    readTime: '5 min read',
    category: 'Eco Care'
  },
  {
    id: '2',
    title: 'Reducing Your Cat\'s Carbon Pawprint: A Practical Guide',
    excerpt: 'Learn effective strategies to minimize your feline friend\'s environmental impact...',
    date: 'Mar 12, 2024',
    image: '/images/blog-2.jpg',
    readTime: '8 min read',
    category: 'Sustainability'
  },
  {
    id: '3',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '4',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '5',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '6',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '7',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '8',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '9',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  },
  {
    id: '10',
    title: 'Natural Health Tips for Indoor Cats',
    excerpt: 'Essential health practices and natural remedies for keeping your indoor cat happy...',
    date: 'Mar 10, 2024',
    image: '/images/blog-3.jpg',
    readTime: '6 min read',
    category: 'Health'
  }
];

const Blogs = () => {
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      
      <main className="pt-24">
        <section className="pb-16 pt-8 md:pb-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div className="max-w-2xl">
                <span className="text-sm font-medium text-kitty-600 dark:text-kitty-400">
                  Feline Knowledge Hub
                </span>
                <h1 className="mt-2 text-4xl font-bold text-gray-900 dark:text-white">
                  Cat Care & Sustainability Blog
                </h1>
                <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
                  Expert insights on eco-friendly cat care, health optimization, and sustainable pet parenting.
                </p>
              </div>
            </div>

            {/* Blog Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {blogPosts.map((post, index) => (
                <article 
                  key={`blog-post-id-${post.id}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 animate-fade-in"
                >
                  <Link to={`/blogs/${post.id}`} className="block">
                    <div className="aspect-[16/9] relative overflow-hidden">
                      <img
                        src={post.image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900/50 dark:from-gray-900/70" />
                      <div className="absolute bottom-4 left-4">
                        <span className="inline-block px-3 py-1 text-sm font-medium text-white bg-kitty-600 rounded-full">
                          {post.category}
                        </span>
                      </div>
                    </div>
                    <div className="p-6">
                      <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                        <time>{post.date}</time>
                        <span>{post.readTime}</span>
                      </div>
                      <h2 className="mt-3 text-xl font-bold text-gray-900 dark:text-white group-hover:text-kitty-600 dark:group-hover:text-kitty-400 transition-colors">
                        {post.title}
                      </h2>
                      <p className="mt-3 text-gray-600 dark:text-gray-400">
                        {post.excerpt}
                      </p>
                      <div className="mt-4 inline-flex items-center text-kitty-600 dark:text-kitty-400 font-medium group-hover:text-kitty-700 dark:group-hover:text-kitty-300 transition-colors">
                        Read Article
                        <ArrowRight size={16} className="ml-2 transition-transform group-hover:translate-x-1" />
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-12 flex justify-center gap-2">
              {[1, 2, 3].map((page) => (
                <button
                  key={`blog-post-page-number-${page}`}
                  className={`px-4 py-2 rounded-lg ${
                    page === 1 
                      ? 'bg-kitty-600 text-white'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Blogs;










