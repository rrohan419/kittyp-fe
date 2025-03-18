
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-radial from-kitty-50/30 to-transparent dark:from-kitty-900/10 dark:to-transparent -z-10" />
      
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-22">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 max-w-xl animate-fade-up">
            <span className="inline-block px-3 py-1 text-sm font-medium bg-kitty-100 text-kitty-800 dark:bg-kitty-900 dark:text-kitty-200 rounded-full">
              Eco-friendly. Odor Control. Happy Cats.
            </span>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight text-gray-900 dark:text-white">
              Better litter for your <span className="text-kitty-600">feline friend</span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Sustainable cat litter that's kind to your cat, your home, and our planet. Exceptional odor control with all-natural ingredients.
            </p>
            
            <div className="flex flex-wrap gap-4">
              {/* <Link
                to="/products"
                className="inline-flex items-center px-6 py-3 bg-kitty-600 text-white rounded-md hover:bg-kitty-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 focus:ring-offset-2 transition-colors"
              >
                Shop Now
                <ArrowRight size={16} className="ml-2" />
              </Link> */}
              <Link
                to="/why-eco-litter"
                className="inline-flex items-center px-6 py-3 bg-kitty-600 text-white rounded-md hover:bg-kitty-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 focus:ring-offset-2 transition-colors"
              >
                Why Eco-Litter?
                <ArrowRight size={16} className="ml-2" />
              </Link>
              {/* <Link
                to="/why-eco-litter"
                className="inline-flex items-center px-6 py-3 bg-transparent border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-kitty-500 focus:ring-offset-2 transition-colors"
              >
                Why Eco-Litter?
              </Link> */}
            </div>
          </div>
          
          <div className="relative animate-fade-in animate-delay-300">
            <div className="aspect-square relative rounded-3xl overflow-hidden shadow-2xl transform rotate-1">
              <img
                src="https://images.unsplash.com/photo-1582562124811-c09040d0a901?auto=format&fit=crop&q=80&w=1500"
                alt="Happy cat with eco-friendly litter"
                className="w-full h-full object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            </div>
            
            <div className="absolute -bottom-6 -left-6 w-56 h-24 bg-white dark:bg-gray-900 rounded-xl shadow-lg p-4 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white dark:border-gray-800">
                <img
                  src="https://images.unsplash.com/photo-1535268647677-300dbf3d78d1?auto=format&fit=crop&q=80&w=400"
                  alt="Customer's cat"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <div className="flex gap-1">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">Cats & owners love it!</p>
              </div>
            </div>
            
            <div className="absolute -top-12 right-16 w-40 h-40 bg-kitty-100 dark:bg-kitty-900/60 rounded-full blur-3xl -z-10" />
            <div className="absolute bottom-20 -right-12 w-64 h-64 bg-blue-100 dark:bg-blue-900/40 rounded-full blur-3xl -z-10" />
          </div>
        </div>
        
        <div className="mt-24 md:mt-32 py-8 flex flex-wrap justify-between items-center gap-8 border-t border-gray-200 dark:border-gray-800">
          <div className="flex items-center gap-4">
            <div className="flex -space-x-2">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 overflow-hidden">
                  <img
                    src={`https://randomuser.me/api/portraits/${i % 2 === 0 ? 'women' : 'men'}/${i + 20}.jpg`}
                    alt={`Customer ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                </div>
              ))}
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">10,000+</span> happy cats & owners
            </p>
          </div>
          
          <div className="flex flex-wrap gap-8 text-center">
            {['100% Eco-Friendly', 'Superior Odor Control', 'Dust-Free Formula', 'Compostable'].map((item, i) => (
              <div key={i} className="text-sm text-gray-600 dark:text-gray-400 font-medium">
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
