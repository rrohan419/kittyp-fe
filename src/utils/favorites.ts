import { AppDispatch } from '@/module/store/store';
import { addToFavoritesThunk, removeFromFavoritesThunk } from '@/module/slice/FavoritesSlice';
import { Product } from '@/services/productService';
import { FavoriteProduct } from '@/services/favoritesService';
import { toast } from 'sonner';

export const handleToggleFavorite = async (
  dispatch: AppDispatch,
  userUuid: string | undefined,
  product: Product,
  favorites: FavoriteProduct[]
) => {
  if (!userUuid) {
    toast.error("Please login to add favorites");
    return;
  }

  try {
    if (favorites.some(item => item.uuid === product.uuid)) {
      await dispatch(removeFromFavoritesThunk({ userUuid, productUuid: product.uuid })).unwrap();
    } else {
      await dispatch(addToFavoritesThunk({ userUuid, product, category: product.category })).unwrap();
    }
  } catch (error) {
    console.error("Error toggling favorite:", error);
    toast.error("Failed to update favorites");
  }
}; 