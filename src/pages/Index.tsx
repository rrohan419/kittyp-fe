
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';
import { ProductCard } from '@/components/ui/ProductCard';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, staggerContainer } from '@/utils/animations';
import { useEffect, useState } from 'react';
import { fetchFilteredProducts, Product, ProductFilterRequest } from '@/services/productService';
import { ArticleSearchRequest, fetchArticles } from '@/services/articleService';


const productDto: ProductFilterRequest = { isRandom: true, category: null, maxPrice: null, minPrice: null, name: null, status: null };
const articleDto: ArticleSearchRequest = {isRandom: true, name: null};



const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [featuredArticle, setFeaturedArticle] = useState([]);

  useEffect(() => {
    const loadFeaturedProducts = async () => {
      setIsLoading(true);
      try {
        const response = await fetchFilteredProducts({
          page: 1,
          size: 4,
          body: productDto
        });
        setFeaturedProducts(response.data.models);
      } catch (error) {
        console.error('Error loading products:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const blogPosts = async () =>{
      setIsLoading(true);
      try {
        const response = await fetchArticles({
          page: 1,
          size: 3,
          body: articleDto
        });

        setFeaturedArticle(response.data.models);
      } catch (error) {
        console.error('Error loading articles:', error);
      } finally{
        setIsLoading(false);
      }
    };

    loadFeaturedProducts();
    blogPosts();
  }, []);
  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="pt-8">
        <Hero />

        {/* Featured Products (will require later)*/}
        <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
            <div className="max-w-lg">
              <span className="text-sm font-medium text-kitty-600 dark:text-kitty-400">
                Our Products
              </span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                Eco-Friendly Cat Litter
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Discover our natural, sustainable cat litter made from renewable plant materials. Better for your cat, your home, and our planet.
              </p>
            </div>
            <Link
              to="/products"
              className="mt-6 md:mt-0 inline-flex items-center text-kitty-600 dark:text-kitty-400 hover:text-kitty-700 dark:hover:text-kitty-300 font-medium"
            >
              View all products
              <ArrowRight size={16} className="ml-2" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {featuredProducts.map((product, index) => (
              <ProductCard
                key={`home-product-card-product-uuid-${product.uuid}`}
                product={product}
                index={index}
                className="animate-fade-up"
              />
            ))}
          </div>
        </section>

        {/* Product Categories (will require later) */}
        {/* <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <span className="text-sm font-medium text-kitty-600 dark:text-kitty-400">
                Categories
              </span>
              <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                Shop by Collection
              </h2>
              <p className="mt-4 text-gray-600 dark:text-gray-400">
                Explore our range of eco-friendly cat care products
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { name: 'Cat Litter', image: 'https://images.unsplash.com/photo-1581467655410-0c2bf55d9d6c?w=800&auto=format&fit=crop&q=80' },
                { name: 'Litter Boxes', image: 'https://images.unsplash.com/photo-1607242430639-e01659245b58?w=800&auto=format&fit=crop&q=80' },
                { name: 'Accessories', image: 'https://images.unsplash.com/photo-1563170423-5040126672dd?w=800&auto=format&fit=crop&q=80' }
              ].map((category, index) => (
                <Link
                  key={category.name}
                  to={`/products?category=${encodeURIComponent(category.name)}`}
                  className="group relative h-80 rounded-2xl overflow-hidden shadow-md"
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-xl font-semibold text-white mb-2">{category.name}</h3>
                    <span className="inline-flex items-center text-sm font-medium text-white">
                      Shop Now
                      <ArrowRight size={14} className="ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section> */}

        {/* Features */}
        <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-sm font-medium text-kitty-600 dark:text-kitty-400">
              Why Choose Us
            </span>
            <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
              The Kitty Litter Difference
            </h2>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              We believe in sustainability, performance, and happy cats — creating products that are better for everyone.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Planet-Friendly Materials',
                description: 'Made from renewable plant resources that are biodegradable and compostable.',
                icon: (
                  <svg className="w-10 h-10 text-kitty-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: 'Superior Odor Control',
                description: 'Natural formulas that trap and neutralize odors better than traditional clay litters.',
                icon: (
                  <svg className="w-10 h-10 text-kitty-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                  </svg>
                )
              },
              {
                title: 'Healthier for Cats',
                description: 'Dust-free, chemical-free formulas that are gentle on sensitive paws and lungs.',
                icon: (
                  <svg className="w-10 h-10 text-kitty-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div
                key={`feature-title-${feature.title}`}
                className="flex flex-col items-center text-center bg-white dark:bg-gray-900 p-8 rounded-2xl shadow-sm"
                style={{ animationDelay: `${index * 100 + 300}ms` }}
              >
                <div className="p-3 bg-kitty-50 dark:bg-kitty-900/30 rounded-full mb-6">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Featured Blog Posts */}
        <section className="py-16 md:py-24 bg-gray-50 dark:bg-gray-900">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12">
              <div className="max-w-lg">
                <span className="text-sm font-medium text-kitty-600 dark:text-kitty-400">
                  From Our Blog
                </span>
                <h2 className="mt-2 text-3xl font-bold text-gray-900 dark:text-white">
                  Cat Care Articles
                </h2>
                <p className="mt-4 text-gray-600 dark:text-gray-400">
                  Learn about eco-friendly cat care, health tips, and how to reduce your pet's environmental impact.
                </p>
              </div>
              <Link
                to="/articles"
                className="mt-6 md:mt-0 inline-flex items-center text-kitty-600 dark:text-kitty-400 hover:text-kitty-700 dark:hover:text-kitty-300 font-medium"
              >
                View all articles
                <ArrowRight size={16} className="ml-2" />
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredArticle.map((post, index) => (
                <Link
                  key={`post.id-${post.id}`}
                  to={`/article/${post.slug}`}
                  className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300"
                  style={{ animationDelay: `${index * 100 + 200}ms` }}
                >
                  <div className="aspect-[16/9] relative overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-6">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{post.date}</span>
                    <h3 className="mt-2 text-xl font-semibold text-gray-900 dark:text-white group-hover:text-kitty-600 dark:group-hover:text-kitty-400 transition-colors">
                      {post.title}
                    </h3>
                    <p className="mt-3 text-gray-600 dark:text-gray-400">
                      {post.excerpt}
                    </p>
                    <div className="mt-4 inline-flex items-center text-kitty-600 dark:text-kitty-400 font-medium">
                      Read more
                      <ArrowRight size={14} className="ml-1 transition-transform duration-300 group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Newsletter */}
        <section className="py-16 md:py-24 container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative bg-kitty-50 dark:bg-kitty-900/20 rounded-3xl overflow-hidden">
            <div className="absolute top-0 right-0 w-1/3 h-full opacity-10 bg-noise" />

            <div className="relative grid grid-cols-1 lg:grid-cols-2 gap-12 p-8 md:p-12 lg:p-16 items-center">
              <div className="space-y-6">
                <span className="text-sm font-medium text-kitty-600 dark:text-kitty-400">
                  Join Our Community
                </span>
                <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Subscribe for cat care tips
                </h2>
                <p className="text-gray-600 dark:text-gray-400 max-w-md">
                  Get the latest eco-friendly cat care tips, special offers, and updates on new products delivered to your inbox.
                </p>

                <form className="flex flex-col sm:flex-row gap-3 max-w-md">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="flex-grow min-w-0 px-4 py-3 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 dark:bg-gray-800"
                    required
                  />
                  <button
                    type="submit"
                    className="inline-flex justify-center px-6 py-3 bg-kitty-600 text-white rounded-md hover:bg-kitty-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 focus:ring-offset-2 transition-colors"
                  >
                    Subscribe
                  </button>
                </form>

                <p className="text-sm text-gray-500 dark:text-gray-400">
                  By subscribing, you agree to our Privacy Policy and consent to receive updates.
                </p>
              </div>

              <div className="hidden lg:block relative h-full">
                <img
                  src="https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?w=800&auto=format&fit=crop&q=80"
                  alt="Cat with eco-friendly litter"
                  className="rounded-xl shadow-lg object-cover w-full max-h-96"
                />
                <div className="absolute -top-8 -left-8 w-64 h-64 bg-kitty-200 dark:bg-kitty-800/40 rounded-full blur-3xl -z-10" />
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
