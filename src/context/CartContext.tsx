
import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { toast } from "sonner";

export interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  image: string;
  category: string;
}

interface CartItem extends Product {
  quantity: number;
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  
  // Load cart from localStorage on initial render
  useEffect(() => {
    const savedCart = localStorage.getItem('kittyp-cart');
    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch (error) {
        console.error('Failed to parse cart data:', error);
      }
    }
  }, []);
  
  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('kittyp-cart', JSON.stringify(items));
  }, [items]);

  const addItem = (product: Product) => {
    setItems(currentItems => {
      // Check if item already exists in cart
      const existingItemIndex = currentItems.findIndex(item => item.id === product.id);
      
      if (existingItemIndex > -1) {
        // Increase quantity of existing item
        const updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        toast.success(`Added another ${product.name} to your cart`);
        return updatedItems;
      } else {
        // Add new item with quantity 1
        toast.success(`Added ${product.name} to your cart`);
        return [...currentItems, { ...product, quantity: 1 }];
      }
    });
  };
  
  const removeItem = (productId: string) => {
    setItems(currentItems => {
      const item = currentItems.find(item => item.id === productId);
      if (item) {
        toast.info(`Removed ${item.name} from your cart`);
      }
      return currentItems.filter(item => item.id !== productId);
    });
  };
  
  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }
    
    setItems(currentItems => 
      currentItems.map(item => 
        item.id === productId ? { ...item, quantity } : item
      )
    );
  };
  
  const clearCart = () => {
    setItems([]);
    toast.info('Your cart has been cleared');
  };
  
  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  
  const subtotal = items.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      itemCount, 
      subtotal 
    }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
