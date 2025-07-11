import {
  createCart,
  OrderPayload,
  OrderItem,
  Address,
  CurrencyType,
  latestCartByUserUuid,
  Taxes
} from '@/services/cartService';
import { UserProfile } from '@/services/authService';
import { Product } from '@/services/productService';
import { createContext, useContext, useState, useEffect, ReactNode, useRef, useMemo } from 'react';
import { toast } from 'sonner';
import { useOrder } from './OrderContext';
import { fetchUserDetail } from '@/services/UserService';
import { useAppDispatch, useAppSelector } from '@/module/store/hooks';
import { setUserAccessToken, setUserData } from '@/module/slice/UserSlice';

export interface CartItem extends Product {
  quantity: number;
  itemDetails?: {
    size: string;
    color: string;
  };
  currency: CurrencyType;
  // subTotal: number;
  // totalAmount: number;
  // taxes: Taxes;

}

interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, itemDetails?: CartItem["itemDetails"]) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  setUser: (user : UserProfile) => void;
  itemCount: number;
  subtotal: number;
  resetCart: () => void;
  // initializeUserAndCart: () => Promise<void>;
  currency: CurrencyType;
  orderId: string;
  user: UserProfile | undefined;
  isCartLoading: boolean;
  
}

export const CartContext = createContext<CartContextType>({
  items: [],
  addItem: () => { },
  removeItem: () => { },
  updateQuantity: () => { },
  clearCart: () => { },
  setUser:()=> {},
  itemCount: 0,
  subtotal: 0,
  resetCart: () => { },
  // initializeUserAndCart: async () => { },
  currency: CurrencyType.INR,
  orderId: '',
  isCartLoading: true,
  user: undefined,
});

export const CartProvider = ({ children }: { children: ReactNode }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [user, setUser] = useState<UserProfile>();
  const [currency, setCurrency] = useState<CurrencyType>(CurrencyType.INR);
  const [orderId, setOrderId] = useState<string>('');
  const [isCartLoading, setIsCartLoading] = useState(true);
  const {taxes, totalValue} = useOrder();
  // const {accessToken, email} = useAppSelector((state) => state.userReducer);
  const dispatch = useAppDispatch();
  // const initializeUserAndCart = async () => {
  //   setIsCartLoading(true);
  //   let userData: UserProfile | undefined;
  //   const accessToken = localStorage.getItem('access_token');
  //   console.log("Access token", accessToken);
  //   if (accessToken) {
  //       try {
  //         userData = await fetchUserDetail();
  //         localStorage.setItem('user', JSON.stringify(userData));
  //         setUser(userData);
  //         dispatch(setUserData(userData));
  //         dispatch(setUserAccessToken(accessToken));
  //       } catch (error) {
  //         console.error("Failed to fetch user details:", error);
  //         toast.error("Failed to load user data.");
  //         setIsCartLoading(false);
  //         return;
  //       }
  //     // }
  //     if (userData?.uuid) {
  //       await syncCartWithBackend(userData.uuid);
  //     } else {
  //       setIsCartLoading(false); // If no user UUID, loading is done
  //     }
  //   } else {
  //     setIsCartLoading(false); // If no access token, no user to fetch
  //   }
  // };

  useEffect(() => {
    // initializeUserAndCart();
  }, []);


  const resetCart = () => {
    setItems([]);
    persistCart([], 0 ,null);
    // setUser(undefined);
    localStorage.removeItem('kittyp-cart');
    localStorage.removeItem('user');
  };

  const syncCartWithBackend = async (userUuid: string) => {
    try {
      const response = await latestCartByUserUuid(userUuid);
      const orderItems = response.data.orderItems;
      const currency = response.data.currency;
      // const orderId = response.data.orderNumber;

      console.log("orderItems", response.data);
      if (!Array.isArray(orderItems)) {
        console.warn("orderItems is not an array:", orderItems);
        return;
      }

      const backendCartItems: CartItem[] = orderItems.map(item => ({
        ...item.product,
        quantity: item.quantity,
        totalAmount: response.data.totalAmount,
        currency: currency,
        itemDetails: item.itemDetails
      }));

      setItems(backendCartItems);
      setCurrency(currency);
      setOrderId(response.data.orderNumber);
      toast.success("Cart synced with server.");
    } catch (error) {
      console.error("Failed to sync cart with backend:", error);
      toast.error("Could not load your cart.");
    }
  };


  const persistCart = async (updatedItems: CartItem[], totalAmount: number, taxes: Taxes) => {
    if (!user) return;

    const orderItems: OrderItem[] = updatedItems.map((item) => ({
      productUuid: item.uuid,
      quantity: item.quantity,
      price: item.price,
      itemDetails: item.itemDetails || { size: "", color: "" },
    }));

    const payload: OrderPayload = {
      // subTotal: updatedItems.reduce((total, item) => total + item.price * item.quantity, 0),
      subTotal: subtotal,
      totalAmount: totalAmount,

      taxes: taxes,
      currency: currency,
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


  // useEffect(() => {
  //   if (debounceRef.current) clearTimeout(debounceRef.current);

  //   debounceRef.current = setTimeout(() => {
  //     persistCart(items);
  //   }, 500); // 500ms debounce
  // }, [items]);


  const getDefaultAddress = (): Address => ({
    street: 'default street',
    city: 'default city',
    state: 'default state',
    postalCode: '000000',
    country: 'India',
  });

  const addItem = (product: Product, itemDetails?: CartItem["itemDetails"]) => {
    if (!product || !product.name) {
      console.error("Product is undefined or missing name:", product);
      return;
    }
    
    setItems((currentItems) => {
      // const existingItemIndex = currentItems.findIndex(item => item.uuid === product.uuid);
      const existingItemIndex = currentItems.findIndex(item =>
        item.uuid === product.uuid &&
        item.itemDetails?.size === itemDetails?.size &&
        item.itemDetails?.color === itemDetails?.color
      );

      let updatedItems: CartItem[];

      if (existingItemIndex > -1) {
        updatedItems = [...currentItems];
        updatedItems[existingItemIndex].quantity += 1;
        toast.success(`Added another ${product.name} to your cart`);
      } else {
        // updatedItems = [...currentItems, { ...product, quantity: 1, itemDetails, }];
        updatedItems = [...currentItems, {
          ...product,
          quantity: 1,
          itemDetails,
          currency,
        }];
        toast.success(`Added ${product.name} to your cart`);
      }

      persistCart(updatedItems, 0, null);
      return updatedItems;
    });

    
  };

  const removeItem = (productId: string) => {
    setItems((currentItems) => {
      const updatedItems = currentItems.filter(item => item.uuid !== productId);
      const removedItem = currentItems.find(item => item.uuid === productId);
      if (removedItem) toast.info(`Removed ${removedItem.name} from your cart`);
      persistCart(updatedItems, 0, null);
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
      persistCart(updatedItems, totalValue, taxes);
      return updatedItems;
    });
  };

  const clearCart = () => {
    setItems([]);
    toast.info('Your cart has been cleared');
    persistCart([],0, null); // Clear backend too
  };

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);
  // setSubtotal(items.reduce((total, item) => total + item.price * item.quantity, 0));
  const subtotal = useMemo(() =>
    items.reduce((total, item) => total + item.price * item.quantity, 0),
    [items]
  );
  

  return (
    <CartContext.Provider
      value={{ user, setUser, items, subtotal, isCartLoading, addItem, removeItem, updateQuantity, clearCart, itemCount, resetCart, currency, orderId}}
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

