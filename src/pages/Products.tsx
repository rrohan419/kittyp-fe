import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { fetchFilteredProducts, Product, ProductDto, ProductFilterRequest } from '@/services/productService';
import { ProductCard } from '@/components/ui/ProductCard';
import { Search, SlidersHorizontal, X, PackageSearch } from 'lucide-react';
import { Footer } from '@/components/layout/Footer';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { selectFavorites } from '@/module/slice/FavoritesSlice';
import { toast } from 'sonner';
import { useSelector } from 'react-redux';
import { RootState } from '@/module/store/store';
import { handleToggleFavorite } from '@/utils/favorites';

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
  const [productCount, setProductCount] = useState(0);
  const [page, setPage] = useState(1);
  const [productDto, setProductDto] = useState<ProductFilterRequest>({
    name: null,
    category: null,
    minPrice: null,
    maxPrice: null,
    status: null,
    isRandom : false,
  });

  const dispatch = useAppDispatch();
  const favorites = useAppSelector(selectFavorites);
  const { user } = useSelector((state: RootState) => state.cartReducer);

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
      setProductCount(response.data.totalElements);

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

  const handleToggleFavoriteWrapper = async (product: Product) => {
    await handleToggleFavorite(dispatch, user.uuid, product, favorites);
  };

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
    <div className="min-h-screen bg-background text-foreground">
      <main className="pt-24">
        <section className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 space-y-4">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Discover Our Products
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl">
              Browse our curated collection of premium quality products for your feline friend. 
              From cozy beds to tasty treats, we've got everything your cat needs.
            </p>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters - Desktop */}
            <div className="hidden lg:block w-72 flex-shrink-0">
              <div className="sticky top-24 space-y-8 rounded-xl border bg-card p-6">
                <div>
                  <h3 className="font-semibold text-lg text-foreground mb-4">Categories</h3>
                  <div className="space-y-1.5">
                    {categories.map(category => (
                      <button
                        key={`desktop-filter-category-${category}`}
                        onClick={() => setSelectedCategory(category)}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200",
                          selectedCategory === category
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-border pt-6">
                  <h3 className="font-semibold text-lg text-foreground mb-4">Price Range</h3>
                  <div className="space-y-1.5">
                    {priceRanges.map((range, index) => (
                      <button
                        key={`desktop-filter-range-${index}`}
                        onClick={() => setSelectedPriceRange({ min: range.min, max: range.max })}
                        className={cn(
                          "w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200",
                          selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                        )}
                      >
                        {range.label}
                      </button>
                    ))}
                  </div>
                </div>

                {(selectedCategory !== 'All' || selectedPriceRange || searchQuery) && (
                  <div className="border-t border-border pt-6">
                    <Button
                    onClick={clearFilters}
                      variant="outline"
                      className="w-full justify-start"
                  >
                      <X size={16} className="mr-2" />
                      Clear all filters
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Mobile filter button */}
            <div className="lg:hidden flex gap-4 mb-6">
              <Button
                onClick={toggleMobileFilter}
                variant="outline"
                className="flex-1"
              >
                <SlidersHorizontal size={16} className="mr-2" />
                Filters
              </Button>

              <div className="relative flex-[2]">
                <Input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={e => {
                    const value = e.target.value;
                    setSearchQuery(value);
                    setProductDto(prev => ({
                      ...prev,
                      name: value
                    }));
                  }}
                  className="w-full pr-10"
                />
                <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
              </div>
            </div>

            {/* Mobile filters */}
            {isMobileFilterOpen && (
              <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 lg:hidden" onClick={toggleMobileFilter}>
                <div
                  className="absolute right-0 top-0 h-full w-4/5 max-w-xs bg-background p-6 shadow-lg"
                  onClick={e => e.stopPropagation()}
                >
                  <ScrollArea className="h-full pr-4">
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-lg font-semibold">Filters</h3>
                      <Button variant="ghost" size="icon" onClick={toggleMobileFilter}>
                        <X size={20} />
                      </Button>
                  </div>

                    <div className="space-y-6">
                    <div>
                        <h4 className="font-medium mb-3">Categories</h4>
                        <div className="space-y-1.5">
                        {categories.map(category => (
                          <button
                              key={`mobile-filter-category-${category}`}
                            onClick={() => {
                              setSelectedCategory(category);
                              toggleMobileFilter();
                            }}
                            className={cn(
                                "w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200",
                              selectedCategory === category
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            {category}
                          </button>
                        ))}
                      </div>
                    </div>

                      <div className="border-t border-border pt-6">
                        <h4 className="font-medium mb-3">Price Range</h4>
                        <div className="space-y-1.5">
                        {priceRanges.map((range, index) => (
                          <button
                            key={`mobile-filter-range-${index}`}
                            onClick={() => {
                              setSelectedPriceRange({ min: range.min, max: range.max });
                              toggleMobileFilter();
                            }}
                            className={cn(
                                "w-full text-left px-4 py-2.5 rounded-lg transition-all duration-200",
                              selectedPriceRange?.min === range.min && selectedPriceRange?.max === range.max
                                  ? "bg-primary text-primary-foreground shadow-md"
                                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                            )}
                          >
                            {range.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {(selectedCategory !== 'All' || selectedPriceRange || searchQuery) && (
                        <div className="border-t border-border pt-6">
                          <Button
                        onClick={() => {
                          clearFilters();
                          toggleMobileFilter();
                        }}
                            variant="outline"
                            className="w-full justify-start"
                      >
                            <X size={16} className="mr-2" />
                            Clear all filters
                          </Button>
                        </div>
                    )}
                  </div>
                  </ScrollArea>
                </div>
              </div>
            )}

            <div className="flex-1 min-w-0">
              {/* Search - Desktop */}
              <div className="hidden lg:flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="px-3 py-1">
                    {displayedProducts.length} {displayedProducts.length === 1 ? 'product' : 'products'}
                  </Badge>
                  {(selectedCategory !== 'All' || selectedPriceRange) && (
                    <div className="flex gap-2">
                      {selectedCategory !== 'All' && (
                        <Badge variant="outline" className="px-3 py-1">
                          {selectedCategory}
                        </Badge>
                      )}
                      {selectedPriceRange && (
                        <Badge variant="outline" className="px-3 py-1">
                          {priceRanges.find(r => r.min === selectedPriceRange.min)?.label}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
                <div className="relative w-72">
                  <Input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={e => {
                      const value = e.target.value;
                      setSearchQuery(value);
                      setProductDto(prev => ({
                        ...prev,
                        name: value
                      }));
                    }}
                    className="pr-10"
                  />
                  <Search size={18} className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                </div>
              </div>

              {/* Products grid */}
              {products.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product, index) => (
                    <ProductCard
                      key={`product.grid.product-uuid-${product.uuid}`}
                      product={product}
                      index={index}
                      className="animate-fade-up"
                      onToggleFavorite={() => handleToggleFavoriteWrapper(product)}
                      isFavorite={favorites.some(item => item.uuid === product.uuid)}
                    />
                  ))}
                </div>
              ) : isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" />
                  <p className="text-lg">Loading products...</p>
                </div>
              ) : hasMore ? (
                <div ref={loaderRef} className="py-10">&nbsp;</div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <PackageSearch size={48} className="text-muted-foreground mb-4" />
                  <h3 className="text-xl font-medium mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-6">
                    Try adjusting your search or filter criteria
                  </p>
                  <Button onClick={clearFilters} variant="default">
                    Clear all filters
                  </Button>
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