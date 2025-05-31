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

export interface CartItemResponse {
  productUuid: string;
  productName: string;
  price: number;
  quantity: number;
  totalPrice: number;
  productImageUrl?: string;
  uuid?: string;
}

export interface CartResponse {
  uuid: string;
  items: CartItemResponse[];
  totalAmount: number;
}

export interface CartState {
  items: CartItemResponse[];
  user?: UserProfile;
  cartUuid: string;
  isCartLoading: boolean;
  totalAmount: number;
  loading: boolean;
  error: string | null;
}

const initialState: CartState = {
  items: [],
  user: undefined,
  cartUuid: '',
  isCartLoading: true,
  totalAmount: 0,
  loading: false,
  error: null
};

// Async thunks
export const initializeUserAndCart = createAsyncThunk(
  'cart/initializeUserAndCart',
  async (_, { dispatch, getState }) => {
    const accessToken = localStorage.getItem('access_token');
    if (!accessToken) return null;

    try {
      console.log('CartSlice - Starting initialization');
      
      // Always fetch user data on initialization
      const userData = await fetchUserDetail();
      console.log('CartSlice - User data fetched:', !!userData);
      
      localStorage.setItem('user', JSON.stringify(userData));
      dispatch(setUser(userData));

      const response = await getCartByUser(userData.uuid);
      console.log('CartSlice - Cart data fetched:', !!response);
      
      dispatch(setCart(response.data));
      return response.data;
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
      const accessToken = localStorage.getItem('access_token');
      if (!accessToken) {
        throw new Error('Please login to add items to cart');
      }

      const state = getState() as { cartReducer: CartState };
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
    } catch (err) {
      const error = err as Error;
      toast.error(error.message || "Failed to add item to cart");
      throw err;
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
      state.error = null;
    },
    setCart(state, action: PayloadAction<CartResponse>) {
      state.items = action.payload.items || [];
      state.cartUuid = action.payload.uuid;
      state.totalAmount = action.payload.totalAmount || 0;
      state.isCartLoading = false;
      state.loading = false;
      state.error = null;
    },
    clearCart(state) {
      state.items = [];
      state.totalAmount = 0;
      state.isCartLoading = false;
      state.loading = false;
      state.error = null;
    },
    resetCart(state) {
      state.items = [];
      state.user = undefined;
      state.cartUuid = '';
      state.totalAmount = 0;
      state.isCartLoading = false;
      state.loading = false;
      state.error = null;
      localStorage.removeItem('user');
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
          productImageUrl: action.payload.productImageUrls?.[0]
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
      });
  }
});

export const {
  setUser,
  setCart,
  clearCart,
  resetCart,
  addToCart
} = cartSlice.actions;

export default cartSlice.reducer;
