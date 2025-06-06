import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Heart, Loader2, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useFavorites } from '@/context/FavoritesContext';
import { Product } from '@/services/productService';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '@/module/store/store';
import { addToCartFromProduct } from '@/module/slice/CartSlice';
import { toast } from 'sonner';

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
  const { loading } = useSelector((state: RootState) => ({
    loading: state.cartReducer.loading || state.cartReducer.isCartLoading
  }));
  const { addFavorite, removeFavorite, isFavorite } = useFavorites();
  
  const handleAddToCart = async (e: React.MouseEvent) => {
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
  };

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favoriteProduct = {
      id: product.uuid,
      name: product.name,
      price: product.price,
      image: product.productImageUrls && product.productImageUrls[0] ? product.productImageUrls[0] : "",
    };
    if (isFavorite(product.uuid)) {
      removeFavorite(product.uuid);
    } else {
      addFavorite(favoriteProduct);
    }
  };

  const formatCurrency = (value: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
    }).format(value);
  };
  
  return (
    <div 
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-900 shadow-sm hover:shadow-md transition-all duration-300 ease-out",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        animationDelay: `${index * 100}ms`
      }}
    >
      <Link to={`/product/${product.uuid}`} className="block h-full">
        <div className="aspect-[4/5] relative overflow-hidden">
          {!isImageLoaded && (
            <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
          )}
          <img
            src={product.productImageUrls[0] ?? ""}
            alt={product.name}
            className={cn(
              "object-cover w-full h-full transform transition-transform duration-500",
              isHovered ? "scale-105" : "scale-100",
              isImageLoaded ? "opacity-100" : "opacity-0",
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
          
          <div className="absolute bottom-4 left-4 flex gap-2">
            <span className="inline-block px-3 py-1 text-xs font-medium bg-white/90 dark:bg-gray-800/90 text-gray-900 dark:text-white rounded-full shadow-sm backdrop-blur-sm">
              {product.category}
            </span>
            {product.stockQuantity <= 0 && (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 rounded-full shadow-sm backdrop-blur-sm border border-red-200 dark:border-red-500/30">
                Out of Stock
              </span>
            )}
            {product.stockQuantity > 0 && product.stockQuantity <= 2 && (
              <span className="inline-block px-3 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-500/20 text-amber-600 dark:text-amber-400 rounded-full shadow-sm backdrop-blur-sm border border-amber-200 dark:border-amber-500/30">
                Only {product.stockQuantity} left!
              </span>
            )}
          </div>
          
          <div 
            className={cn(
              "absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent transition-opacity duration-300",
              isHovered ? "opacity-100" : "opacity-0"
            )}
          />
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-gray-900 dark:text-white line-clamp-2">{product.name}</h3>
            {product.stockQuantity <= 0 && (
              <span className="flex items-center text-xs font-medium text-red-500 dark:text-red-400 ml-2">
                <AlertCircle size={14} className="mr-1" />
                No Stock
              </span>
            )}
          </div>
          <p className="mt-1 text-gray-700 dark:text-gray-300">
            {formatCurrency(product.price, product.currency)}
          </p>
        </div>
      </Link>
      
      <div 
        className={cn(
          "absolute bottom-4 right-4 flex space-x-2 transform transition-all duration-300",
          isHovered ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
        )}
      >
        <button
          onClick={handleAddToCart}
          disabled={isAddingToCart || loading || product.stockQuantity <= 0}
          className={cn(
            "p-2 rounded-full shadow-md transition-colors",
            product.stockQuantity <= 0
              ? "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-500/30"
              : "bg-white dark:bg-gray-800 hover:bg-kitty-50 dark:hover:bg-gray-700",
            (isAddingToCart || loading)
              ? "opacity-70 cursor-not-allowed"
              : ""
          )}
          aria-label={product.stockQuantity <= 0 ? "Out of stock" : "Add to cart"}
          title={product.stockQuantity <= 0 ? "Out of stock" : "Add to cart"}
        >
          {isAddingToCart || loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : product.stockQuantity <= 0 ? (
            <AlertCircle size={18} />
          ) : (
            <ShoppingCart size={18} className="text-gray-900 dark:text-white" />
          )}
        </button>
        <button
          onClick={handleToggleFavorite}
          className={cn(
            "p-2 bg-white dark:bg-gray-800 rounded-full shadow-md transition-colors",
            isFavorite(product.uuid) 
              ? "bg-pink-50 hover:bg-pink-100 dark:bg-pink-900 dark:hover:bg-pink-800" 
              : "hover:bg-kitty-50 dark:hover:bg-gray-700"
          )}
          aria-label="Toggle favorite"
        >
          <Heart 
            size={18} 
            className={cn(
              "transition-colors",
              isFavorite(product.uuid)
                ? "text-pink-500 dark:text-pink-400 fill-current"
                : "text-gray-900 dark:text-white"
            )} 
          />
        </button>
      </div>
    </div>
  );
}
