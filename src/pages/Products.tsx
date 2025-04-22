
import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchFilteredProducts, Product, ProductDto, ProductFilterRequest } from '@/services/productService';
import { Navbar } from '@/components/layout/Navbar';
import { ProductCard } from '@/components/ui/ProductCard';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';


const Products: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPriceRange, setSelectedPriceRange] = useState<null | { min: number, max: number }>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const observer = useRef<IntersectionObserver | null>(null);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const [page, setPage] = useState(1);
  const [productDto, setProductDto] = useState<ProductFilterRequest>({
    name: null,
    category: null,
    minPrice: null,
    maxPrice: null,
    status: null,
  });

  const loadProducts = useCallback(async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const response = await fetchFilteredProducts({
        page,
        size: 10,
        body: productDto
      });

      const newProducts = response.data.models;
      console.log('Fetched Products:', response.data);
      console.log('newProducts Products:', newProducts);

      setProducts(prev => [...prev, ...newProducts]);
      setHasMore(!response.data.isLast);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, hasMore, isLoading, productDto]);

  const categories = [
    'All',
    'Cat Litter',
    'toys',
    'food',
    'Accessories'
  ];

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedPriceRange(null);
    setSearchQuery('');
  };

  const toggleMobileFilter = () => {
    setIsMobileFilterOpen(!isMobileFilterOpen);
  };

  const priceRanges = [
    { label: 'Under $25', min: 0, max: 25 },
    { label: '$25 - $50', min: 25, max: 50 },
    { label: '$50 - $100', min: 50, max: 100 },
    { label: 'Over $100', min: 100, max: Infinity }
  ];

  const displayedProducts = useMemo(() => {
    let filtered = [...products];

    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  }, [products, searchQuery]);

  useEffect(() => {
    setProducts([]);  // Reset products when filters change
    setPage(1);       // Reset pagination
    setHasMore(true); // Reset flag
  }, [productDto]);



  useEffect(() => {
    loadProducts();
  }, [page]);

  useEffect(() => {
    if (observer.current) observer.current.disconnect();

    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => prev + 1);
      }
    });

    if (loaderRef.current) observer.current.observe(loaderRef.current);

    return () => {
      if (observer.current) observer.current.disconnect();
    };
  }, [hasMore]);



  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <Navbar />

      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Products</h1>
            <p className="mt-2 text-gray-600 dark:text-gray-400">
              Browse our collection of premium quality products for your feline friend
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
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${selectedCategory === category
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
                        className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
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
                  // onChange={e => setSearchQuery(e.target.value)}
                  onChange={e => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    setProductDto(prev => ({
                      ...prev,
                      name: value
                    }));
                  }}
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
                            className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${selectedCategory === category
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
                            className={`block w-full text-left px-3 py-2 rounded-md transition-colors ${selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
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
                  Showing {displayedProducts.length} {displayedProducts.length === 1 ? 'product' : 'products'}
                </p>
                <div className="relative w-64">
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    // onChange={e => setSearchQuery(e.target.value)}
                    onChange={e => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      setProductDto(prev => ({
                        ...prev,
                        name: value
                      }));
                    }}
                    className="w-full px-4 py-2 pr-10 rounded-md border border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-kitty-500 dark:bg-gray-800"
                  />
                  <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              {/* Products grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.uuid}
                      product={product}
                      index={index}
                      className="animate-fade-up"
                    />
                  ))}
                </div>
              ) : isLoading ? (
                <div className="text-center py-10 text-muted-foreground">Loading more articles...</div>
              ) : hasMore ? (
                <div ref={loaderRef} className="text-center py-10 text-muted-foreground">&nbsp;</div>
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
}

export default Products;