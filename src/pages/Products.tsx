
import { useState, useEffect } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/ui/ProductCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';

// Mock products data
const allProducts = [
  {
    id: '1',
    name: 'Minimalist Desk Lamp',
    price: 89.99,
    description: 'A sleek, adjustable desk lamp with warm lighting.',
    image: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80',
    category: 'Lighting'
  },
  {
    id: '2',
    name: 'Ceramic Plant Pot',
    price: 34.99,
    description: 'Elegant ceramic pot for indoor plants.',
    image: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=800&auto=format&fit=crop&q=80',
    category: 'Home Decor'
  },
  {
    id: '3',
    name: 'Organic Cotton Throw',
    price: 59.99,
    description: 'Soft, sustainably sourced cotton throw blanket.',
    image: 'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=800&auto=format&fit=crop&q=80',
    category: 'Textiles'
  },
  {
    id: '4',
    name: 'Marble Coaster Set',
    price: 42.99,
    description: 'Set of four marble coasters with cork backing.',
    image: 'https://images.unsplash.com/photo-1517822336935-e6d451fcfbe7?w=800&auto=format&fit=crop&q=80',
    category: 'Accessories'
  },
  {
    id: '5',
    name: 'Wooden Serving Board',
    price: 49.99,
    description: 'Handcrafted wooden serving board for entertaining.',
    image: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa?w=800&auto=format&fit=crop&q=80',
    category: 'Kitchen'
  },
  {
    id: '6',
    name: 'Minimalist Wall Clock',
    price: 69.99,
    description: 'Simple, elegant wall clock with silent movement.',
    image: 'https://images.unsplash.com/photo-1507646227500-4d389b0012be?w=800&auto=format&fit=crop&q=80',
    category: 'Home Decor'
  },
  {
    id: '7',
    name: 'Ceramic Coffee Mug',
    price: 24.99,
    description: 'Handmade ceramic mug with matte finish.',
    image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=800&auto=format&fit=crop&q=80',
    category: 'Kitchen'
  },
  {
    id: '8',
    name: 'Linen Napkin Set',
    price: 32.99,
    description: 'Set of four stonewashed linen napkins.',
    image: 'https://images.unsplash.com/photo-1563341591-a4ef278917b7?w=800&auto=format&fit=crop&q=80',
    category: 'Textiles'
  },
  {
    id: '9',
    name: 'Brass Desk Organizer',
    price: 45.99,
    description: 'Sleek brass desk organizer for a tidy workspace.',
    image: 'https://images.unsplash.com/photo-1544247341-a381bf087cdb?w=800&auto=format&fit=crop&q=80',
    category: 'Accessories'
  },
  {
    id: '10',
    name: 'Modern Vase',
    price: 39.99,
    description: 'Contemporary ceramic vase with unique texture.',
    image: 'https://images.unsplash.com/photo-1612196808214-5aa89322992e?w=800&auto=format&fit=crop&q=80',
    category: 'Home Decor'
  },
  {
    id: '11',
    name: 'Woven Storage Basket',
    price: 28.99,
    description: 'Handwoven basket ideal for stylish storage.',
    image: 'https://images.unsplash.com/photo-1513519683267-4ee5f5082426?w=800&auto=format&fit=crop&q=80',
    category: 'Home Decor'
  },
  {
    id: '12',
    name: 'Scented Candle',
    price: 22.99,
    description: 'Soy wax candle in a minimalist ceramic container.',
    image: 'https://images.unsplash.com/photo-1603006905393-c65ef4de0555?w=800&auto=format&fit=crop&q=80',
    category: 'Accessories'
  }
];

const categories = [
  'All',
  'Home Decor',
  'Lighting',
  'Kitchen',
  'Textiles',
  'Accessories'
];

const priceRanges = [
  { label: 'Under $25', min: 0, max: 25 },
  { label: '$25 - $50', min: 25, max: 50 },
  { label: '$50 - $100', min: 50, max: 100 },
  { label: 'Over $100', min: 100, max: Infinity }
];

const Products = () => {
  const [filteredProducts, setFilteredProducts] = useState(allProducts);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<null | { min: number, max: number }>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  
  // Filter products based on category, price range and search query
  useEffect(() => {
    let result = allProducts;
    
    // Filter by category
    if (selectedCategory !== 'All') {
      result = result.filter(product => product.category === selectedCategory);
    }
    
    // Filter by price range
    if (selectedPriceRange) {
      result = result.filter(product => 
        product.price >= selectedPriceRange.min && 
        product.price <= selectedPriceRange.max
      );
    }
    
    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(product => 
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.category.toLowerCase().includes(query)
      );
    }
    
    setFilteredProducts(result);
  }, [selectedCategory, selectedPriceRange, searchQuery]);
  
  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange(null);
    setSearchQuery('');
  };
  
  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />
      
      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse our collection of premium quality products for your home
            </p>
          </div>
          
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters - Desktop */}
            <div className="hidden lg:block w-64 flex-shrink-0">
              <div className="sticky top-24 space-y-8">
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Categories</h3>
                  <div className="space-y-2">
                    {categories.map(category => (
                      <button
                        key={category}
                        onClick={() => setSelectedCategory(category)}
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedCategory === category
                            ? 'bg-kitty-50 text-kitty-600 dark:bg-kitty-900/50 dark:text-kitty-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-4">Price</h3>
                  <div className="space-y-2">
                    {priceRanges.map((range, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                          selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                            ? 'bg-kitty-50 text-kitty-600 dark:bg-kitty-900/50 dark:text-kitty-400'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                        }`}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>
                
                {(selectedCategory !== 'All' || selectedPriceRange || searchQuery) && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center text-kitty-600 dark:text-kitty-400 font-medium hover:text-kitty-700 dark:hover:text-kitty-300"
                  >
                    <X size={16} className="mr-1" />
                    Clear filters
                  </button>
                )}
              </div>
            </div>
            
            {/* Mobile filter button */}
            <div className="lg:hidden flex justify-between items-center mb-4">
              <button
                onClick={toggleMobileFilter}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filters
              </button>
              
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full px-4 py-2 pr-10 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 dark:bg-gray-800"
                />
                <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              </div>
            </div>
            
            {/* Mobile filters */}
            {isMobileFilterOpen && (
              <div className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={toggleMobileFilter}>
                <div
                  className="absolute right-0 top-0 h-full w-4/5 max-w-xs bg-white dark:bg-gray-900 p-6 overflow-y-auto"
                  onClick={e => e.stopPropagation()}
                >
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">Filters</h3>
                    <button onClick={toggleMobileFilter} className="text-gray-500">
                      <X size={24} />
                    </button>
                  </div>
                  
                  <div className="space-y-8">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Categories</h4>
                      <div className="space-y-2">
                        {categories.map(category => (
                          <button
                            key={category}
                            onClick={() => {
                              setSelectedCategory(category);
                              toggleMobileFilter();
                            }}
                            className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                              selectedCategory === category
                                ? 'bg-kitty-50 text-kitty-600 dark:bg-kitty-900/50 dark:text-kitty-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Price</h4>
                      <div className="space-y-2">
                        {priceRanges.map((range, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              setSelectedPriceRange({ min: range.min, max: range.max });
                              toggleMobileFilter();
                            }}
                            className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${
                              selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                                ? 'bg-kitty-50 text-kitty-600 dark:bg-kitty-900/50 dark:text-kitty-400'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                            }`}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {(selectedCategory !== 'All' || selectedPriceRange || searchQuery) && (
                      <button
                        onClick={() => {
                          clearFilters();
                          toggleMobileFilter();
                        }}
                        className="inline-flex items-center text-kitty-600 dark:text-kitty-400 font-medium hover:text-kitty-700 dark:hover:text-kitty-300"
                      >
                        <X size={16} className="mr-1" />
                        Clear filters
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            <div className="flex-1">
              {/* Search - Desktop */}
              <div className="hidden lg:flex justify-between items-center mb-6">
                <p className="text-gray-600 dark:text-gray-400">
                  Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
                </p>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full px-4 py-2 pr-10 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 dark:bg-gray-800"
                  />
                  <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>
              
              {/* Products grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredProducts.map((product, index) => (
                    <ProductCard 
                      key={product.id} 
                      product={product} 
                      index={index}
                      className="animate-fade-up" 
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No products found</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    Try adjusting your search or filter criteria
                  </p>
                  <button
                    onClick={clearFilters}
                    className="mt-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-kitty-600 hover:bg-kitty-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-kitty-500"
                  >
                    Clear all filters
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>
      </main>
      
      <Footer />
    </div>
  );
};

export default Products;
