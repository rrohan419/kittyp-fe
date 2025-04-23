
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '@/context/CartContext';
import { cn } from '@/lib/utils';
import { CurrencyType, formatCurrency } from '@/services/cartService';

interface CartItemProps {
  uuid: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  className?: string;
  currency: CurrencyType;
}

export function CartItem({ uuid, name, price, image, quantity, className, currency }: CartItemProps) {
  const { updateQuantity, removeItem } = useCart();
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const handleIncrement = () => {
    updateQuantity(uuid, quantity + 1);
  };
  
  const handleDecrement = () => {
    if (quantity > 1) {
      updateQuantity(uuid, quantity - 1);
    } else {
      removeItem(uuid);
    }
  };
  
  const handleRemove = () => {
    removeItem(uuid);
  };
  
  return (
    <div className={cn("flex items-start space-x-4 py-6 border-b border-gray-200 dark:border-gray-800", className)}>
      <div className="relative w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
        {!isImageLoaded && (
          <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800 animate-pulse" />
        )}
        <Link to={`/products/${uuid}`}>
          <img
            src={image}
            alt={name}
            className={cn(
              "w-full h-full object-cover transition-opacity",
              isImageLoaded ? "opacity-100" : "opacity-0"
            )}
            onLoad={() => setIsImageLoaded(true)}
          />
        </Link>
      </div>
      
      <div className="flex-1 min-w-0">
        <Link to={`/products/${uuid}`} className="hover:text-kitty-600 transition-colors">
          <h3 className="text-base font-medium text-gray-900 dark:text-white">{name}</h3>
        </Link>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {formatCurrency(price.toFixed(2), currency)}
        </p>
        
        <div className="mt-4 flex items-center space-x-4">
          <div className="flex items-center border border-gray-200 dark:border-gray-700 rounded-md">
            <button
              onClick={handleDecrement}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus size={16} />
            </button>
            <span className="w-8 text-center text-sm">{quantity}</span>
            <button
              onClick={handleIncrement}
              className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-kitty-600 dark:hover:text-kitty-400 transition-colors"
              aria-label="Increase quantity"
            >
              <Plus size={16} />
            </button>
          </div>
          
          <button
            onClick={handleRemove}
            className="text-gray-500 dark:text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
            aria-label="Remove item"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>
      
      <div className="text-right">
        <p className="text-base font-medium text-gray-900 dark:text-white">
          {/* ${(price * quantity).toFixed(2)} */}
          {formatCurrency((price * quantity).toFixed(2), currency)}
        </p>
      </div>
    </div>
  );
}
