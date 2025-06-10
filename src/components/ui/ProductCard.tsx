import { useState, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Loader2, AlertCircle, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';
import { Product } from '@/services/productService';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch } from '@/module/store/store';
import { addToCartFromProduct, selectCartLoading } from '@/module/slice/CartSlice';
import { toast } from 'sonner';
import { Badge } from './badge';
import { Button } from './button';
import { formatCurrency } from '@/services/cartService';

interface ProductCardProps {
  product: Product;
  index?: number;
  className?: string;
}

export function ProductCard({ product, index = 0, className }: ProductCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const loading = useSelector(selectCartLoading);
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stockQuantity <= 0) {
      toast.error("This product is out of stock");
      return;
    }

    try {
      setIsAddingToCart(true);
      await dispatch(addToCartFromProduct(product)).unwrap();
    } catch (error) {
      console.error('Error adding to cart:', error);
    } finally {
      setIsAddingToCart(false);
    }
  }, [dispatch, product]);

  const favoriteProduct = useMemo(() => ({
    id: product.uuid,
    name: product.name,
    price: product.price,
    image: product.productImageUrls && product.productImageUrls[0] ? product.productImageUrls[0] : "",
  }), [product.uuid, product.name, product.price, product.productImageUrls]);

  const handleToggleFavorite = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (isFavorite(product.uuid)) {
      removeFavorite(product.uuid);
    } else {
      addFavorite(favoriteProduct);
    }
  }, [product.uuid, favoriteProduct, isFavorite, removeFavorite, addFavorite]);

  // const formatCurrency = useCallback((value: number, currency: string) => {
  //   return new Intl.NumberFormat("en-US", {
  //     style: "currency",
  //     currency,
  //     minimumFractionDigits: 2,
  //   }).format(value);
  // }, []);
  
  const isProductFavorite = useMemo(() => isFavorite(product.uuid), [isFavorite, product.uuid]);

  // Generate random rating for demo (replace with actual rating system)
  const rating = useMemo(() => (Math.random() * 2 + 3).toFixed(1), []);
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-xl border bg-card text-card-foreground",
        "transition-all duration-300 ease-out hover:shadow-xl hover:shadow-primary/5",
        "transform-gpu hover:-translate-y-1",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <Link to={`/product/${product.uuid}`} className="block h-full">
        <div className="aspect-[4/5] relative overflow-hidden rounded-t-xl">
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-muted animate-pulse" />
          )}
          <img
            src={product.productImageUrls[0] ?? ""}
            alt={product.name}
            className={cn(
              "object-cover w-full h-full transform transition-all duration-500",
              isHovered ? "scale-110" : "scale-100",
              isImageLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <Badge variant={product.stockQuantity <= 0 ? "destructive" : product.stockQuantity <= 2 ? "secondary" : "default"}>
              {product.stockQuantity <= 0 ? (
                <span className="flex items-center gap-1">
                  <AlertCircle size={12} />
                  Out of Stock
                </span>
              ) : product.stockQuantity <= 2 ? (
                <span className="flex items-center gap-1">
                  <AlertCircle size={12} />
                  Only {product.stockQuantity} left!
                </span>
              ) : (
                <span>In Stock</span>
              )}
            </Badge>
            <Badge variant="outline" className="bg-background/50 backdrop-blur-sm">
              {product.category}
            </Badge>
          </div>
          
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-background/80 via-background/20 to-transparent opacity-0 transition-opacity duration-300",
              isHovered && "opacity-100"
            )}
          />
        </div>
        
        <div className="p-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-medium text-lg leading-tight line-clamp-2">{product.name}</h3>
              <div className="flex items-center gap-1 text-yellow-500 shrink-0">
                <Star size={14} fill="currentColor" />
                <span className="text-sm font-medium">{rating}</span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <p className="text-lg font-semibold text-primary">
                {formatCurrency(product.price, product.currency)}
              </p>
              <div className="flex items-center gap-2 sm:opacity-0 sm:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200">
                <Button
                  size="icon"
                  variant={isProductFavorite ? "destructive" : "secondary"}
                  onClick={handleToggleFavorite}
                  className={cn(
                    "h-9 w-9 rounded-full transition-transform hover:scale-105",
                    isProductFavorite && "hover:bg-destructive/90"
                  )}
                >
                  <Heart 
                    size={16} 
                    className={cn(
                      "transition-colors",
                      isProductFavorite && "fill-current"
                    )} 
                  />
                </Button>
                <Button
                  size="icon"
                  variant={product.stockQuantity <= 0 ? "destructive" : "default"}
                  onClick={handleAddToCart}
                  disabled={isAddingToCart || loading || product.stockQuantity <= 0}
                  className="h-9 w-9 rounded-full transition-transform hover:scale-105"
                >
                  {isAddingToCart || loading ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : product.stockQuantity <= 0 ? (
                    <AlertCircle size={16} />
                  ) : (
                    <ShoppingCart size={16} />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </div>
  );
}
