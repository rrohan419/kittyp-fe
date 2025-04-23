import {
  cartByUserUuid,
  createCart,
  OrderPayload,
  OrderItem,
  Address,
  CurrencyType
} from '@/services/cartService';
import { fetchUserDetail, UserProfile } from '@/services/authService';
import { Product } from '@/services/productService';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface CartItem extends Product {
  quantity: number;
  itemDetails?: {
    size: string;
    color: string;
  };
}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, itemDetails?: CartItem["itemDetails"]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  itemCount: number;
  subtotal: number;
  resetCart: () => void;
  initializeUserAndCart: () => Promise<void>;
}

// const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => { },
  removeItem: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  itemCount: 0,
  subtotal: 0,
  resetCart: () => { },
  initializeUserAndCart: async () => { }, // <- Expose here
});




export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserProfile>();

  const initializeUserAndCart = async () => {
    let userData: UserProfile | undefined;

    const userDetail = localStorage.getItem('user');
    if (userDetail) {
      userData = JSON.parse(userDetail);
    } else {
      try {
        userData = await fetchUserDetail(); // fetch only if not in localStorage
        localStorage.setItem('user', JSON.stringify(userData));
      } catch (error) {
        console.error("Failed to fetch user details:", error);
      }
    }

    if (userData) {
      setUser(userData);
      console.log("user ====", userData)
      await syncCartWithBackend(userData.uuid); // proceed to cart sync
    }
  };


  useEffect(() => {
    initializeUserAndCart();
  }, []);

  const resetCart = () => {
    setItems([]);
    setUser(undefined);
    localStorage.removeItem('kittyp-cart');
    localStorage.removeItem('user');
  };

  const syncCartWithBackend = async (userUuid: string) => {
    try {
      const response = await cartByUserUuid(userUuid);
      const orderItems = response.data[0].orderItems;
      const currency = response.data[0].currency;
      console.log("orderItems", response.data);
      if (!Array.isArray(orderItems)) {
        console.warn("orderItems is not an array:", orderItems);
        return;
      }

      const backendCartItems: CartItem[] = orderItems.map(item => ({
        ...item.product,
        quantity: item.quantity,
        currency: currency,
      }));

      setItems(backendCartItems);
      toast.success("Cart synced with server.");
    } catch (error) {
      console.error("Failed to sync cart with backend:", error);
      toast.error("Could not load your cart.");
    }
  };


  const persistCart = async (updatedItems: CartItem[]) => {
    if (!user) return;

    const orderItems: OrderItem[] = updatedItems.map((item) => ({
      productUuid: item.uuid,
      quantity: item.quantity,
      price: item.price,
      itemDetails: item.itemDetails || { size: "", color: "" },
    }));

    const payload: OrderPayload = {
      totalAmount: updatedItems.reduce((total, item) => total + item.price * item.quantity, 0).toString(),
      shippingAddress: getDefaultAddress(),
      billingAddress: getDefaultAddress(),
      orderItems,
    };

    try {
      await createCart(payload);
    } catch (err) {
      console.error('Failed to persist cart to backend', err);
    }
  };

  const getDefaultAddress = (): Address => ({
    street: 'default street',
    city: 'default city',
    state: 'default state',
    postalCode: '000000',
    country: 'India',
  });

  const addItem = (product: Product, itemDetails?: CartItem["itemDetails"]) => {
    setItems((currentItems) => {
      const existingItemIndex = currentItems.findIndex(item => item.uuid === product.uuid);

      let updatedItems: CartItem[];

      if (existingItemIndex > -1) {
        updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        toast.success(`Added another ${product.name} to your cart`);
      } else {
        updatedItems = [...currentItems, { ...product, quantity: 1, itemDetails }];
        toast.success(`Added ${product.name} to your cart`);
      }

      persistCart(updatedItems);
      return updatedItems;
    });
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter(item => item.uuid !== productId);
      const removedItem = currentItems.find(item => item.uuid === productId);
      if (removedItem) toast.info(`Removed ${removedItem.name} from your cart`);
      persistCart(updatedItems);
      return updatedItems;
    });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId);
      return;
    }

    setItems((currentItems) => {
      const updatedItems = currentItems.map(item =>
        item.uuid === productId ? { ...item, quantity } : item
      );
      persistCart(updatedItems);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    toast.info('Your cart has been cleared');
    persistCart([]); // Clear backend too
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  const subtotal = items.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, addItem, removeItem, updateQuantity, clearCart, itemCount, subtotal, resetCart, initializeUserAndCart }}
    >
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
