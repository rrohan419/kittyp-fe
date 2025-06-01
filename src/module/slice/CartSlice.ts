import { UserProfile } from "@/services/authService";
import { 
  CurrencyType, 
  ApiSuccessResponse,
  getCartByUser,
  addToCart as addToCartService,
  updateCartItem,
  removeFromCart,
  clearCart as clearCartService
} from "@/services/cartService";
import { fetchUserDetail } from "@/services/UserService";
import { createAsyncThunk, createSlice, PayloadAction } from "@reduxjs/toolkit";
import { toast } from "sonner";
import { Product } from "@/services/productService";
import { CartItemResponse as BaseCartItemResponse, CartResponse, CartService } from '@/services/cartService';

export type CartItemResponse = BaseCartItemResponse & {
  synced?: boolean;
  totalPrice: number;
};

// export interface CartResponse {
//   uuid: string;
//   items: CartItemResponse[];
//   totalAmount: number;
// }

export interface CartState {
  items: CartItemResponse[];
  user?: UserProfile;
  cartUuid: string;
  totalAmount: number;
  loading: boolean;
  isCartLoading: boolean;
  error: string | null;
  isGuestCart: boolean;
}

const initialState: CartState = {
  items: [],
  cartUuid: '',
  isCartLoading: false,
  totalAmount: 0,
  loading: false,
  error: null,
  user: undefined,
  isGuestCart: true
};

// Async thunks
export const initializeUserAndCart = createAsyncThunk(
  'cart/initializeUserAndCart',
  async (_, { dispatch, getState }) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return null;

    try {
      console.log('CartSlice - Starting initialization');
      
      // Get the current state to check for guest cart items
      const state = getState() as { cartReducer: CartState };
      const hasGuestItems = state.cartReducer.items.length > 0 && state.cartReducer.isGuestCart;

      // Always fetch user data on initialization
      const userData = await fetchUserDetail();
      console.log('CartSlice - User data fetched:', !!userData);
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch(setUser(userData));

      // If there are guest items, sync them with the backend cart
      if (hasGuestItems) {
        await dispatch(syncCartsAfterLogin()).unwrap();
      } else {
        // If no guest items, just fetch the backend cart
        const response = await getCartByUser(userData.uuid);
        console.log('CartSlice - Cart data fetched:', !!response);
        dispatch(setCart(response.data));
      }

      return userData;
    } catch (err) {
      console.error("Cart sync error:", err);
      throw err;
    }
  }
);

export const addItemToCart = createAsyncThunk(
  'cart/addItemToCart',
  async ({ userUuid, productUuid, quantity }: { userUuid: string; productUuid: string; quantity: number }, { dispatch }) => {
    try {
      const response = await addToCartService(userUuid, { productUuid, quantity });
      dispatch(setCart(response.data));
      toast.success("Item added to cart");
    } catch (err) {
      toast.error("Failed to add item to cart");
      throw err;
    }
  }
);

export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateCartItem',
  async ({ userUuid, productUuid, quantity }: { userUuid: string; productUuid: string; quantity: number }, { dispatch }) => {
    try {
      const response = await updateCartItem(userUuid, { productUuid, quantity });
      dispatch(setCart(response.data));
      toast.success("Cart updated");
    } catch (err) {
      toast.error("Failed to update cart");
      throw err;
    }
  }
);

export const removeItemFromCart = createAsyncThunk(
  'cart/removeItemFromCart',
  async ({ userUuid, productUuid }: { userUuid: string; productUuid: string }, { dispatch }) => {
    try {
      const response = await removeFromCart(userUuid, productUuid);
      dispatch(setCart(response.data));
      toast.success("Item removed from cart");
    } catch (err) {
      toast.error("Failed to remove item from cart");
      throw err;
    }
  }
);

export const clearCartThunk = createAsyncThunk(
  'cart/clearCart',
  async (userUuid: string, { dispatch }) => {
    try {
      await clearCartService(userUuid);
      dispatch(clearCart());
      toast.success("Cart cleared");
    } catch (err) {
      toast.error("Failed to clear cart");
      throw err;
    }
  }
);

export const resetCartThunk = createAsyncThunk(
  'cart/resetCartThunk',
  async (_, { dispatch }) => {
    try {
      const userUuid = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')!).uuid : null;
      if (userUuid) {
        await clearCartService(userUuid);
      }
      dispatch(resetCart());
      toast.success("Cart reset successfully");
    } catch (err) {
      toast.error("Failed to reset cart");
      throw err;
    }
  }
);

export const addToCartFromProduct = createAsyncThunk(
  'cart/addToCartFromProduct',
  async (product: Product, { getState, dispatch }) => {
    try {
      const state = getState() as { cartReducer: CartState };
      const accessToken = localStorage.getItem('access_token');

      // If user is logged in, add to backend cart
      if (accessToken) {
        let userUuid = state.cartReducer.user?.uuid;

        if (!userUuid) {
          try {
            const userData = await fetchUserDetail();
            localStorage.setItem('user', JSON.stringify(userData));
            dispatch(setUser(userData));
            userUuid = userData.uuid;
          } catch (error) {
            console.error('Failed to fetch user details:', error);
            throw new Error('Failed to initialize user. Please try logging in again.');
          }
        }

        if (!product.uuid) {
          throw new Error('Invalid product');
        }

        const response = await addToCartService(userUuid, { 
          productUuid: product.uuid, 
          quantity: 1 
        });
        
        dispatch(setCart(response.data));
        toast.success(`${product.name} added to cart`);
      } else {
        // If not logged in, add to local cart
        dispatch(addToCart(product));
        toast.success(`${product.name} added to cart`);
      }
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to add item to cart");
      throw err;
    }
  }
);

// Sync guest cart with user cart after login
export const syncGuestCartWithUser = createAsyncThunk(
  'cart/syncGuestCart',
  async (guestItems: CartItemResponse[], { dispatch, rejectWithValue }) => {
    try {
      const cartService = new CartService();
      
      // Add each guest cart item to the user's cart
      for (const item of guestItems) {
        await cartService.addToCart({
          productUuid: item.productUuid,
          quantity: item.quantity,
        });
      }

      // Mark items as synced
      return guestItems.map(item => ({
        productUuid: item.productUuid,
        productName: item.productName,
        price: item.price,
        quantity: item.quantity,
        totalPrice: item.price * item.quantity,
        synced: true
      }));
    } catch (error) {
      toast.error('Failed to sync cart with your account');
      return rejectWithValue('Failed to sync cart');
    }
  }
);

export const switchToGuestCart = createAsyncThunk(
  'cart/switchToGuestCart',
  async (_, { dispatch }) => {
    try {
      // Don't clear the backend cart, just switch to a new empty guest cart
      dispatch(createGuestCart());
      return true;
    } catch (error) {
      console.error('Failed to switch to guest cart:', error);
      throw error;
    }
  }
);

// Add this new thunk for syncing carts after login
export const syncCartsAfterLogin = createAsyncThunk(
  'cart/syncCartsAfterLogin',
  async (_, { getState, dispatch }) => {
    try {
      const state = getState() as { cartReducer: CartState };
      const guestCartItems = state.cartReducer.items;
      
      // First, fetch the user's existing cart from backend
      const userData = await fetchUserDetail();
      const backendCartResponse = await getCartByUser(userData.uuid);
      const backendCart = backendCartResponse.data;

      // If there are items in the guest cart, add them to the backend cart
      if (guestCartItems.length > 0) {
        for (const item of guestCartItems) {
          await addToCartService(userData.uuid, {
            productUuid: item.productUuid,
            quantity: item.quantity
          });
        }
        
        // Fetch the final merged cart
        const finalCartResponse = await getCartByUser(userData.uuid);
        dispatch(setCart(finalCartResponse.data));
        toast.success('Your cart has been synced successfully');
      } else {
        // If no guest items, just set the backend cart
        dispatch(setCart(backendCart));
      }

      return backendCart;
    } catch (error) {
      console.error('Failed to sync carts:', error);
      toast.error('Failed to sync your cart');
      throw error;
    }
  }
);

// Slice
export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    setUser(state, action: PayloadAction<UserProfile>) {
      state.user = action.payload;
      state.isGuestCart = false;
      state.error = null;
    },
    setCart(state, action: PayloadAction<CartResponse>) {
      state.items = action.payload.items || [];
      state.cartUuid = action.payload.uuid;
      state.totalAmount = action.payload.totalAmount || 0;
      state.isCartLoading = false;
      state.loading = false;
      state.isGuestCart = false;
      state.error = null;
    },
    createGuestCart(state) {
      state.items = [];
      state.totalAmount = 0;
      state.cartUuid = '';
      state.isCartLoading = false;
      state.loading = false;
      state.error = null;
      state.user = undefined;
      state.isGuestCart = true;
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      state.isCartLoading = false;
      state.loading = false;
      state.error = null;
    },
    resetCart(state) {
      return { ...initialState };
    },
    addToCart(state, action: PayloadAction<Product>) {
      const existingItem = state.items.find(item => item.productUuid === action.payload.uuid);
      if (existingItem) {
        existingItem.quantity += 1;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
      } else {
        state.items.push({
          productUuid: action.payload.uuid,
          productName: action.payload.name,
          price: action.payload.price,
          quantity: 1,
          totalPrice: action.payload.price,
        });
      }
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize User and Cart
      .addCase(initializeUserAndCart.pending, (state) => {
        // Don't set loading state for background sync
        state.error = null;
      })
      .addCase(initializeUserAndCart.fulfilled, (state) => {
        state.isCartLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeUserAndCart.rejected, (state, action) => {
        // Don't set error state for background sync
        state.isCartLoading = false;
        state.loading = false;
      })
      // Reset Cart
      .addCase(resetCartThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetCartThunk.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(resetCartThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to reset cart";
      })
      // Add to Cart from Product
      .addCase(addToCartFromProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addToCartFromProduct.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(addToCartFromProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to add item to cart";
      })
      // Handle guest cart sync
      .addCase(syncGuestCartWithUser.pending, (state) => {
        state.loading = true;
      })
      .addCase(syncGuestCartWithUser.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
        toast.success('Cart synced with your account');
      })
      .addCase(syncGuestCartWithUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Switch to guest cart
      .addCase(switchToGuestCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(switchToGuestCart.fulfilled, (state) => {
        state.loading = false;
      })
      .addCase(switchToGuestCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to switch to guest cart";
      });
  }
});

export const {
  setUser,
  setCart,
  clearCart,
  resetCart,
  addToCart,
  createGuestCart
} = cartSlice.actions;

export default cartSlice.reducer;
