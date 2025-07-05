import { Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import { CurrencyType, formatCurrency } from '@/services/cartService';
import { updateCartItemQuantity, removeItemFromCart, addToCart, resetCart, updateCartQuantity } from '@/module/slice/CartSlice';
import { RootState, AppDispatch } from '@/module/store/store';

interface CartItemProps {
  uuid: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  className?: string;
  currency: CurrencyType;
}

interface LoadingState {
  increment: boolean;
  decrement: boolean;
  remove: boolean;
}

export function CartItem({ uuid, name, price, image, quantity, className, currency }: CartItemProps) {
  const dispatch = useDispatch<AppDispatch>();
  const user = useSelector((state: RootState) => state.cartReducer.user);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [loadingStates, setLoadingStates] = useState<LoadingState>({
    increment: false,
    decrement: false,
    remove: false
  });

  const isLoading = Object.values(loadingStates).some(Boolean);
  
  const handleIncrement = async () => {
    if (loadingStates.increment) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, increment: true }));
      if (user?.uuid) {
        await dispatch(updateCartItemQuantity({
          userUuid: user.uuid,
          productUuid: uuid,
          quantity: quantity + 1
        })).unwrap();
      } else {
        dispatch(addToCart({
          uuid,
          name,
          price,
          stockQuantity: Infinity,
          currency,
          productImageUrls: [image],
          description: "",
          status: "active",
          category: "",
          attribute: {
            color: "",
            size: "",
            material: ""
          }
        }));
      }
    } catch (error) {
      console.error('Error incrementing quantity:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, increment: false }));
    }
  };
  
  const handleDecrement = async () => {
    if (loadingStates.decrement) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, decrement: true }));
      if (quantity > 1) {
        if (user?.uuid) {
          await dispatch(updateCartItemQuantity({
            userUuid: user.uuid,
            productUuid: uuid,
            quantity: quantity - 1
          })).unwrap();
        } else {
          dispatch(updateCartQuantity({
            uuid,
            quantity: quantity - 1
          }));
        }
      } else {
        await handleRemove();
      }
    } catch (error) {
      console.error('Error decrementing quantity:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, decrement: false }));
    }
  };
  
  const handleRemove = async () => {
    if (loadingStates.remove) return;
    
    try {
      setLoadingStates(prev => ({ ...prev, remove: true }));
      if (user?.uuid) {
        await dispatch(removeItemFromCart({
          userUuid: user.uuid,
          productUuid: uuid
        })).unwrap();
      } else {
        dispatch(resetCart());
      }
    } catch (error) {
      console.error('Error removing item:', error);
    } finally {
      setLoadingStates(prev => ({ ...prev, remove: false }));
    }
  };
  
  return (
    <div className={cn(
      "flex items-start space-x-4 py-6 border-b border-gray-200 dark:border-gray-800 relative",
      className
    )}>
      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-muted animate-pulse" />
        )}
        <Link to={`/product/${uuid}`}>
          <img
            src={image}
            alt={name}
            className={cn(
              "w-full h-full object-cover transition-opacity duration-300",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        </Link>
      </div>
      
      <div className="flex-1 min-w-0">
        <Link to={`/product/${uuid}`} className="hover:text-kitty-600 transition-colors">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{name}</h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(price.toFixed(2), currency)}
        </p>
        
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
            <button
              onClick={handleDecrement}
              className={cn(
                "p-1.5 transition-colors relative w-8 h-8 flex items-center justify-center",
                loadingStates.decrement 
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400"
              )}
              aria-label="Decrease quantity"
              disabled={isLoading}
            >
              {loadingStates.decrement ? (
                <Loader2 size={16} className="animate-spin absolute" />
              ) : (
                <Minus size={16} />
              )}
            </button>
            <span className="w-8 text-center text-sm border-x border-gray-200 dark:border-gray-700 py-1.5">
              {quantity}
            </span>
            <button
              onClick={handleIncrement}
              className={cn(
                "p-1.5 transition-colors relative w-8 h-8 flex items-center justify-center",
                loadingStates.increment 
                  ? "text-gray-400 cursor-not-allowed"
                  : "text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400"
              )}
              aria-label="Increase quantity"
              disabled={isLoading}
            >
              {loadingStates.increment ? (
                <Loader2 size={16} className="animate-spin absolute" />
              ) : (
                <Plus size={16} />
              )}
            </button>
          </div>
          
          <button
            onClick={handleRemove}
            className={cn(
              "transition-colors w-8 h-8 flex items-center justify-center relative",
              loadingStates.remove 
                ? "text-gray-400 cursor-not-allowed"
                : "text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400"
            )}
            aria-label="Remove item"
            disabled={isLoading}
          >
            {loadingStates.remove ? (
              <Loader2 size={18} className="animate-spin absolute" />
            ) : (
              <Trash2 size={18} />
            )}
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-base font-medium text-gray-900 dark:text-white">
          {formatCurrency((price * quantity).toFixed(2), currency)}
        </p>
      </div>
    </div>
  );
}
