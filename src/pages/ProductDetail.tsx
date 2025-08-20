import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';
import { ShoppingCart, Heart, ArrowLeft, Loader2, AlertCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { fetchProduct } from '@/module/slice/ProductSlice';
import { addToCartFromProduct } from '@/module/slice/CartSlice';
import { selectFavorites } from '@/module/slice/FavoritesSlice';
import Loading from '@/components/ui/loading';
import { toast } from 'sonner';
import { formatCurrency } from '@/services/cartService';
import { handleToggleFavorite } from '@/utils/favorites';

const ProductDetail = () => {
  const { uuid } = useParams<{ uuid: string }>();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [isFavoriteLoading, setIsFavoriteLoading] = useState(false);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  // Get state from Redux store
  const { currentProduct: product, isLoading, error } = useAppSelector((state) => state.productReducer);
  const { loading: cartLoading, items: cartItems } = useAppSelector((state) => state.cartReducer);
  const favorites = useAppSelector(selectFavorites);
  const userUuid = useAppSelector((state) => state.authReducer.user?.uuid);

  // Calculate available quantity based on stock and cart
  const cartItem = cartItems.find(item => item.productUuid === product?.uuid);
  const cartQuantity = cartItem?.quantity || 0;
  const availableQuantity = product ? Math.max(0, product.stockQuantity - cartQuantity) : 0;

  // Constants for description truncation
  const DESCRIPTION_MAX_LENGTH = 300;
  const shouldTruncate = product?.description && product.description.length > DESCRIPTION_MAX_LENGTH;

  useEffect(() => {
    if (uuid) {
      dispatch(fetchProduct(uuid));
    }
  }, [dispatch, uuid]);

  useEffect(() => {
    if (product?.productImageUrls?.length > 0) {
      setSelectedImage(product.productImageUrls[0]);
    }
  }, [product]);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
  
    if (!product) return;
  
    try {
      if (availableQuantity <= 0) {
        toast.warning("Maximum quantity in cart reached");
        return;
      }
  
      setIsAddingToCart(true);
      await dispatch(addToCartFromProduct(product)).unwrap();
    } catch (error) {
      console.error("Error adding to cart:", error);
      toast.error("Failed to add to cart");
    } finally {
      setIsAddingToCart(false);
    }
  };
  

  const isFavorite = (productId: string) => {
    return favorites.some(item => item.uuid === productId);
  };

  const handleToggleFavoriteWrapper = async () => {
    if (!product) return;
    setIsFavoriteLoading(true);
    try {
      await handleToggleFavorite(dispatch, userUuid, product, favorites);
    } finally {
      setIsFavoriteLoading(false);
    }
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  const getFormattedDescription = () => {
    if (!product?.description) return '';
    
    if (!isDescriptionExpanded && shouldTruncate) {
      return `${product.description.slice(0, DESCRIPTION_MAX_LENGTH)}...`;
    }
    
    return product.description;
  };

  if (isLoading) {
    return <Loading />;
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="flex flex-col items-center justify-center h-[60vh]">
            <h2 className="text-2xl font-bold text-foreground mb-4">
              {error || "Product not found"}
            </h2>
            <Button onClick={handleGoBack} variant="outline" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              Back to Products
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-muted">
              <img
                src={selectedImage || product.productImageUrls[0] || ''}
                alt={product.name}
                className="object-cover w-full h-full"
              />
            </div>

            {product.productImageUrls.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.productImageUrls.map((imageUrl, index) => (
                  <button
                    key={`product-image-index-number-${index}`}
                    onClick={() => setSelectedImage(imageUrl)}
                    className={cn(
                      "aspect-square rounded-md overflow-hidden border-2",
                      selectedImage === imageUrl ? "border-primary" : "border-transparent"
                    )}
                  >
                    <img
                      src={imageUrl}
                      alt={`${product.name} - view ${index + 1}`}
                      className="object-cover w-full h-full"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{product.name}</h1>
              <p className="mt-2 text-2xl font-semibold text-primary">
                {/* ${product.price.toFixed(2)} */}
                {formatCurrency(product.price, product.currency)}
              </p>
              <div className="mt-2 flex items-center gap-2 flex-wrap">
                <span className="inline-block px-3 py-1 text-xs font-medium bg-muted/80 text-muted-foreground rounded-full shadow-sm">
                  {product.category}
                </span>
                {availableQuantity <= 0 ? (
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full shadow-sm border border-red-200 dark:border-red-500/30">
                      <AlertCircle size={12} className="mr-1" />
                      {product.stockQuantity <= 0 ? "Out of Stock" : "Maximum quantity in cart"}
                    </span>
                  </div>
                ) : availableQuantity <= 2 ? (
                  <div className="flex items-center">
                    <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full shadow-sm border border-amber-200 dark:border-amber-500/30">
                      <AlertCircle size={12} className="mr-1" />
                      Only {availableQuantity} left available!
                    </span>
                  </div>
                ) : (
                  <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-emerald-100 dark:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-full shadow-sm border border-emerald-200 dark:border-emerald-500/30">
                    In Stock
                  </span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-medium text-foreground">Description</h3>
              <div className="prose dark:prose-invert max-w-none">
                <div className={cn(
                  "relative rounded-lg bg-muted/30 p-4",
                  !isDescriptionExpanded && shouldTruncate && "pb-12"
                )}>
                  <p className="text-foreground whitespace-pre-wrap">
                    {getFormattedDescription()}
                  </p>
                  {shouldTruncate && (
                    <Button
                      variant="ghost"
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className={cn(
                        "flex items-center gap-2 mt-2",
                        !isDescriptionExpanded && "absolute bottom-2 left-1/2 transform -translate-x-1/2"
                      )}
                    >
                      {isDescriptionExpanded ? (
                        <>Show Less <ChevronUp size={16} /></>
                      ) : (
                        <>Read More <ChevronDown size={16} /></>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            </div>

            {product.attributes && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium text-foreground">Specifications</h3>
                <div className="grid grid-cols-2 gap-4">
                  {product.attributes.color && (
                    <div>
                      <p className="text-sm text-muted-foreground">Color</p>
                      <p className="font-medium text-foreground">{product.attributes.color}</p>
                    </div>
                  )}
                  {product.attributes.size && (
                    <div>
                      <p className="text-sm text-muted-foreground">Size</p>
                      <p className="font-medium text-foreground">{product.attributes.size}</p>
                    </div>
                  )}
                  {product.attributes.material && (
                    <div>
                      <p className="text-sm text-muted-foreground">Material</p>
                      <p className="font-medium text-foreground">{product.attributes.material}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="pt-6 space-y-4">
              {availableQuantity <= 0 ? (
                <Button
                  disabled
                  className="w-full h-12 text-base flex items-center justify-center gap-2 bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30 hover:bg-red-100 dark:hover:bg-red-500/20"
                >
                  <AlertCircle className="h-5 w-5" />
                  <span>{product.stockQuantity <= 0 ? "Out of Stock" : "Maximum quantity in cart"}</span>
                </Button>
              ) : (
                <Button
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className={cn(
                    "w-full h-12 text-base flex items-center justify-center gap-2",
                    isAddingToCart && "opacity-70 cursor-not-allowed"
                  )}
                >
                  {isAddingToCart ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      <span>Adding to Cart...</span>
                    </>
                  ) : (
                    <>
                      <ShoppingCart className="h-5 w-5" />
                      <span>
                        {availableQuantity <= 2 
                          ? `Add to Cart (${availableQuantity} left)`
                          : 'Add to Cart'
                        }
                      </span>
                    </>
                  )}
                </Button>
              )}

              <Button
                variant="outline"
                onClick={handleToggleFavoriteWrapper}
                disabled={isAddingToCart || isFavoriteLoading}
                className={cn(
                  "w-full h-12 text-base flex items-center justify-center gap-2",
                  isFavorite(product.uuid) && "bg-primary/10 border-primary/20 hover:bg-primary/20"
                )}
              >
                <Heart
                  size={20}
                  className={cn(
                    isFavorite(product.uuid) && "text-primary fill-current"
                  )}
                />
                {isFavorite(product.uuid) ? 'Remove from Wishlist' : 'Add to Wishlist'}
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProductDetail;