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
import { Product, fetchProductByUuid } from "@/services/productService";
import { CartItemResponse as BaseCartItemResponse, CartResponse, CartService } from '@/services/cartService';
import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/module/store/store';

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
  isSyncing: boolean;
}

const initialState: CartState = {
  items: [],
  cartUuid: '',
  isCartLoading: false,
  totalAmount: 0,
  loading: false,
  error: null,
  user: undefined,
  isGuestCart: true,
  isSyncing: false
};

// Memoized selectors
export const selectCartState = (state: RootState) => state.cartReducer;

export const selectCartItems = createSelector(
  selectCartState,
  (cart) => cart.items
);

export const selectCartTotalAmount = createSelector(
  selectCartState,
  (cart) => cart.totalAmount
);

export const selectCartLoading = createSelector(
  [selectCartState],
  (cart) => cart.loading || cart.isCartLoading
);

export const selectCartUser = createSelector(
  selectCartState,
  (cart) => cart.user
);

export const selectCartSyncStatus = createSelector(
  selectCartState,
  (cart) => cart.isSyncing
);

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

      // If there are guest items, start background sync
      if (hasGuestItems) {
        // Start background sync without waiting
        dispatch(backgroundSyncCarts());
        
        // Return early with just the user data
        return userData;
      }

      // If no guest items, just fetch the backend cart
      const response = await getCartByUser(userData.uuid);
      console.log('CartSlice - Cart data fetched:', !!response);
      dispatch(setCart(response.data));

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
      // toast.success("Cart reset successfully");
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
      // Get current state and check auth token once
      const state = getState() as { cartReducer: CartState };
      const accessToken = localStorage.getItem('access_token');
      const isLoggedIn = !!accessToken;

      // Early validation for stock
      if (product.stockQuantity <= 0) {
        toast.error(`${product.name} is out of stock`);
        return;
      }

      // Check current cart quantity once
      const existingItem = state.cartReducer.items.find(item => item.productUuid === product.uuid);
      const currentQuantity = existingItem?.quantity || 0;

      // Early validation for max quantity
      if (currentQuantity >= product.stockQuantity) {
        toast.warning(`Cannot add more ${product.name}. Maximum available quantity (${product.stockQuantity}) reached.`);
        return;
      }

      // Handle guest cart early if not logged in
      if (!isLoggedIn) {
        if (currentQuantity + 1 <= product.stockQuantity) {
          dispatch(addToCart(product));
          toast.success(`${product.name} added to cart`);
        }
        return;
      }

      // For logged-in users
      let userUuid = state.cartReducer.user?.uuid;

      // Only fetch user data if needed
      if (!userUuid) {
        const userData = await fetchUserDetail();
        localStorage.setItem('user', JSON.stringify(userData));
        dispatch(setUser(userData));
        userUuid = userData.uuid;
      }

      // Add to cart
      const response = await addToCartService(userUuid!, { 
        productUuid: product.uuid, 
        quantity: 1 
      });
      
      dispatch(setCart(response.data));
      toast.success(`${product.name} added to cart`);
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
        ...item,
        synced: true,
        currency: item.currency || CurrencyType.INR // Add currency with fallback
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
          try {
            // Fetch current product data to check availability
            const productResponse = await fetchProductByUuid(item.productUuid);
            const product = productResponse.data;
            
            // Check if product exists and is active
            if (!product || product.stockQuantity === undefined) {
              toast.error(`${item.productName} is no longer available`);
              continue;
            }

            // Find if this product already exists in backend cart
            const existingBackendItem = backendCart.items.find(
              backendItem => backendItem.productUuid === item.productUuid
            );
            const currentBackendQuantity = existingBackendItem?.quantity || 0;

            // Calculate how many more items we can add
            const remainingStock = Math.max(0, product.stockQuantity - currentBackendQuantity);

            if (remainingStock <= 0) {
              toast.error(`${item.productName} is out of stock`);
              continue;
            }

            // Calculate the quantity we can actually add
            const quantityToAdd = Math.min(item.quantity, remainingStock);
            
            if (quantityToAdd < item.quantity) {
              toast.warning(
                `Only added ${quantityToAdd} units of ${item.productName} (${remainingStock} available)`
              );
            }

            if (quantityToAdd > 0) {
              await addToCartService(userData.uuid, {
                productUuid: item.productUuid,
                quantity: quantityToAdd
              });
            }
          } catch (error) {
            console.error(`Failed to sync item ${item.productName}:`, error);
            toast.error(`Failed to sync ${item.productName}`);
          }
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

// Background sync thunk
export const backgroundSyncCarts = createAsyncThunk(
  'cart/backgroundSyncCarts',
  async (_, { getState, dispatch }) => {
    try {
      const state = getState() as { cartReducer: CartState };
      const guestCartItems = state.cartReducer.items;
      
      // First, fetch the user's existing cart from backend
      const userData = await fetchUserDetail();
      const backendCartResponse = await getCartByUser(userData.uuid);
      const backendCart = backendCartResponse.data;

      // Start with backend cart
      dispatch(setCart(backendCart));

      // If there are items in the guest cart, add them to the backend cart
      if (guestCartItems.length > 0) {
        let syncedItems = 0;
        let failedItems = 0;

        for (const item of guestCartItems) {
          try {
            // Fetch current product data to check availability
            const productResponse = await fetchProductByUuid(item.productUuid);
            const product = productResponse.data;
            
            if (!product || product.stockQuantity === undefined) {
              failedItems++;
              continue;
            }

            // Find if this product already exists in backend cart
            const existingBackendItem = backendCart.items.find(
              backendItem => backendItem.productUuid === item.productUuid
            );
            const currentBackendQuantity = existingBackendItem?.quantity || 0;
            const remainingStock = Math.max(0, product.stockQuantity - currentBackendQuantity);

            if (remainingStock <= 0) {
              failedItems++;
              continue;
            }

            // Calculate the quantity we can actually add
            const quantityToAdd = Math.min(item.quantity, remainingStock);
            
            if (quantityToAdd > 0) {
              await addToCartService(userData.uuid, {
                productUuid: item.productUuid,
                quantity: quantityToAdd
              });
              syncedItems++;
            }
          } catch (error) {
            console.error(`Failed to sync item ${item.productName}:`, error);
            failedItems++;
          }
        }
        
        // Fetch the final merged cart
        const finalCartResponse = await getCartByUser(userData.uuid);
        dispatch(setCart(finalCartResponse.data));

        // Show a summary toast only if there were items to sync
        if (syncedItems > 0 || failedItems > 0) {
          const message = [];
          if (syncedItems > 0) message.push(`${syncedItems} items synced`);
          if (failedItems > 0) message.push(`${failedItems} items couldn't be synced`);
          toast.success('Cart Sync Complete', {
            description: message.join(', '),
          });
        }
      }

      return backendCart;
    } catch (error) {
      console.error('Failed to sync carts:', error);
      // Don't show error toast here as this is a background process
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
      
      // Check if adding would exceed available stock
      if (existingItem) {
        if (existingItem.quantity < action.payload.stockQuantity) {
          existingItem.quantity += 1;
          existingItem.totalPrice = existingItem.price * existingItem.quantity;
        }
      } else {
        if (action.payload.stockQuantity > 0) {
          state.items.push({
            productUuid: action.payload.uuid,
            productName: action.payload.name,
            price: action.payload.price,
            quantity: 1,
            totalPrice: action.payload.price,
            productImageUrls: action.payload.productImageUrls,
            currency: action.payload.currency,
          });
        }
      }
      state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
    },
    updateCartQuantity(state, action: PayloadAction<{uuid: string, quantity: number}>) {
      const existingItem = state.items.find(item => item.productUuid === action.payload.uuid);
      if (existingItem) {
        existingItem.quantity = action.payload.quantity;
        existingItem.totalPrice = existingItem.price * existingItem.quantity;
        state.totalAmount = state.items.reduce((total, item) => total + item.totalPrice, 0);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Initialize User and Cart
      .addCase(initializeUserAndCart.pending, (state) => {
        state.error = null;
      })
      .addCase(initializeUserAndCart.fulfilled, (state) => {
        state.isCartLoading = false;
        state.loading = false;
        state.error = null;
      })
      .addCase(initializeUserAndCart.rejected, (state, action) => {
        state.isCartLoading = false;
        state.loading = false;
      })
      // Background sync cases
      .addCase(backgroundSyncCarts.pending, (state) => {
        state.isSyncing = true;
        state.error = null;
      })
      .addCase(backgroundSyncCarts.fulfilled, (state) => {
        state.isSyncing = false;
        state.error = null;
      })
      .addCase(backgroundSyncCarts.rejected, (state) => {
        state.isSyncing = false;
        // Don't set error state as this is a background process
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
  createGuestCart,
  updateCartQuantity
} = cartSlice.actions;

export default cartSlice.reducer;
